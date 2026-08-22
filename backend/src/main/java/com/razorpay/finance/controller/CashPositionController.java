package com.razorpay.finance.controller;

import com.razorpay.finance.dto.CashPositionResponse;
import com.razorpay.finance.model.CashPosition;
import com.razorpay.finance.model.ForecastData;
import com.razorpay.finance.service.CashPositionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/cash-position")
@RequiredArgsConstructor
@Tag(name = "Cash Position", description = "Cash position and forecasting APIs")
public class CashPositionController {

    private final CashPositionService cashPositionService;

    @PostMapping("/compute")
    @Operation(summary = "Compute cash positions", description = "Compute and persist cash positions from transaction data")
    public ResponseEntity<String> computeCashPositions() {
        cashPositionService.computeAndSaveCashPositions();
        return ResponseEntity.ok("Cash positions computed successfully");
    }

    @GetMapping
    @Operation(summary = "Get all cash positions", description = "Retrieve all computed cash positions")
    public ResponseEntity<List<CashPositionResponse>> getAllPositions() {
        return ResponseEntity.ok(cashPositionService.getCashPositions());
    }

    @GetMapping("/date/{date}")
    @Operation(summary = "Get cash position for date", description = "Retrieve cash position for a specific date")
    public ResponseEntity<CashPositionResponse> getPositionForDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return cashPositionService.getCashPositionForDate(date)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/forecast")
    @Operation(summary = "Get cash forecast", description = "Retrieve forecasted cash position data")
    public ResponseEntity<List<ForecastData>> getForecast() {
        return ResponseEntity.ok(cashPositionService.getForecasts());
    }

    @GetMapping("/forecast/range")
    @Operation(summary = "Get forecast by date range", description = "Retrieve forecast data within a date range")
    public ResponseEntity<List<ForecastData>> getForecastByRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(cashPositionService.getForecastsBetween(from, to));
    }
}