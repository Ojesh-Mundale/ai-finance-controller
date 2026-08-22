package com.razorpay.finance.service;

import com.razorpay.finance.model.*;
import com.razorpay.finance.repository.TransactionRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class SyntheticDataGenerator {

    private final TransactionRepository transactionRepository;

    @Value("${app.ai.batch-size:50}")
    private int batchSize;

    private static final String[] INDIAN_NAMES = {
        "Rajesh Kumar Sharma", "Priya Patel", "Amitabh Verma", "Sunita Devi",
        "Vikram Singh Rathore", "Anjali Nair", "Suresh Menon", "Deepika Reddy",
        "Arjun Mehta", "Kavita Gupta", "Manish Agarwal", "Neha Saxena",
        "Rahul Joshi", "Pooja Iyer", "Sanjay Kapoor", "Meera Krishnan",
        "Aakash Banerjee", "Ritu Sharma", "Pradeep Mishra", "Lakshmi Venkatesh",
        "Karthik Subramanian", "Shalini Deshmukh", "Ravi Kulkarni", "Anita Pandey",
        "Divya Choudhary", "Nikhil Bhatt", "Sneha Pillai", "Rajat Malhotra",
        "Tanvi Bhat", "Gaurav Hegde", "Swati Patil", "Manoj Tiwari",
        "Preeti Rao", "Harsh Vardhan", "Isha Kapoor", "Dinesh Yadav",
        "Nisha Thakur", "Siddharth Jain", "Rekha Menon", "Varun Khanna"
    };

    private static final String[] UPI_IDS = {
        "rajesh@hdfcbank", "priya.patel@sbi", "amitv@icici", "sunita.d@axisbank",
        "vikram.r@paytm", "anjali.nair@ybl", "suresh.m@oksbi", "deepika.r@upi",
        "arjun.mehta@hdfcbank", "kavita.g@icici", "manish.a@axisbank", "neha.s@sbi",
        "rahul.j@ybl", "pooja.iyer@okhdfcbank", "sanjay.k@paytm", "meera.k@oksbi",
        "aakash.b@icici", "ritu.s@hdfcbank", "pradeep.m@axisbank", "lakshmi.v@sbi"
    };

    private static final String[] BANKS = {
        "HDFC Bank", "State Bank of India", "ICICI Bank", "Axis Bank",
        "Kotak Mahindra Bank", "Punjab National Bank", "Bank of Baroda", "Canara Bank"
    };

    private static final String[] MERCHANT_DESCRIPTIONS = {
        "Payment received for Invoice #INV-{0}",
        "Settlement for order #ORD-{0}",
        "Refund processed for Transaction #TXN-{0}",
        "Gateway fee deduction - {0}",
        "NEFT credit from {0}",
        "UPI collection - {0}",
        "Bill payment for {0}",
        "Subscription payment - {0}",
        "Vendor payment to {0}",
        "Tax remittance - GST {0}",
        "Payroll disbursement - {0}",
        "Interest credit - {0}",
        "Cash deposit at {0}",
        "Wire transfer from {0}",
        "EMI payment - {0}"
    };

    private static final String[] BANK_STATEMENT_DESCS = {
        "NEFT Inward - {0}",
        "IMPS Credit - {0}",
        "UPI Credit - {0}",
        "RTGS Inward - {0}",
        "ACH Debit - {0}",
        "Cheque Deposit - {0}",
        "Interest Credit - Quarterly",
        "Service Tax Deduction",
        "GST Payment - {0}",
        "TDS Deduction - {0}",
        "Salary Credit - {0}",
        "Vendor NEFT - {0}",
        "Bank Charges - {0}"
    };

    @PostConstruct
    @Transactional
    public void generateData() {
        if (transactionRepository.count() > 0) {
            log.info("Synthetic data already exists ({} records). Skipping generation.", transactionRepository.count());
            return;
        }

        log.info("Generating synthetic transaction data...");
        List<Transaction> allTransactions = new ArrayList<>();
        LocalDate today = LocalDate.now();

        // --- Exact match pairs (same amount, same date, different sources) ---
        // These will be matched during reconciliation
        double[][] exactMatchAmounts = {
            {45250.00}, {128000.00}, {8750.50}, {325000.00}, {15800.00},
            {2500000.00}, {67500.00}, {42350.75}, {192000.00}, {9950.00},
            {540000.00}, {21000.00}, {76500.00}, {112500.00}, {3800.00}
        };

        for (int i = 0; i < exactMatchAmounts.length; i++) {
            BigDecimal amount = BigDecimal.valueOf(exactMatchAmounts[i][0]).setScale(2, RoundingMode.HALF_UP);
            int daysAgo = ThreadLocalRandom.current().nextInt(0, 30);
            LocalDate date = today.minusDays(daysAgo);
            LocalTime time1 = LocalTime.of(9 + ThreadLocalRandom.current().nextInt(0, 8), ThreadLocalRandom.current().nextInt(0, 60));
            LocalTime time2 = time1.plusMinutes(ThreadLocalRandom.current().nextInt(5, 120));

            // BANK_STATEMENT entry
            allTransactions.add(buildTransaction(
                "BANK-" + String.format("%04d", i + 1),
                TransactionSource.BANK_STATEMENT,
                daysAgo % 3 == 0 ? TransactionType.DEBIT : TransactionType.CREDIT,
                amount, date, time1,
                formatDesc(BANK_STATEMENT_DESCS[i % BANK_STATEMENT_DESCS.length], INDIAN_NAMES[i]),
                INDIAN_NAMES[i], BANKS[i % BANKS.length]
            ));

            // PAYMENT_GATEWAY entry (matching)
            allTransactions.add(buildTransaction(
                "PGW-" + String.format("%04d", i + 1),
                TransactionSource.PAYMENT_GATEWAY,
                daysAgo % 3 == 0 ? TransactionType.DEBIT : TransactionType.CREDIT,
                amount, date, time2,
                formatDesc(MERCHANT_DESCRIPTIONS[i % MERCHANT_DESCRIPTIONS.length], "Customer #" + (i + 100)),
                "Customer #" + (i + 100), null
            ));
        }

        // --- Partial match pairs (same base amount, small fee difference) ---
        double[][] partialMatchAmounts = {
            {50000.00, 48750.00}, {150000.00, 147000.00}, {25000.00, 24375.00},
            {100000.00, 98000.00}, {75000.00, 73500.00}
        };

        for (int i = 0; i < partialMatchAmounts.length; i++) {
            BigDecimal amount1 = BigDecimal.valueOf(partialMatchAmounts[i][0]).setScale(2, RoundingMode.HALF_UP);
            BigDecimal amount2 = BigDecimal.valueOf(partialMatchAmounts[i][1]).setScale(2, RoundingMode.HALF_UP);
            int daysAgo = ThreadLocalRandom.current().nextInt(1, 25);
            LocalDate date = today.minusDays(daysAgo);

            allTransactions.add(buildTransaction(
                "BANK-PM-" + String.format("%03d", i + 1),
                TransactionSource.BANK_STATEMENT,
                TransactionType.CREDIT,
                amount1, date, LocalTime.of(10, i * 10),
                "NEFT Inward - " + INDIAN_NAMES[15 + i],
                INDIAN_NAMES[15 + i], BANKS[(15 + i) % BANKS.length]
            ));

            allTransactions.add(buildTransaction(
                "PGW-PM-" + String.format("%03d", i + 1),
                TransactionSource.PAYMENT_GATEWAY,
                TransactionType.CREDIT,
                amount2, date, LocalTime.of(10, i * 10 + 15),
                "Payment received for Order #ORD-" + (500 + i) + " (after fee deduction)",
                "Merchant #" + (200 + i), null
            ));
        }

        // --- UPI transactions ---
        for (int i = 0; i < 17; i++) {
            BigDecimal amount = randomAmount(500, 100000);
            int daysAgo = ThreadLocalRandom.current().nextInt(0, 30);
            LocalDate date = today.minusDays(daysAgo);
            TransactionType type = i < 10 ? TransactionType.CREDIT : TransactionType.DEBIT;

            allTransactions.add(buildTransaction(
                "UPI-" + String.format("%04d", i + 1),
                TransactionSource.UPI,
                type,
                amount, date, LocalTime.of(8 + ThreadLocalRandom.current().nextInt(12), ThreadLocalRandom.current().nextInt(60)),
                (type == TransactionType.CREDIT ? "UPI collection from " : "UPI payment to ") + INDIAN_NAMES[i % INDIAN_NAMES.length],
                INDIAN_NAMES[i % INDIAN_NAMES.length],
                UPI_IDS[i % UPI_IDS.length]
            ));
        }

        // --- Internal Ledger transactions ---
        for (int i = 0; i < 16; i++) {
            BigDecimal amount = randomAmount(1000, 5000000);
            int daysAgo = ThreadLocalRandom.current().nextInt(0, 30);
            LocalDate date = today.minusDays(daysAgo);
            TransactionType type;
            String desc;

            if (i < 5) {
                type = TransactionType.SETTLEMENT;
                desc = "Settlement batch #BATCH-" + String.format("%03d", i + 1);
            } else if (i < 10) {
                type = TransactionType.FEE;
                amount = randomAmount(50, 2500);
                desc = "Gateway fee - " + date.getMonth() + " settlement";
            } else {
                type = i % 2 == 0 ? TransactionType.CREDIT : TransactionType.DEBIT;
                desc = "Ledger adjustment - " + (i % 2 == 0 ? "Revenue accrual" : "Expense accrual");
            }

            allTransactions.add(buildTransaction(
                "LDG-" + String.format("%04d", i + 1),
                TransactionSource.INTERNAL_LEDGER,
                type,
                amount, date, LocalTime.of(0, ThreadLocalRandom.current().nextInt(60)),
                desc,
                i < 5 ? "Settlement Pool" : (i < 10 ? "Fee Account" : "General Ledger"),
                null
            ));
        }

        // --- Orphan / exception records (no matches) ---
        for (int i = 0; i < 7; i++) {
            BigDecimal amount = randomAmount(5000, 200000);
            int daysAgo = ThreadLocalRandom.current().nextInt(0, 15);
            LocalDate date = today.minusDays(daysAgo);
            TransactionSource source = TransactionSource.values()[i % 4];

            allTransactions.add(buildTransaction(
                "EXC-" + String.format("%04d", i + 1),
                source,
                i < 3 ? TransactionType.CREDIT : TransactionType.DEBIT,
                amount, date, LocalTime.of(14, i * 8),
                "Unidentified transaction - " + (i < 3 ? "pending verification" : "requires manual review"),
                i < 3 ? "Unknown Counterparty" : "System Generated",
                i < 3 ? BANKS[i % BANKS.length] : null
            ));
        }

        // --- Additional REFUND transactions ---
        for (int i = 0; i < 4; i++) {
            BigDecimal amount = randomAmount(200, 15000);
            int daysAgo = ThreadLocalRandom.current().nextInt(0, 20);
            LocalDate date = today.minusDays(daysAgo);

            allTransactions.add(buildTransaction(
                "PGW-REF-" + String.format("%03d", i + 1),
                TransactionSource.PAYMENT_GATEWAY,
                TransactionType.REFUND,
                amount, date, LocalTime.of(11, ThreadLocalRandom.current().nextInt(60)),
                "Refund issued to customer #CUST-" + (1000 + i),
                "Customer #CUST-" + (1000 + i), null
            ));
        }

        log.info("Saving {} synthetic transactions...", allTransactions.size());
        transactionRepository.saveAll(allTransactions);
        log.info("Successfully generated {} synthetic transactions", allTransactions.size());
    }

    private Transaction buildTransaction(String ref, TransactionSource source, TransactionType type,
                                         BigDecimal amount, LocalDate date, LocalTime time,
                                         String description, String counterpartName, String counterpartAccount) {
        return Transaction.builder()
                .transactionRef(ref)
                .source(source)
                .type(type)
                .amount(amount)
                .currency("INR")
                .description(description)
                .counterpartName(counterpartName)
                .counterpartAccount(counterpartAccount)
                .transactionDate(LocalDateTime.of(date, time))
                .status(ReconciliationStatus.PENDING_REVIEW)
                .build();
    }

    private BigDecimal randomAmount(double min, double max) {
        double value = ThreadLocalRandom.current().nextDouble(min, max);
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private String formatDesc(String template, Object... args) {
        return String.format(template.replace("{0}", "%s"), args);
    }
}
