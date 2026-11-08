package com.stockpass.repository;

import com.stockpass.model.SupplierPurchase;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SupplierPurchaseRepository extends JpaRepository<SupplierPurchase, Long> {
	@Query("select purchase from SupplierPurchase purchase " +
		"join fetch purchase.offer offer join fetch purchase.product " +
		"where offer.supplier.id = :supplierId order by purchase.purchasedAt desc")
	List<SupplierPurchase> findAllBySupplierId(@Param("supplierId") Long supplierId);
}