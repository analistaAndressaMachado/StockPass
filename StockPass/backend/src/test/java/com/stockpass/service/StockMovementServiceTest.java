package com.stockpass.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.stockpass.dto.StockDtos.EntryRequest;
import com.stockpass.dto.StockDtos.ExitRequest;
import com.stockpass.model.Product;
import com.stockpass.model.ReplenishmentStatus;
import com.stockpass.model.StockMovement;
import com.stockpass.model.StockReplenishment;
import com.stockpass.model.User;
import com.stockpass.repository.ProductRepository;
import com.stockpass.repository.StockReplenishmentRepository;
import com.stockpass.repository.StockMovementRepository;
import com.stockpass.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StockMovementServiceTest {
    @Mock private ProductRepository products;
    @Mock private StockMovementRepository movements;
    @Mock private StockReplenishmentRepository replenishments;
    @Mock private UserRepository users;

    private StockMovementService service;
    private Product product;

    @BeforeEach
    void setUp() {
        service = new StockMovementService(products, movements, replenishments, users);
        product = new Product();
        product.setSku("SKU-001");
        product.setName("Produto de teste");
        product.setQuantity(10);
        product.setSupplier("Fornecedor teste");

    }

    @Test
    void entryIncreasesBalanceAndStoresMovement() {
        configureSuccessfulMovement();
        var response = service.entry(new EntryRequest(1L, 3, "NF-100", null), "operador@stockpass.test");

        assertEquals(13, product.getQuantity());
        assertEquals("ENTRY", response.type());
        assertEquals("NF-100", response.invoiceNumber());
        assertEquals("Operador", response.registeredBy());
        verify(products).save(product);
        verify(movements).save(any(StockMovement.class));
    }

    @Test
    void linkedEntryCompletesScheduledReplenishment() {
        configureSuccessfulMovement();
        StockReplenishment replenishment = new StockReplenishment();
        replenishment.setProduct(product);
        replenishment.setQuantity(3);
        replenishment.setRegisteredBy("Operador");
        when(replenishments.findByIdForUpdate(8L)).thenReturn(Optional.of(replenishment));

        service.entry(new EntryRequest(1L, 3, "NF-101", 8L), "operador@stockpass.test");

        assertEquals(ReplenishmentStatus.COMPLETED, replenishment.getStatus());
        assertEquals(3, replenishment.getQuantityReceived());
        verify(replenishments).save(replenishment);
    }

    @Test
    void exitReducesBalanceAndStoresMovement() {
        configureSuccessfulMovement();
        var response = service.exit(new ExitRequest(1L, 4, "Venda", "Pedido 42"), "operador@stockpass.test");

        assertEquals(6, product.getQuantity());
        assertEquals("EXIT", response.type());
        assertEquals("Venda", response.reason());
        assertEquals("Pedido 42", response.observation());
        verify(products).save(product);
        verify(movements).save(any(StockMovement.class));
    }

    @Test
    void exitAboveAvailableBalanceIsRejectedWithoutMovement() {
        when(products.findByIdForUpdate(1L)).thenReturn(Optional.of(product));
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
            () -> service.exit(new ExitRequest(1L, 11, "Venda", ""), "operador@stockpass.test"));

        assertEquals("A quantidade solicitada excede o estoque disponível.", error.getMessage());
        assertEquals(10, product.getQuantity());
        verify(products, never()).save(any(Product.class));
        verify(movements, never()).save(any(StockMovement.class));
    }

    private void configureSuccessfulMovement() {
        User user = new User();
        user.setName("Operador");
        when(users.findByEmailIgnoreCase("operador@stockpass.test")).thenReturn(Optional.of(user));
        when(products.findByIdForUpdate(1L)).thenReturn(Optional.of(product));
        when(movements.save(any(StockMovement.class))).thenAnswer(call -> call.getArgument(0));
    }
}