package com.stockpass.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.stockpass.model.ReplenishmentStatus;
public final class StockDtos {
    private StockDtos() {}

    public record ProductRequest(
        @NotBlank String sku,
        @NotBlank String name,
        @NotBlank String category,
        @NotNull @Min(0) Integer initialQuantity,
        @NotNull @DecimalMin("0.0") BigDecimal price,
        @NotBlank String supplier,
        @NotNull @Min(0) Integer reorderPoint
    ) {}

    public record ProductUpdateRequest(
        @NotBlank String sku,
        @NotBlank String name,
        @NotBlank String category,
        @NotNull @DecimalMin("0.0") BigDecimal price,
        @NotBlank String supplier,
        @NotNull @Min(0) Integer reorderPoint
    ) {}

    public record SupplierProfileResponse(
        Long id,
        String name,
        String email,
        String companyName,
        String taxId,
        String phone
    ) {}

    public record SupplierOfferRequest(
        @NotBlank String sku,
        @NotBlank String name,
        @NotBlank String category,
        @NotNull @DecimalMin("0.0") BigDecimal price,
        @NotNull @Min(0) Integer availableQuantity
    ) {}

    public record SupplierOfferResponse(
        Long id,
        String sku,
        String name,
        String category,
        BigDecimal price,
        int availableQuantity,
        Long supplierId,
        String supplierName,
        String companyName
    ) {}

    public record SupplierAcquisitionRequest(@NotNull @Positive Integer quantity) {}

    public record SupplierAcquisitionResponse(
        Long purchaseId,
        Long offerId,
        Long productId,
        String inventorySku,
        String product,
        String supplierName,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice,
        int stockAfterPurchase,
        LocalDateTime purchasedAt
    ) {}

    public record SupplierSaleResponse(
        Long purchaseId,
        String sku,
        String product,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice,
        LocalDateTime purchasedAt
    ) {}

    public record ProductResponse(
        Long id,
        String sku,
        String name,
        String category,
        int quantity,
        BigDecimal price,
        String supplier,
        int reorderPoint
    ) {}

    public record EntryRequest(
        @NotNull Long productId,
        @NotNull @Positive Integer quantity,
        String invoiceNumber,
        Long replenishmentId
    ) {}

    public record ReplenishmentRequest(
        @NotNull Long productId,
        @NotNull @Positive Integer quantity
    ) {}

    public record ReplenishmentResponse(
        Long id,
        Long productId,
        String sku,
        String product,
        int quantity,
        int quantityReceived,
        ReplenishmentStatus status,
        LocalDateTime scheduledAt,
        LocalDateTime completedAt,
        String registeredBy
    ) {}

    public record ExitRequest(
        @NotNull Long productId,
        @NotNull @Positive Integer quantity,
        @NotBlank String reason,
        String observation
    ) {}

    public record MovementResponse(
        Long id,
        String type,
        LocalDateTime createdAt,
        String sku,
        String product,
        int quantity,
        String supplier,
        String invoiceNumber,
        String reason,
        String registeredBy,
        String observation
    ) {}
}