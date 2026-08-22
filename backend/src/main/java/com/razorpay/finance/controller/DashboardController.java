package com.razorpay.finance.controller;

import com.razorpay.finance.dto.DashboardMetrics;
import com.razorpay.finance.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Dashboard metrics and analytics APIs")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/metrics")
    @Operation(summary = "Get dashboard metrics", description = "Retrieve aggregated dashboard metrics including match rate, exceptions, cash position")
    public ResponseEntity<DashboardMetrics> getMetrics() {
        return ResponseEntity.ok(dashboardService.getMetrics());
    }
}