package com.stockpass.repository;

import com.stockpass.model.ClientPurchaseItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClientPurchaseItemRepository extends JpaRepository<ClientPurchaseItem, Long> {
    List<ClientPurchaseItem> findAllByPurchaseIdOrderByIdAsc(Long purchaseId);
}