package com.razorpay.finance.service;

import com.razorpay.finance.dto.SettlementQARequest;
import com.razorpay.finance.dto.SettlementQAResponse;
import com.razorpay.finance.model.*;
import com.razorpay.finance.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SettlementQAService {

    private final TransactionRepository transactionRepository;
    private final ExceptionRecordRepository exceptionRepository;
    private final ReconciliationResultRepository resultRepository;
    private final CashPositionRepository cashPositionRepository;

    /**
     * Simulated AI-powered Q&A for settlement queries.
     * In production, this would call an actual LLM with RAG over transaction data.
     */
    public SettlementQAResponse answerQuestion(SettlementQARequest request) {
        String question = request.getQuestion().toLowerCase();
        List<String> sources = new ArrayList<>();
        List<String> relatedTxns = new ArrayList<>();
        String answer;
        double confidence;

        // Pattern matching for common questions
        if (question.contains("unmatched") || question.contains("exception")) {
            List<Transaction> exceptions = transactionRepository.findByStatus(ReconciliationStatus.EXCEPTION);
            List<Transaction> unmatched = transactionRepository.findByStatus(ReconciliationStatus.UNMATCHED);
            int total = exceptions.size() + unmatched.size();
            BigDecimal totalAmount = exceptions.stream()
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            totalAmount = totalAmount.add(unmatched.stream()
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));

            answer = String.format("Found %d unresolved transactions (exceptions + unmatched) with a total value of INR %,.2f. " +
                    "%d are flagged as exceptions requiring manual review, and %d are unmatched. " +
                    "The exceptions include records from bank statements, payment gateway, UPI, and internal ledger sources. " +
                    "Recommended action: Review the exception queue in the reconciliation dashboard and resolve items in priority order (HIGH severity first).",
                    total, totalAmount, exceptions.size(), unmatched.size());
            confidence = 0.92;
            sources.add("Reconciliation Engine");
            sources.add("Exception Records");
            exceptions.forEach(e -> relatedTxns.add(e.getTransactionRef()));
            unmatched.stream().limit(10).forEach(e -> relatedTxns.add(e.getTransactionRef()));

        } else if (question.contains("match rate") || question.contains("match rate")) {
            long total = transactionRepository.count();
            long matched = transactionRepository.countByStatus(ReconciliationStatus.MATCHED);
            long partial = transactionRepository.countByStatus(ReconciliationStatus.PARTIAL_MATCH);
            double rate = total > 0 ? (double)(matched + partial) / total * 100 : 0;

            answer = String.format("The current reconciliation match rate is %.1f%%. Out of %d total transactions: " +
                    "%d are fully matched, %d are partial matches (likely fee differences), " +
                    "%d are unmatched, and %d are exceptions. " +
                    "The average confidence score for matched transactions is being tracked across all reconciliation batches.",
                    rate, total, matched, partial,
                    transactionRepository.countByStatus(ReconciliationStatus.UNMATCHED),
                    transactionRepository.countByStatus(ReconciliationStatus.EXCEPTION));
            confidence = 0.95;
            sources.add("Reconciliation Results");

        } else if (question.contains("cash") || question.contains("balance") || question.contains("position")) {
            Optional<CashPosition> latest = cashPositionRepository.findTopByOrderByAsOfDateDesc();
            if (latest.isPresent()) {
                CashPosition cp = latest.get();
                answer = String.format("As of %s, the cash position is INR %,.2f. " +
                        "Opening balance: INR %,.2f, Total inflows: INR %,.2f, Total outflows: INR %,.2f. " +
                        "Pending settlements: INR %,.2f. " +
                        (cp.getForecastedBalance() != null ? "Forecasted balance for tomorrow: INR %,.2f." : "No forecast available."),
                        cp.getAsOfDate().format(DateTimeFormatter.ISO_LOCAL_DATE),
                        cp.getClosingBalance(), cp.getOpeningBalance(),
                        cp.getTotalInflows(), cp.getTotalOutflows(),
                        cp.getPendingSettlements(),
                        cp.getForecastedBalance() != null ? cp.getForecastedBalance() : BigDecimal.ZERO);
                confidence = 0.89;
            } else {
                answer = "Cash position data is not yet available. Please run a reconciliation first to generate cash position data.";
                confidence = 0.7;
            }
            sources.add("Cash Position Service");

        } else if (question.contains("settlement") && (question.contains("today") || question.contains("pending"))) {
            LocalDate today = LocalDate.now();
            List<Transaction> pending = transactionRepository.findByStatus(ReconciliationStatus.PENDING_REVIEW).stream()
                    .filter(t -> t.getType() == TransactionType.SETTLEMENT)
                    .filter(t -> t.getTransactionDate().toLocalDate().equals(today))
                    .toList();
            BigDecimal pendingAmount = pending.stream().map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

            answer = String.format("There are %d pending settlements for today totaling INR %,.2f. " +
                    "These transactions are awaiting reconciliation. Once matched with corresponding bank credits, they will be marked as settled. " +
                    "Expected settlement T+1 for standard transactions, T+2 for international payments.",
                    pending.size(), pendingAmount);
            confidence = 0.87;
            sources.add("Transaction Ledger");
            pending.forEach(t -> relatedTxns.add(t.getTransactionRef()));

        } else if (question.contains("fee") || question.contains("charge") || question.contains("commission")) {
            List<Transaction> fees = transactionRepository.findAll().stream()
                    .filter(t -> t.getType() == TransactionType.FEE)
                    .toList();
            BigDecimal totalFees = fees.stream().map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            double feeRatio = transactionRepository.count() > 0
                    ? (double) fees.size() / transactionRepository.count() * 100 : 0;

            answer = String.format("Total fees and charges across all transactions: INR %,.2f (%d fee entries, %.1f%% of all transactions). " +
                    "Fees include gateway charges, processing fees, and platform commissions. " +
                    "Average fee per transaction: INR %,.2f.",
                    totalFees, fees.size(), feeRatio,
                    fees.isEmpty() ? BigDecimal.ZERO : totalFees.divide(BigDecimal.valueOf(fees.size()), 2, java.math.RoundingMode.HALF_UP));
            confidence = 0.91;
            sources.add("Transaction Ledger");
            fees.stream().limit(5).forEach(f -> relatedTxns.add(f.getTransactionRef()));

        } else if (question.contains("reconcil") && (question.contains("last") || question.contains("recent") || question.contains("history"))) {
            List<ReconciliationResult> history = resultRepository.findAllByOrderByStartedAtDesc();
            if (!history.isEmpty()) {
                ReconciliationResult last = history.get(0);
                answer = String.format("Last reconciliation: Batch %s completed at %s. " +
                        "Results: %d matched, %d partial matches, %d unmatched, %d exceptions out of %d total records. " +
                        "Match rate: %.1f%%. Processing time: %dms. " +
                        "Total reconciliation runs: %d.",
                        last.getBatchId(),
                        last.getCompletedAt() != null ? last.getCompletedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : "N/A",
                        last.getMatchedCount(), last.getPartialMatchCount(),
                        last.getUnmatchedCount(), last.getExceptionCount(),
                        last.getTotalRecords(), last.getMatchRate() * 100,
                        last.getProcessingTimeMs(), history.size());
                confidence = 0.96;
            } else {
                answer = "No reconciliation history available. Please run a reconciliation first.";
                confidence = 0.75;
            }
            sources.add("Reconciliation History");

        } else {
            // Generic response with some stats
            long total = transactionRepository.count();
            answer = String.format("I can help you with settlement queries. Currently tracking %d transactions. " +
                    "Try asking about: unmatched transactions, match rate, cash position, pending settlements, " +
                    "fees and charges, or reconciliation history. " +
                    "Example: 'What is the current match rate?' or 'Show me today's pending settlements.'",
                    total);
            confidence = 0.80;
            sources.add("AI Settlement Assistant");
        }

        return SettlementQAResponse.builder()
                .answer(answer)
                .confidence(confidence)
                .sources(sources)
                .relatedTransactions(relatedTxns)
                .build();
    }
}
