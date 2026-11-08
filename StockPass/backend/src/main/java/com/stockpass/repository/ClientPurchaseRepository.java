package com.stockpass.repository;

import com.stockpass.model.ClientPurchase;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClientPurchaseRepository extends JpaRepository<ClientPurchase, Long> {
    List<ClientPurchase> findAllByClientIdOrderByCreatedAtDesc(Long clientId);
}