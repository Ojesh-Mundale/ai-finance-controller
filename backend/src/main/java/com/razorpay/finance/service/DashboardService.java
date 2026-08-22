package com.razorpay.finance.service;

import com.razorpay.finance.dto.DashboardMetrics;
import com.razorpay.finance.model.*;
import com.razorpay.finance.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final TransactionRepository transactionRepository;
    private final ReconciliationResultRepository resultRepository;
    private final ExceptionRecordRepository exceptionRepository;
    private final CashPositionRepository cashPositionRepository;

    public DashboardMetrics getMetrics() {
        long totalTransactions = transactionRepository.count();

        long matched = transactionRepository.countByStatus(ReconciliationStatus.MATCHED);
        long partialMatched = transactionRepository.countByStatus(ReconciliationStatus.PARTIAL_MATCH);
        long totalMatched = matched + partialMatched;

        String matchRate = totalTransactions > 0
                ? String.format("%.1f%%", (double) totalMatched / totalTransactions * 100)
                : "0.0%";

        double avgConfidence = 0.0;
        List<Transaction> matchedTxns = transactionRepository.findByStatus(ReconciliationStatus.MATCHED);
        if (!matchedTxns.isEmpty()) {
            avgConfidence = matchedTxns.stream()
                    .filter(t -> t.getConfidenceScore() != null)
                    .mapToDouble(Transaction::getConfidenceScore)
                    .average()
                    .orElse(0.0);
        }

        long exceptionCount = transactionRepository.countByStatus(ReconciliationStatus.EXCEPTION)
                + exceptionRepository.findByResolvedFalse().size();

        BigDecimal pendingSettlements = BigDecimal.ZERO;
        List<Transaction> settlements = transactionRepository.findByStatus(ReconciliationStatus.PENDING_REVIEW);
        pendingSettlements = settlements.stream()
                .filter(t -> t.getType() == TransactionType.SETTLEMENT)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cashPosition = BigDecimal.ZERO;
        Optional<CashPosition> latestPosition = cashPositionRepository.findTopByOrderByAsOfDateDesc();
        if (latestPosition.isPresent()) {
            cashPosition = latestPosition.get().getClosingBalance();
        } else {
            // Calculate from transactions as fallback
            List<Transaction> credits = transactionRepository.findByStatus(ReconciliationStatus.MATCHED).stream()
                    .filter(t -> t.getType() == TransactionType.CREDIT || t.getType() == TransactionType.SETTLEMENT)
                    .toList();
            List<Transaction> debits = transactionRepository.findByStatus(ReconciliationStatus.MATCHED).stream()
                    .filter(t -> t.getType() == TransactionType.DEBIT || t.getType() == TransactionType.FEE)
                    .toList();
            BigDecimal totalCredits = credits.stream().map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalDebits = debits.stream().map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            cashPosition = totalCredits.subtract(totalDebits);
        }

        // Processing throughput (records per second from last reconciliation)
        double throughput = 0.0;
        LocalDateTime lastReconciliationTime = null;
        List<ReconciliationResult> results = resultRepository.findAllByOrderByStartedAtDesc();
        if (!results.isEmpty()) {
            ReconciliationResult last = results.get(0);
            lastReconciliationTime = last.getCompletedAt();
            if (last.getProcessingTimeMs() > 0) {
                throughput = (double) last.getTotalRecords() / (last.getProcessingTimeMs() / 1000.0);
            }
        }

        return DashboardMetrics.builder()
                .totalTransactions(totalTransactions)
                .matchRate(matchRate)
                .avgConfidence(Math.round(avgConfidence * 10000.0) / 10000.0)
                .exceptionCount(exceptionCount)
                .pendingSettlements(pendingSettlements)
                .cashPosition(cashPosition)
                .processingThroughput(Math.round(throughput * 100.0) / 100.0)
                .lastReconciliationTime(lastReconciliationTime)
                .build();
    }
}
