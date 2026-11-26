package com.stockpass.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class ClientDtos {
    private ClientDtos() {}

    public record PurchaseLineRequest(@NotNull @Positive Long productId, @NotNull @Positive Integer quantity) {}

    public record PurchaseRequest(
        @NotBlank @Size(max = 32) String paymentMethod,
        @NotEmpty @Size(max = 100) List<@Valid PurchaseLineRequest> items
    ) {}

    public record StoreProductResponse(
        Long id,
        String sku,
        String name,
        String category,
        BigDecimal price,
        int availableQuantity
    ) {}

    public record CreateClientRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Email @Size(max = 254) String email,
        @Size(max = 30) String phone,
        @NotBlank @Size(min = 6, max = 72) String password,
        @NotNull Boolean active
    ) {}

    public record UpdateClientRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Email @Size(max = 254) String email,
        @Size(max = 30) String phone,
        @Size(max = 72) String password,
        @NotNull Boolean active
    ) {}

    public record ClientSummaryResponse(
        Long id, String name, String email, LocalDateTime createdAt, String phone, boolean active
    ) {}

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
