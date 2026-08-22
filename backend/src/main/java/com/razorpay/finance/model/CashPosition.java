package com.razorpay.finance.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "cash_positions", indexes = {
    @Index(name = "idx_cash_position_date", columnList = "asOfDate", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true)
    private LocalDate asOfDate;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal openingBalance;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal totalInflows;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal totalOutflows;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal closingBalance;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal pendingSettlements;

    @Column(precision = 19, scale = 4)
    private BigDecimal forecastedBalance;

    @Column(length = 3)
    @Builder.Default
    private String currency = "INR";
}