package com.razorpay.finance.service;

import com.razorpay.finance.dto.CashPositionResponse;
import com.razorpay.finance.model.*;
import com.razorpay.finance.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CashPositionService {

    private final TransactionRepository transactionRepository;
    private final CashPositionRepository cashPositionRepository;
    private final ForecastDataRepository forecastDataRepository;

    @Transactional
    public void computeAndSaveCashPositions() {
        if (cashPositionRepository.count() > 0) {
            log.info("Cash positions already exist. Recomputing...");
            cashPositionRepository.deleteAll();
        }

        List<Transaction> allTxns = transactionRepository.findAll();
        LocalDate today = LocalDate.now();
        BigDecimal runningBalance = new BigDecimal("5000000.00"); // Starting balance

        List<CashPosition> positions = new ArrayList<>();
        List<ForecastData> forecasts = new ArrayList<>();

        // Compute daily cash positions for last 30 days
        for (int i = 29; i >= 0; i--) {
            LocalDate date = today.minusDays(i);

            List<Transaction> dayTxns = allTxns.stream()
                    .filter(t -> t.getTransactionDate().toLocalDate().equals(date))
                    .toList();

            BigDecimal dailyInflows = dayTxns.stream()
                    .filter(t -> t.getType() == TransactionType.CREDIT || t.getType() == TransactionType.SETTLEMENT || t.getType() == TransactionType.REFUND)
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal dailyOutflows = dayTxns.stream()
                    .filter(t -> t.getType() == TransactionType.DEBIT || t.getType() == TransactionType.FEE)
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal pendingSettlements = dayTxns.stream()
                    .filter(t -> t.getStatus() == ReconciliationStatus.PENDING_REVIEW && t.getType() == TransactionType.SETTLEMENT)
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal closingBalance = runningBalance.add(dailyInflows).subtract(dailyOutflows);

            CashPosition position = CashPosition.builder()
                    .asOfDate(date)
                    .openingBalance(runningBalance)
                    .totalInflows(dailyInflows)
                    .totalOutflows(dailyOutflows)
                    .closingBalance(closingBalance)
                    .pendingSettlements(pendingSettlements)
                    .currency("INR")
                    .build();

            // Simple forecast: next 7 days based on rolling average
            if (i <= 7) {
                BigDecimal forecastInflow = dailyInflows.multiply(BigDecimal.valueOf(0.9 + ThreadLocalRandom.current().nextDouble(0.2)));
                BigDecimal forecastOutflow = dailyOutflows.multiply(BigDecimal.valueOf(0.9 + ThreadLocalRandom.current().nextDouble(0.2)));
                BigDecimal forecastBalance = closingBalance.add(forecastInflow).subtract(forecastOutflow);

                position.setForecastedBalance(forecastBalance);
            }

            positions.add(position);
            runningBalance = closingBalance;
        }

        // Generate forecast data for next 7 days
        BigDecimal lastClosing = runningBalance;
        BigDecimal avgInflow = positions.stream()
                .map(CashPosition::getTotalInflows)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP);
        BigDecimal avgOutflow = positions.stream()
                .map(CashPosition::getTotalOutflows)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP);

        for (int i = 1; i <= 7; i++) {
            LocalDate forecastDate = today.plusDays(i);
            double variance = 0.8 + ThreadLocalRandom.current().nextDouble(0.4);
            BigDecimal predictedInflow = avgInflow.multiply(BigDecimal.valueOf(variance)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal predictedOutflow = avgOutflow.multiply(BigDecimal.valueOf(variance)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal netCashFlow = predictedInflow.subtract(predictedOutflow);
            BigDecimal predictedBalance = lastClosing.add(netCashFlow);
            double confidence = Math.max(0.60, 0.95 - (i * 0.05));

            forecasts.add(ForecastData.builder()
                    .forecastDate(forecastDate)
                    .predictedInflow(predictedInflow)
                    .predictedOutflow(predictedOutflow)
                    .netCashFlow(netCashFlow)
                    .predictedBalance(predictedBalance)
                    .confidence(confidence)
                    .build());

            lastClosing = predictedBalance;
        }

        cashPositionRepository.saveAll(positions);
        forecastDataRepository.saveAll(forecasts);

        log.info("Computed {} cash positions and {} forecast entries", positions.size(), forecasts.size());
    }

    public List<CashPositionResponse> getCashPositions() {
        return cashPositionRepository.findAll().stream()
                .map(this::toResponse)
                .sorted(Comparator.comparing(CashPositionResponse::getDate))
                .collect(Collectors.toList());
    }

    public Optional<CashPositionResponse> getCashPositionForDate(LocalDate date) {
        return cashPositionRepository.findByAsOfDate(date).map(this::toResponse);
    }

    public List<ForecastData> getForecasts() {
        return forecastDataRepository.findAllByOrderByForecastDateAsc();
    }

    public List<ForecastData> getForecastsBetween(LocalDate start, LocalDate end) {
        return forecastDataRepository.findByForecastDateBetween(start, end);
    }

    private CashPositionResponse toResponse(CashPosition cp) {
        return CashPositionResponse.builder()
                .date(cp.getAsOfDate())
                .openingBalance(cp.getOpeningBalance())
                .totalInflows(cp.getTotalInflows())
                .totalOutflows(cp.getTotalOutflows())
                .closingBalance(cp.getClosingBalance())
                .pendingSettlements(cp.getPendingSettlements())
                .forecastedBalance(cp.getForecastedBalance())
                .build();
    }
}