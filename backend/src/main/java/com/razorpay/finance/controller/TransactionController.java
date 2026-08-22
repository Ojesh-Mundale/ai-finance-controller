package com.razorpay.finance.controller;

import com.razorpay.finance.model.ReconciliationStatus;
import com.razorpay.finance.model.Transaction;
import com.razorpay.finance.model.TransactionSource;
import com.razorpay.finance.repository.TransactionRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@Tag(name = "Transactions", description = "Transaction query and management APIs")
public class TransactionController {

    private final TransactionRepository transactionRepository;

    @GetMapping
    @Operation(summary = "Get all transactions", description = "Retrieve all transactions with optional filtering by source and status")
    public ResponseEntity<List<Transaction>> getAllTransactions(
            @RequestParam(required = false) TransactionSource source,
            @RequestParam(required = false) ReconciliationStatus status) {
        if (source != null && status != null) {
            return ResponseEntity.ok(transactionRepository.findBySourceAndStatus(source, status));
        } else if (source != null) {
            return ResponseEntity.ok(transactionRepository.findBySource(source));
        } else if (status != null) {
            return ResponseEntity.ok(transactionRepository.findByStatus(status));
        }
        return ResponseEntity.ok(transactionRepository.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get transaction by ID", description = "Retrieve a single transaction by its UUID")
    public ResponseEntity<Transaction> getById(@PathVariable java.util.UUID id) {
        return transactionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/date-range")
    @Operation(summary = "Get transactions by date range", description = "Retrieve transactions within a date range")
    public ResponseEntity<List<Transaction>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(transactionRepository.findByTransactionDateBetween(from, to));
    }

    @GetMapping("/count/by-status")
    @Operation(summary = "Count transactions by status", description = "Get count of transactions grouped by reconciliation status")
    public ResponseEntity<java.util.Map<String, Long>> countByStatus() {
        java.util.Map<String, Long> counts = new java.util.LinkedHashMap<>();
        for (ReconciliationStatus status : ReconciliationStatus.values()) {
            counts.put(status.name(), transactionRepository.countByStatus(status));
        }
        return ResponseEntity.ok(counts);
    }
}
