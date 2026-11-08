package com.stockpass.repository;

import com.stockpass.model.SupplierOffer;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface SupplierOfferRepository extends JpaRepository<SupplierOffer, Long> {
    List<SupplierOffer> findAllBySupplierIdOrderByCreatedAtDesc(Long supplierId);
    List<SupplierOffer> findAllByActiveTrueAndAvailableQuantityGreaterThanOrderByNameAsc(int quantity);
    Optional<SupplierOffer> findByIdAndSupplierId(Long id, Long supplierId);
    boolean existsBySupplierIdAndSkuIgnoreCase(Long supplierId, String sku);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select offer from SupplierOffer offer join fetch offer.supplier where offer.id = :id")
    Optional<SupplierOffer> findByIdForUpdate(@Param("id") Long id);
}