package com.razorpay.finance.repository;

import com.razorpay.finance.model.CashPosition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CashPositionRepository extends JpaRepository<CashPosition, UUID> {

    Optional<CashPosition> findByAsOfDate(LocalDate asOfDate);

    Optional<CashPosition> findTopByOrderByAsOfDateDesc();
}