package com.razorpay.finance.dto;

import com.razorpay.finance.model.TransactionSource;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class ReconciliationRequest {

    @NotEmpty(message = "At least one source must be specified")
    private List<TransactionSource> sources;

    private double matchThreshold = 0.75;

    private String dateFrom;

    private String dateTo;
}