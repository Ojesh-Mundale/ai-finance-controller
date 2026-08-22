package com.razorpay.finance.repository;

import com.razorpay.finance.model.ForecastData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ForecastDataRepository extends JpaRepository<ForecastData, UUID> {

    List<ForecastData> findByForecastDateBetween(LocalDate start, LocalDate end);

    List<ForecastData> findAllByOrderByForecastDateAsc();
}