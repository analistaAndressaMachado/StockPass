package com.stockpass.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.stockpass.dto.StockDtos.ExitRequest;
import com.stockpass.dto.StockDtos.ProductRequest;
import com.stockpass.model.StockReservation;
import com.stockpass.repository.ProductRepository;
import com.stockpass.repository.StockMovementRepository;
import com.stockpass.repository.StockReservationRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

@SpringBootTest
@Transactional
class StockReservationServiceTest {
    private static final String OPERATOR = "admin@stockpass.com";

    @Autowired private ProductService productService;
    @Autowired private StockMovementService movementService;
    @Autowired private ProductRepository products;
    @Autowired private StockMovementRepository movements;
    @Autowired private StockReservationRepository reservations;

    @Test
    void refusesReservationAboveAvailableBalanceIncludingOtherReservations() {
        var product = createProduct(10);
        movementService.reserveExit(new ExitRequest(product.id(), 6, "Venda", "Primeira reserva"), OPERATOR);

        assertThrows(IllegalArgumentException.class, () -> movementService.reserveExit(
            new ExitRequest(product.id(), 5, "Venda", "Excederia o disponível"), OPERATOR));
        assertEquals(10, products.findById(product.id()).orElseThrow().getQuantity());
        assertEquals(6, reservations.sumActiveQuantity(product.id(), LocalDateTime.now()));
        assertTrue(movements.findAll().stream().noneMatch(item -> item.getProduct().getId().equals(product.id())
            && item.getType().name().equals("EXIT")));
    }

    @Test
    void confirmingReservationReducesPhysicalStockAndCreatesOneMovement() {
        var product = createProduct(10);
        var reservation = movementService.reserveExit(
            new ExitRequest(product.id(), 4, "Venda", "Pedido teste"), OPERATOR);

        var movement = movementService.confirmReservation(reservation.id());

        assertEquals(6, products.findById(product.id()).orElseThrow().getQuantity());
        assertEquals(4, movement.quantity());
        assertEquals("Administrador", movement.registeredBy());
        assertEquals(StockReservation.CONFIRMED, reservations.findById(reservation.id()).orElseThrow().getStatus());
    }

    @Test
    void cancellingReservationRestoresAvailableBalanceWithoutMovement() {
        var product = createProduct(10);
        var reservation = movementService.reserveExit(
            new ExitRequest(product.id(), 4, "Perda", "Cancelamento"), OPERATOR);

        var cancelled = movementService.cancelReservation(reservation.id());

        assertEquals(StockReservation.CANCELLED, cancelled.status());
        assertEquals(10, products.findById(product.id()).orElseThrow().getQuantity());
        assertEquals(0, reservations.sumActiveQuantity(product.id(), LocalDateTime.now()));
        assertTrue(movements.findAll().stream().noneMatch(item -> item.getProduct().getId().equals(product.id())
            && item.getType().name().equals("EXIT")));
    }

    @Test
    void expiredReservationCannotBeConfirmed() {
        var product = createProduct(10);
        var reservation = movementService.reserveExit(
            new ExitRequest(product.id(), 4, "Venda", "Expiração"), OPERATOR);
        var saved = reservations.findById(reservation.id()).orElseThrow();
        saved.setExpiresAt(LocalDateTime.now().minusSeconds(1));
        reservations.saveAndFlush(saved);

        assertThrows(IllegalArgumentException.class, () -> movementService.confirmReservation(reservation.id()));
        movementService.expireReservations();

        assertEquals(10, products.findById(product.id()).orElseThrow().getQuantity());
        assertEquals(StockReservation.EXPIRED, reservations.findById(reservation.id()).orElseThrow().getStatus());
        assertTrue(movements.findAll().stream().noneMatch(item -> item.getProduct().getId().equals(product.id())
            && item.getType().name().equals("EXIT")));
    }

    @Test
    void reservationCannotBeConfirmedTwice() {
        var product = createProduct(10);
        var reservation = movementService.reserveExit(
            new ExitRequest(product.id(), 4, "Venda", "Confirmação duplicada"), OPERATOR);

        movementService.confirmReservation(reservation.id());
        assertThrows(IllegalArgumentException.class, () -> movementService.confirmReservation(reservation.id()));

        assertEquals(6, products.findById(product.id()).orElseThrow().getQuantity());
        assertEquals(1, movements.findAll().stream().filter(item -> item.getProduct().getId().equals(product.id())
            && item.getType().name().equals("EXIT")).count());
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void simultaneousReservationsCannotExceedPhysicalStock() throws Exception {
        var product = createProduct(10);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService workers = Executors.newFixedThreadPool(2);
        try {
            Future<Boolean> first = workers.submit(() -> tryReserveAfter(start, product.id()));
            Future<Boolean> second = workers.submit(() -> tryReserveAfter(start, product.id()));
            start.countDown();

            int accepted = (first.get() ? 1 : 0) + (second.get() ? 1 : 0);
            assertEquals(1, accepted);
            assertEquals(6, reservations.sumActiveQuantity(product.id(), LocalDateTime.now()));
            assertEquals(10, products.findById(product.id()).orElseThrow().getQuantity());
        } finally {
            workers.shutdownNow();
        }
    }

    private boolean tryReserveAfter(CountDownLatch start, Long productId) {
        try {
            start.await();
            movementService.reserveExit(new ExitRequest(productId, 6, "Venda", "Concorrência"), OPERATOR);
            return true;
        } catch (RuntimeException error) {
            return false;
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    private com.stockpass.dto.StockDtos.ProductResponse createProduct(int quantity) {
        String suffix = UUID.randomUUID().toString();
        return productService.create(new ProductRequest("RSV-" + suffix, "Produto reserva", "Testes", quantity,
            new BigDecimal("5.00"), "Fornecedor teste", 0), OPERATOR);
    }
}
