package com.razorpay.finance.controller;

import com.razorpay.finance.dto.ReconciliationRequest;
import com.razorpay.finance.dto.ReconciliationResponse;
import com.razorpay.finance.model.ExceptionRecord;
import com.razorpay.finance.model.ReconciliationResult;
import com.razorpay.finance.model.Transaction;
import com.razorpay.finance.service.ReconciliationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reconciliation")
@RequiredArgsConstructor
@Tag(name = "Reconciliation", description = "AI-powered transaction reconciliation APIs")
public class ReconciliationController {

    private final ReconciliationService reconciliationService;

    @PostMapping("/run")
    @Operation(summary = "Run reconciliation", description = "Execute AI-powered reconciliation across specified transaction sources")
    public ResponseEntity<ReconciliationResponse> runReconciliation(@Valid @RequestBody ReconciliationRequest request) {
        ReconciliationResponse response = reconciliationService.reconcile(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    @Operation(summary = "Get reconciliation history", description = "Retrieve all past reconciliation results ordered by most recent")
    public ResponseEntity<List<ReconciliationResult>> getHistory() {
        return ResponseEntity.ok(reconciliationService.getReconciliationHistory());
    }

    @GetMapping("/batch/{batchId}")
    @Operation(summary = "Get batch result", description = "Get reconciliation result for a specific batch ID")
    public ResponseEntity<ReconciliationResult> getBatchResult(@PathVariable String batchId) {
        return reconciliationService.getResultByBatchId(batchId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/batch/{batchId}/transactions")
    @Operation(summary = "Get batch transactions", description = "Get all transactions processed in a specific batch")
    public ResponseEntity<List<Transaction>> getBatchTransactions(@PathVariable String batchId) {
        return ResponseEntity.ok(reconciliationService.getTransactionsByBatch(batchId));
    }

    @GetMapping("/batch/{batchId}/exceptions")
    @Operation(summary = "Get batch exceptions", description = "Get all exception records for a specific batch")
    public ResponseEntity<List<ExceptionRecord>> getBatchExceptions(@PathVariable String batchId) {
        return ResponseEntity.ok(reconciliationService.getExceptionsByBatch(batchId));
    }
}
