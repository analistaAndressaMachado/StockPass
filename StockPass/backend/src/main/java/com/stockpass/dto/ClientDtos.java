package com.stockpass.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class ClientDtos {
    private ClientDtos() {}

    public record PurchaseLineRequest(@NotNull Long productId, @NotNull @Positive Integer quantity) {}

    public record PurchaseRequest(
        @NotBlank String paymentMethod,
        @NotEmpty List<@Valid PurchaseLineRequest> items
    ) {}

    public record StoreProductResponse(
        Long id,
        String sku,
        String name,
        String category,
        BigDecimal price,
        int availableQuantity
    ) {}

    public record ClientSummaryResponse(Long id, String name, String email, LocalDateTime createdAt) {}

    public record PurchaseLineResponse(
        Long productId,
        String sku,
        String product,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
    ) {}

    public record PurchaseResponse(
        Long id,
        String orderNumber,
        BigDecimal total,
        String paymentMethod,
        String paymentStatus,
        LocalDateTime createdAt,
        List<PurchaseLineResponse> items
    ) {}
}