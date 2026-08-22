package com.razorpay.finance.repository;

import com.razorpay.finance.model.ReconciliationResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReconciliationResultRepository extends JpaRepository<ReconciliationResult, UUID> {

    Optional<ReconciliationResult> findByBatchId(String batchId);

    List<ReconciliationResult> findAllByOrderByStartedAtDesc();
}