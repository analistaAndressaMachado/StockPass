package com.stockpass.dto;

import com.stockpass.model.SupplierContractStatus;
import com.stockpass.model.SupplierStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public final class SupplierManagementDtos {
    private SupplierManagementDtos() {}

    public record SupplierRequest(
        @NotBlank String legalName,
        @NotBlank String cnpj,
        @NotBlank @Email String email,
        String phone,
        String address,
        @NotNull SupplierStatus status
    ) {}

    public record SupplierResponse(
        Long id, String legalName, String cnpj, String email, String phone, String address,
        SupplierStatus status, LocalDateTime createdAt, LocalDateTime updatedAt
    ) {}

    public record ContractRequest(
        @NotBlank String contractNumber,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @DecimalMin(value = "0.0", inclusive = true) BigDecimal value,
        @NotNull SupplierContractStatus status,
        String observations
    ) {}

    public record ContractResponse(
        Long id, Long supplierId, String contractNumber, LocalDate startDate, LocalDate endDate,
        BigDecimal value, SupplierContractStatus status, String observations,
        LocalDateTime createdAt, LocalDateTime updatedAt
    ) {}
}
