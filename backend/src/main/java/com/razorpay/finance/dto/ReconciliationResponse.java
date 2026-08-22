package com.razorpay.finance.dto;

import com.razorpay.finance.model.ExceptionRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReconciliationResponse {

    private String batchId;
    private int totalRecords;
    private int matchedCount;
    private int partialMatchCount;
    private int unmatchedCount;
    private int exceptionCount;
    private String matchRate;
    private double averageConfidence;
    private long processingTimeMs;
    private String status;
    private List<ExceptionRecord> exceptions;
    private List<TransactionSummary> matchedTransactions;
}