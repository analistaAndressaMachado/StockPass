package com.stockpass.repository;

import com.stockpass.model.Product;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findAllByOrderByNameAsc();
    boolean existsBySkuIgnoreCase(String sku);
    boolean existsBySkuIgnoreCaseAndIdNot(String sku, Long id);
    Optional<Product> findBySkuIgnoreCase(String sku);
    long countByCategory_Id(Long categoryId);

    // SQLite não aplica FOR UPDATE; esta atualização sem mudança obtém o bloqueio de escrita da transação.
    @Modifying(flushAutomatically = true)
    @Query(value = "update products set quantity = quantity where id = :id", nativeQuery = true)
    int acquireWriteLock(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);
}
