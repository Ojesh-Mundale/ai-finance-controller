package com.razorpay.finance.controller;

import com.razorpay.finance.dto.SettlementQARequest;
import com.razorpay.finance.dto.SettlementQAResponse;
import com.razorpay.finance.service.SettlementQAService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settlement-qa")
@RequiredArgsConstructor
@Tag(name = "Settlement Q&A", description = "AI-powered settlement query and answer APIs")
public class SettlementQAController {

    private final SettlementQAService settlementQAService;

    @PostMapping("/ask")
    @Operation(summary = "Ask a settlement question", description = "Submit a natural language question about settlements and get an AI-powered answer")
    public ResponseEntity<SettlementQAResponse> askQuestion(@RequestBody SettlementQARequest request) {
        SettlementQAResponse response = settlementQAService.answerQuestion(request);
        return ResponseEntity.ok(response);
    }
}