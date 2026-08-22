package com.razorpay.finance.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "forecast_data", indexes = {
    @Index(name = "idx_forecast_date", columnList = "forecastDate")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForecastData {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private LocalDate forecastDate;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal predictedInflow;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal predictedOutflow;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal netCashFlow;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal predictedBalance;

    @Column(nullable = false)
    private double confidence;

    @Column(length = 20)
    @Builder.Default
    private String modelVersion = "v1.0";
}