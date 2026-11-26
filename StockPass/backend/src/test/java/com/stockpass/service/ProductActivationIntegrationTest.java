package com.stockpass.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.stockpass.dto.StockDtos.CategoryRequest;
import com.stockpass.dto.StockDtos.EntryRequest;
import com.stockpass.dto.StockDtos.ExitRequest;
import com.stockpass.dto.StockDtos.ProductRequest;
import com.stockpass.dto.ClientDtos.PurchaseLineRequest;
import com.stockpass.dto.ClientDtos.PurchaseRequest;
import com.stockpass.model.StockReservation;
import com.stockpass.repository.CategoryRepository;
import com.stockpass.repository.ProductRepository;
import com.stockpass.repository.StockReservationRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.boot.DefaultApplicationArguments;

@SpringBootTest
@Transactional
class ProductActivationIntegrationTest {
    private static final String OPERATOR = "admin@stockpass.com";

    @Autowired private ProductService productsService;
    @Autowired private StockMovementService movements;
    @Autowired private ClientStoreService store;
    @Autowired private ProductRepository products;
    @Autowired private CategoryRepository categories;
    @Autowired private CategoryService categoryService;
    @Autowired private StockReservationRepository reservations;
    @Autowired private AuthService authService;
    @Autowired private ProductActiveMigration activeMigration;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private jakarta.persistence.EntityManager entityManager;

    @Test
    void deactivationPreservesBalanceAndMovementHistoryAndHidesFromStore() {
        var product = createProduct(12);
        int balanceBefore = products.findById(product.id()).orElseThrow().getQuantity();

        var inactive = productsService.setActive(product.id(), false);

        assertFalse(inactive.active());
        assertEquals(balanceBefore, products.findById(product.id()).orElseThrow().getQuantity());
        assertTrue(movements.list(com.stockpass.model.MovementType.ENTRY).stream()
            .anyMatch(item -> item.sku().equals(product.sku())));
        assertFalse(store.products().stream().anyMatch(item -> item.id().equals(product.id())));
    }

    @Test
    void inactiveProductsRejectEntriesExitsAndNewReservations() {
        var product = createProduct(12);
        productsService.setActive(product.id(), false);

        assertThrows(IllegalArgumentException.class, () -> movements.entry(
            new EntryRequest(product.id(), 1, "NF", null), OPERATOR));
        assertThrows(IllegalArgumentException.class, () -> movements.exit(
            new ExitRequest(product.id(), 1, "Venda", "teste"), OPERATOR));
        assertThrows(IllegalArgumentException.class, () -> movements.reserveExit(
            new ExitRequest(product.id(), 1, "Venda", "teste"), OPERATOR));
        assertEquals(12, products.findById(product.id()).orElseThrow().getQuantity());
    }

    @Test
    void pendingReservationBlocksDeactivationWithoutCancellingIt() {
        var product = createProduct(12);
        var reservation = movements.reserveExit(
            new ExitRequest(product.id(), 4, "Venda", "pedido pendente"), OPERATOR);

        assertThrows(IllegalArgumentException.class, () -> productsService.setActive(product.id(), false));

        assertTrue(products.findById(product.id()).orElseThrow().isActive());
        assertEquals(12, products.findById(product.id()).orElseThrow().getQuantity());
        assertEquals(StockReservation.ACTIVE, reservations.findById(reservation.id()).orElseThrow().getStatus());
        assertEquals(4, reservations.sumActiveQuantity(product.id(), LocalDateTime.now()));
    }

    @Test
    void reactivationAllowsNormalStockOperationsAgain() {
        var product = createProduct(12);
        productsService.setActive(product.id(), false);
        var reactivated = productsService.setActive(product.id(), true);

        assertTrue(reactivated.active());
        movements.entry(new EntryRequest(product.id(), 2, "NF-REATIVA", null), OPERATOR);
        assertEquals(14, products.findById(product.id()).orElseThrow().getQuantity());
    }

    @Test
    void storeRejectsSaleOfInactiveProduct() {
        var product = createProduct(12);
        var client = authService.registerClient(new com.stockpass.dto.AuthDtos.ClientRegisterRequest(
            "Cliente status", "inactive-" + UUID.randomUUID() + "@stockpass.test", "senha-cliente"));
        productsService.setActive(product.id(), false);

        assertThrows(IllegalArgumentException.class, () -> store.purchase(
            new PurchaseRequest("PIX", java.util.List.of(new PurchaseLineRequest(product.id(), 1))), client.email()));
        assertEquals(12, products.findById(product.id()).orElseThrow().getQuantity());
    }

    @Test
    void migrationKeepsExistingProductsActiveWhenStatusColumnIsAdded() throws Exception {
        var product = createProduct(7);
        jdbc.update("UPDATE products SET active = NULL WHERE id = ?", product.id());
        entityManager.clear();

        activeMigration.run(new DefaultApplicationArguments(new String[0]));
        entityManager.clear();

        assertTrue(products.findById(product.id()).orElseThrow().isActive());
        assertEquals(7, products.findById(product.id()).orElseThrow().getQuantity());
    }

    private com.stockpass.dto.StockDtos.ProductResponse createProduct(int quantity) {
        String normalized = "geral";
        Long categoryId = categories.findByNormalizedName(normalized)
            .map(com.stockpass.model.Category::getId)
            .orElseGet(() -> categoryService.create(new CategoryRequest("Geral", null)).id());
        return productsService.create(new ProductRequest("ACTIVE-" + UUID.randomUUID(), "Produto teste status",
            categoryId, quantity, new BigDecimal("4.00"), "Fornecedor teste", 0), OPERATOR);
    }
}
