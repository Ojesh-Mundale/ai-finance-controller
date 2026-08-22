package com.razorpay.finance.dto;

import com.razorpay.finance.model.TransactionSource;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionSummary {

    private String transactionRef;
    private TransactionSource source;
    private BigDecimal amount;
    private UUID matchedWith;
    private Double confidenceScore;
}