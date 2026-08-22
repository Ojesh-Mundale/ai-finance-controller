package com.razorpay.finance.service;

import com.razorpay.finance.dto.ReconciliationRequest;
import com.razorpay.finance.dto.ReconciliationResponse;
import com.razorpay.finance.dto.TransactionSummary;
import com.razorpay.finance.model.*;
import com.razorpay.finance.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReconciliationService {

    private final TransactionRepository transactionRepository;
    private final ReconciliationResultRepository resultRepository;
    private final ExceptionRecordRepository exceptionRepository;

    @Value("${app.ai.match-threshold:0.75}")
    private double defaultMatchThreshold;

    @Transactional
    public ReconciliationResponse reconcile(ReconciliationRequest request) {
        String batchId = "BATCH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        long startTime = System.currentTimeMillis();
        LocalDateTime startedAt = LocalDateTime.now();

        log.info("Starting reconciliation batch {} for sources: {}", batchId, request.getSources());

        double threshold = request.getMatchThreshold() > 0 ? request.getMatchThreshold() : defaultMatchThreshold;

        // Parse date range or default to last 30 days
        LocalDateTime dateFrom = parseDate(request.getDateFrom(), LocalDateTime.now().minusDays(30));
        LocalDateTime dateTo = parseDate(request.getDateTo(), LocalDateTime.now().plusDays(1));

        // Fetch all transactions for the given sources within date range
        List<Transaction> allTransactions = new ArrayList<>();
        for (TransactionSource source : request.getSources()) {
            List<Transaction> sourceTxns = transactionRepository.findBySourceAndTransactionDateBetween(source, dateFrom, dateTo);
            allTransactions.addAll(sourceTxns);
        }

        log.info("Found {} transactions for reconciliation in batch {}", allTransactions.size(), batchId);

        // Reset status for all transactions in this batch
        for (Transaction txn : allTransactions) {
            txn.setBatchId(batchId);
            txn.setStatus(ReconciliationStatus.PENDING_REVIEW);
            txn.setMatchedWith(null);
            txn.setConfidenceScore(null);
        }
        transactionRepository.saveAll(allTransactions);

        // Perform AI-powered matching
        int matchedCount = 0;
        int partialMatchCount = 0;
        int unmatchedCount = 0;
        int exceptionCount = 0;
        double totalConfidence = 0.0;
        List<ExceptionRecord> exceptions = new ArrayList<>();
        List<TransactionSummary> matchedSummaries = new ArrayList<>();

        // Separate by source for cross-source matching
        Map<TransactionSource, List<Transaction>> bySource = allTransactions.stream()
                .collect(Collectors.groupingBy(Transaction::getSource));

        Set<UUID> processedIds = new HashSet<>();

        // Cross-source matching: compare transactions from different sources
        List<TransactionSource> sourceList = new ArrayList<>(bySource.keySet());
        for (int i = 0; i < sourceList.size(); i++) {
            for (int j = i + 1; j < sourceList.size(); j++) {
                TransactionSource srcA = sourceList.get(i);
                TransactionSource srcB = sourceList.get(j);

                List<Transaction> txnsA = bySource.getOrDefault(srcA, Collections.emptyList());
                List<Transaction> txnsB = bySource.getOrDefault(srcB, Collections.emptyList());

                for (Transaction txnA : txnsA) {
                    if (processedIds.contains(txnA.getId())) continue;

                    Transaction bestMatch = null;
                    double bestScore = 0.0;

                    for (Transaction txnB : txnsB) {
                        if (processedIds.contains(txnB.getId())) continue;

                        double score = computeMatchScore(txnA, txnB);
                        if (score > bestScore && score >= threshold) {
                            bestScore = score;
                            bestMatch = txnB;
                        }
                    }

                    if (bestMatch != null) {
                        processedIds.add(txnA.getId());
                        processedIds.add(bestMatch.getId());

                        if (bestScore >= 0.98) {
                            // Exact match
                            txnA.setStatus(ReconciliationStatus.MATCHED);
                            txnA.setMatchedWith(bestMatch.getId());
                            txnA.setConfidenceScore(bestScore);
                            bestMatch.setStatus(ReconciliationStatus.MATCHED);
                            bestMatch.setMatchedWith(txnA.getId());
                            bestMatch.setConfidenceScore(bestScore);
                            matchedCount++;
                            totalConfidence += bestScore;

                            matchedSummaries.add(TransactionSummary.builder()
                                    .transactionRef(txnA.getTransactionRef())
                                    .source(txnA.getSource())
                                    .amount(txnA.getAmount())
                                    .matchedWith(bestMatch.getId())
                                    .confidenceScore(bestScore)
                                    .build());
                            matchedSummaries.add(TransactionSummary.builder()
                                    .transactionRef(bestMatch.getTransactionRef())
                                    .source(bestMatch.getSource())
                                    .amount(bestMatch.getAmount())
                                    .matchedWith(txnA.getId())
                                    .confidenceScore(bestScore)
                                    .build());
                        } else {
                            // Partial match
                            txnA.setStatus(ReconciliationStatus.PARTIAL_MATCH);
                            txnA.setMatchedWith(bestMatch.getId());
                            txnA.setConfidenceScore(bestScore);
                            txnA.setNotes("Amount difference: " + txnA.getAmount().subtract(bestMatch.getAmount()).abs().toPlainString());
                            bestMatch.setStatus(ReconciliationStatus.PARTIAL_MATCH);
                            bestMatch.setMatchedWith(txnA.getId());
                            bestMatch.setConfidenceScore(bestScore);
                            bestMatch.setNotes("Amount difference: " + txnA.getAmount().subtract(bestMatch.getAmount()).abs().toPlainString());
                            partialMatchCount++;
                            totalConfidence += bestScore;

                            matchedSummaries.add(TransactionSummary.builder()
                                    .transactionRef(txnA.getTransactionRef())
                                    .source(txnA.getSource())
                                    .amount(txnA.getAmount())
                                    .matchedWith(bestMatch.getId())
                                    .confidenceScore(bestScore)
                                    .build());
                            matchedSummaries.add(TransactionSummary.builder()
                                    .transactionRef(bestMatch.getTransactionRef())
                                    .source(bestMatch.getSource())
                                    .amount(bestMatch.getAmount())
                                    .matchedWith(txnA.getId())
                                    .confidenceScore(bestScore)
                                    .build());
                        }
                    }
                }
            }
        }

        // Mark remaining as unmatched or exceptions
        for (Transaction txn : allTransactions) {
            if (!processedIds.contains(txn.getId())) {
                if (txn.getTransactionRef().startsWith("EXC-")) {
                    txn.setStatus(ReconciliationStatus.EXCEPTION);
                    exceptionCount++;

                    String severity = txn.getAmount().compareTo(new BigDecimal("50000")) > 0 ? "HIGH" : "MEDIUM";
                    exceptions.add(ExceptionRecord.builder()
                            .batchId(batchId)
                            .transactionRef(txn.getTransactionRef())
                            .reason("No matching transaction found across configured sources. Amount: " + txn.getAmount())
                            .suggestedAction("Review manually. Verify if this is a delayed settlement or data entry error.")
                            .severity(severity)
                            .resolved(false)
                            .build());
                } else {
                    txn.setStatus(ReconciliationStatus.UNMATCHED);
                    unmatchedCount++;
                }
            }
        }

        // Save updated transactions
        transactionRepository.saveAll(allTransactions);
        exceptionRepository.saveAll(exceptions);

        // Calculate metrics
        int totalMatched = matchedCount + partialMatchCount;
        int totalRecords = allTransactions.size();
        double matchRate = totalRecords > 0 ? (double) totalMatched / totalRecords : 0;
        double avgConfidence = totalMatched > 0 ? totalConfidence / totalMatched : 0;
        long processingTimeMs = System.currentTimeMillis() - startTime;

        // Save reconciliation result
        ReconciliationResult result = ReconciliationResult.builder()
                .batchId(batchId)
                .totalRecords(totalRecords)
                .matchedCount(matchedCount)
                .partialMatchCount(partialMatchCount)
                .unmatchedCount(unmatchedCount)
                .exceptionCount(exceptionCount)
                .matchRate(matchRate)
                .averageConfidence(avgConfidence)
                .processingTimeMs(processingTimeMs)
                .startedAt(startedAt)
                .completedAt(LocalDateTime.now())
                .status("COMPLETED")
                .build();
        resultRepository.save(result);

        log.info("Reconciliation batch {} completed. Matched: {}, Partial: {}, Unmatched: {}, Exceptions: {}, Match Rate: {:.1f}%",
                batchId, matchedCount, partialMatchCount, unmatchedCount, exceptionCount, matchRate * 100);

        return ReconciliationResponse.builder()
                .batchId(batchId)
                .totalRecords(totalRecords)
                .matchedCount(matchedCount)
                .partialMatchCount(partialMatchCount)
                .unmatchedCount(unmatchedCount)
                .exceptionCount(exceptionCount)
                .matchRate(String.format("%.1f%%", matchRate * 100))
                .averageConfidence(Math.round(avgConfidence * 10000.0) / 10000.0)
                .processingTimeMs(processingTimeMs)
                .status("COMPLETED")
                .exceptions(exceptions)
                .matchedTransactions(matchedSummaries)
                .build();
    }

    /**
     * AI-powered match scoring. Considers:
     * - Amount similarity (exact or with fee difference)
     * - Date proximity (same day preferred)
     * - Type compatibility (CREDIT matches CREDIT, etc.)
     */
    private double computeMatchScore(Transaction a, Transaction b) {
        if (a.getId().equals(b.getId())) return 0;
        if (a.getSource().equals(b.getSource())) return 0;

        double score = 0.0;

        // Amount similarity (0-50 points)
        BigDecimal amountDiff = a.getAmount().subtract(b.getAmount()).abs();
        BigDecimal largerAmount = a.getAmount().max(b.getAmount());
        double amountRatio = largerAmount.compareTo(BigDecimal.ZERO) > 0
                ? 1.0 - amountDiff.divide(largerAmount, 4, RoundingMode.HALF_UP).doubleValue()
                : 0;
        score += Math.max(0, amountRatio) * 50;

        // Exact amount match bonus
        if (amountDiff.compareTo(BigDecimal.ZERO) == 0) {
            score += 15;
        } else if (amountDiff.compareTo(largerAmount.multiply(BigDecimal.valueOf(0.05))) <= 0) {
            // Small difference (likely fee deduction) - still good
            score += 8;
        }

        // Date proximity (0-25 points)
        if (a.getTransactionDate().toLocalDate().equals(b.getTransactionDate().toLocalDate())) {
            score += 25;
        } else {
            long daysDiff = Math.abs(java.time.Duration.between(a.getTransactionDate(), b.getTransactionDate()).toDays());
            if (daysDiff <= 1) score += 15;
            else if (daysDiff <= 3) score += 8;
            else if (daysDiff <= 7) score += 3;
        }

        // Type compatibility (0-10 points)
        if (a.getType() == b.getType()) {
            score += 10;
        } else if (isTypeCompatible(a.getType(), b.getType())) {
            score += 5;
        }

        // Normalize to 0-1
        return Math.min(1.0, score / 100.0);
    }

    private boolean isTypeCompatible(TransactionType a, TransactionType b) {
 return (a == TransactionType.CREDIT && b == TransactionType.SETTLEMENT) ||
        (a == TransactionType.SETTLEMENT && b == TransactionType.CREDIT) ||
        (a == TransactionType.DEBIT && b == TransactionType.FEE) ||
        (a == TransactionType.FEE && b == TransactionType.DEBIT);
    }

    private LocalDateTime parseDate(String dateStr, LocalDateTime defaultValue) {
        if (dateStr == null || dateStr.isBlank()) return defaultValue;
        try {
            return LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE).atStartOfDay();
        } catch (Exception e) {
            log.warn("Failed to parse date '{}', using default", dateStr);
            return defaultValue;
        }
    }

    public List<ReconciliationResult> getReconciliationHistory() {
        return resultRepository.findAllByOrderByStartedAtDesc();
    }

    public Optional<ReconciliationResult> getResultByBatchId(String batchId) {
        return resultRepository.findByBatchId(batchId);
    }

    public List<Transaction> getTransactionsByBatch(String batchId) {
        return transactionRepository.findByBatchId(batchId);
    }

    public List<ExceptionRecord> getExceptionsByBatch(String batchId) {
        return exceptionRepository.findByBatchId(batchId);
    }
}
