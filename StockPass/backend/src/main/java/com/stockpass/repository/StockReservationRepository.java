package com.stockpass.repository;

import com.stockpass.model.StockReservation;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockReservationRepository extends JpaRepository<StockReservation, Long> {
    @Modifying(flushAutomatically = true)
    @Query(value = "update stock_reservations set status = status where id = :id", nativeQuery = true)
    int acquireWriteLock(@Param("id") Long id);

    @Query("select coalesce(sum(r.quantity), 0) from StockReservation r " +
        "where r.product.id = :productId and r.status = 'ACTIVE' and r.expiresAt > :now")
    Long sumActiveQuantity(@Param("productId") Long productId, @Param("now") LocalDateTime now);

    List<StockReservation> findAllByProductIdAndStatusAndExpiresAtLessThanEqual(Long productId, String status,
        LocalDateTime now);

    List<StockReservation> findAllByStatusAndExpiresAtLessThanEqual(String status, LocalDateTime now);

    List<StockReservation> findAllByStatusOrderByCreatedAtAsc(String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from StockReservation r where r.id = :id")
    Optional<StockReservation> findByIdForUpdate(@Param("id") Long id);
}
