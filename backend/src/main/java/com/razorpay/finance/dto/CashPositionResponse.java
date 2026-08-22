package com.razorpay.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashPositionResponse {

    private LocalDate date;
    private BigDecimal openingBalance;
    private BigDecimal totalInflows;
    private BigDecimal totalOutflows;
    private BigDecimal closingBalance;
    private BigDecimal pendingSettlements;
    private BigDecimal forecastedBalance;
}