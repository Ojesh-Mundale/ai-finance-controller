package com.razorpay.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardMetrics {

    private long totalTransactions;
    private String matchRate;
    private double avgConfidence;
    private long exceptionCount;
    private BigDecimal pendingSettlements;
    private BigDecimal cashPosition;
    private double processingThroughput;
    private LocalDateTime lastReconciliationTime;
}
