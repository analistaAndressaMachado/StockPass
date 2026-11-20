package com.stockpass.repository;

import com.stockpass.model.SupplierContractAttachment;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierContractAttachmentRepository extends JpaRepository<SupplierContractAttachment, Long> {
    Optional<SupplierContractAttachment> findByIdAndContractId(Long id, Long contractId);
}
