package com.stockpass.repository;

import com.stockpass.model.MovementType;
import com.stockpass.model.StockMovement;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findAllByTypeOrderByCreatedAtDesc(MovementType type);
}