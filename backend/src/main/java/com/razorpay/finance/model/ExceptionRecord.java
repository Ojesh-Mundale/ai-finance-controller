package com.razorpay.finance.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "exception_records", indexes = {
    @Index(name = "idx_exception_batch_id", columnList = "batchId"),
    @Index(name = "idx_exception_resolved", columnList = "resolved")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExceptionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, length = 50)
    private String batchId;

    @Column(nullable = false, length = 100)
    private String transactionRef;

    @Column(length = 1000)
    private String reason;

    @Column(length = 500)
    private String suggestedAction;

    @Column(nullable = false, length = 10)
    private String severity; // HIGH, MEDIUM, LOW

    @Builder.Default
    private boolean resolved = false;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}