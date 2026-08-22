package com.razorpay.finance.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reconciliation_results", indexes = {
    @Index(name = "idx_result_batch_id", columnList = "batchId")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReconciliationResult {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, length = 50)
    private String batchId;

    @Column(nullable = false)
    private int totalRecords;

    @Column(nullable = false)
    private int matchedCount;

    @Column(nullable = false)
    private int partialMatchCount;

    @Column(nullable = false)
    private int unmatchedCount;

    @Column(nullable = false)
    private int exceptionCount;

    @Column(nullable = false)
    private double matchRate;

    @Column(nullable = false)
    private double averageConfidence;

    @Column(nullable = false)
    private long processingTimeMs;

    @Column(nullable = false)
    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    @Column(length = 30)
    private String status;
}