package com.razorpay.finance.repository;

import com.razorpay.finance.model.ReconciliationStatus;
import com.razorpay.finance.model.Transaction;
import com.razorpay.finance.model.TransactionSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    List<Transaction> findBySource(TransactionSource source);

    List<Transaction> findByStatus(ReconciliationStatus status);

    List<Transaction> findByBatchId(String batchId);

    long countByStatus(ReconciliationStatus status);

    List<Transaction> findByTransactionDateBetween(LocalDateTime start, LocalDateTime end);

    List<Transaction> findBySourceAndTransactionDateBetween(TransactionSource source, LocalDateTime start, LocalDateTime end);

    List<Transaction> findBySourceAndStatus(TransactionSource source, ReconciliationStatus status);
}