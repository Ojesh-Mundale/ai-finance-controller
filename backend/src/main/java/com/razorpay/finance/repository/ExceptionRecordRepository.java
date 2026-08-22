package com.razorpay.finance.repository;

import com.razorpay.finance.model.ExceptionRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExceptionRecordRepository extends JpaRepository<ExceptionRecord, UUID> {

    List<ExceptionRecord> findByBatchId(String batchId);

    List<ExceptionRecord> findByResolvedFalse();

    long countByBatchIdAndSeverity(String batchId, String severity);
}