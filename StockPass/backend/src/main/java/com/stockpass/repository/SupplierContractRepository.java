package com.stockpass.repository;

import com.stockpass.model.SupplierContract;
import com.stockpass.model.SupplierContractStatus;
import java.util.List;
import java.util.Optional;
import java.time.LocalDate;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierContractRepository extends JpaRepository<SupplierContract, Long> {
    List<SupplierContract> findAllBySupplierIdOrderByEndDateAsc(Long supplierId);
    Optional<SupplierContract> findByIdAndSupplierId(Long id, Long supplierId);
    List<SupplierContract> findAllByStatusAndEndDateBetweenOrderByEndDateAsc(
        SupplierContractStatus status, LocalDate startDate, LocalDate endDate);
}
