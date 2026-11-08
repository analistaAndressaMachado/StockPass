package com.stockpass.service;

import com.stockpass.dto.ClientDtos.PurchaseLineRequest;
import com.stockpass.dto.ClientDtos.PurchaseLineResponse;
import com.stockpass.dto.ClientDtos.PurchaseRequest;
import com.stockpass.dto.ClientDtos.PurchaseResponse;
import com.stockpass.dto.ClientDtos.StoreProductResponse;
import com.stockpass.dto.ClientDtos.ClientSummaryResponse;
import com.stockpass.model.ClientPurchase;
import com.stockpass.model.ClientPurchaseItem;
import com.stockpass.model.MovementType;
import com.stockpass.model.Product;
import com.stockpass.model.StockMovement;
import com.stockpass.model.User;
import com.stockpass.repository.ClientPurchaseItemRepository;
import com.stockpass.repository.ClientPurchaseRepository;
import com.stockpass.repository.ProductRepository;
import com.stockpass.repository.StockMovementRepository;
import com.stockpass.repository.UserRepository;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClientStoreService {
    private static final Set<String> PAYMENT_METHODS = Set.of("PIX", "CREDIT_CARD", "DEBIT_CARD");
    private static final String DEMO_PAYMENT_STATUS = "SIMULATED_PAID";

    private final ProductRepository products;
    private final ClientPurchaseRepository purchases;
    private final ClientPurchaseItemRepository purchaseItems;
    private final StockMovementRepository movements;
    private final UserRepository users;

    public ClientStoreService(ProductRepository products, ClientPurchaseRepository purchases,
            ClientPurchaseItemRepository purchaseItems, StockMovementRepository movements, UserRepository users) {
        this.products = products;
        this.purchases = purchases;
        this.purchaseItems = purchaseItems;
        this.movements = movements;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<StoreProductResponse> products() {
        return products.findAllByOrderByNameAsc().stream()
            .filter(product -> product.getQuantity() > 0)
            .map(product -> new StoreProductResponse(product.getId(), product.getSku(), product.getName(),
                product.getCategory(), product.getPrice(), product.getQuantity()))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<PurchaseResponse> purchases(String email) {
        User client = requireClient(email);
        return purchases.findAllByClientIdOrderByCreatedAtDesc(client.getId()).stream()
            .map(this::response).toList();
    }

    @Transactional(readOnly = true)
    public List<ClientSummaryResponse> clients() {
        return users.findAllByRoleOrderByNameAsc("CLIENTE").stream()
            .map(client -> new ClientSummaryResponse(client.getId(), client.getName(), client.getEmail(), client.getCreatedAt()))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<PurchaseResponse> clientPurchases(Long clientId) {
        User client = users.findById(clientId)
            .filter(user -> "CLIENTE".equals(user.getRole()))
            .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado."));
        return purchases.findAllByClientIdOrderByCreatedAtDesc(client.getId()).stream()
            .map(this::response).toList();
    }

    @Transactional
    public PurchaseResponse purchase(PurchaseRequest request, String email) {
        User client = requireClient(email);
        String paymentMethod = request.paymentMethod().trim().toUpperCase();
        if (!PAYMENT_METHODS.contains(paymentMethod)) {
            throw new IllegalArgumentException("Selecione uma forma de pagamento demonstrativa válida.");
        }

        Set<Long> productIds = new HashSet<>();
        for (PurchaseLineRequest item : request.items()) {
            if (!productIds.add(item.productId())) {
                throw new IllegalArgumentException("Remova itens duplicados do carrinho antes de confirmar.");
            }
        }

        List<PurchaseLineRequest> orderedItems = request.items().stream()
            .sorted((first, second) -> first.productId().compareTo(second.productId())).toList();
        java.util.Map<Long, Product> lockedProducts = new java.util.LinkedHashMap<>();
        BigDecimal total = BigDecimal.ZERO;
        for (PurchaseLineRequest item : orderedItems) {
            Product product = products.findByIdForUpdate(item.productId())
                .orElseThrow(() -> new IllegalArgumentException("Um produto do carrinho não está disponível."));
            if (item.quantity() > product.getQuantity()) {
                throw new IllegalArgumentException("Estoque insuficiente para " + product.getName() + ".");
            }
            lockedProducts.put(product.getId(), product);
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(item.quantity())));
        }

        ClientPurchase purchase = new ClientPurchase();
        purchase.setOrderNumber("DEMO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        purchase.setClient(client);
        purchase.setTotal(total);
        purchase.setPaymentMethod(paymentMethod);
        purchase.setPaymentStatus(DEMO_PAYMENT_STATUS);
        purchase = purchases.save(purchase);

        for (PurchaseLineRequest requested : orderedItems) {
            Product product = lockedProducts.get(requested.productId());
            product.setQuantity(product.getQuantity() - requested.quantity());
            products.save(product);

            ClientPurchaseItem line = new ClientPurchaseItem();
            line.setPurchase(purchase);
            line.setProduct(product);
            line.setQuantity(requested.quantity());
            line.setUnitPrice(product.getPrice());
            purchaseItems.save(line);

            StockMovement movement = new StockMovement();
            movement.setType(MovementType.EXIT);
            movement.setProduct(product);
            movement.setQuantity(requested.quantity());
            movement.setReason("Venda");
            movement.setObservation("Pedido " + purchase.getOrderNumber() +
                "; pagamento demonstrativo via " + paymentMethod);
            movement.setRegisteredBy(client.getName());
            movements.save(movement);
        }
        return response(purchase);
    }

    private User requireClient(String email) {
        User client = users.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado."));
        if (!"CLIENTE".equals(client.getRole())) {
            throw new IllegalArgumentException("Esta área é exclusiva para contas de cliente.");
        }
        return client;
    }

    private PurchaseResponse response(ClientPurchase purchase) {
        List<PurchaseLineResponse> lines = purchaseItems.findAllByPurchaseIdOrderByIdAsc(purchase.getId()).stream()
            .map(item -> new PurchaseLineResponse(item.getProduct().getId(), item.getProduct().getSku(),
                item.getProduct().getName(), item.getQuantity(), item.getUnitPrice(),
                item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()))))
            .toList();
        return new PurchaseResponse(purchase.getId(), purchase.getOrderNumber(), purchase.getTotal(),
            purchase.getPaymentMethod(), purchase.getPaymentStatus(), purchase.getCreatedAt(), lines);
    }
}