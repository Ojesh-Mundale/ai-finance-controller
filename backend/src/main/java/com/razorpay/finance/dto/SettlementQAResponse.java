package com.razorpay.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettlementQAResponse {

    private String answer;
    private double confidence;
    private List<String> sources;
    private List<String> relatedTransactions;
}