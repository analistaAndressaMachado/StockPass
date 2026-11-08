package com.stockpass.repository;

import com.stockpass.model.StockReplenishment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface StockReplenishmentRepository extends JpaRepository<StockReplenishment, Long> {
    List<StockReplenishment> findAllByOrderByScheduledAtDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from StockReplenishment r where r.id = :id")
    Optional<StockReplenishment> findByIdForUpdate(@Param("id") Long id);
}