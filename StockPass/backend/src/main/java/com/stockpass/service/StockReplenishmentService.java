package com.stockpass.service;

import com.stockpass.dto.StockDtos.ReplenishmentRequest;
import com.stockpass.dto.StockDtos.ReplenishmentResponse;
import com.stockpass.model.Product;
import com.stockpass.model.StockReplenishment;
import com.stockpass.repository.ProductRepository;
import com.stockpass.repository.StockReplenishmentRepository;
import com.stockpass.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockReplenishmentService {
    private final ProductRepository products;
    private final StockReplenishmentRepository replenishments;
    private final UserRepository users;

    public StockReplenishmentService(ProductRepository products,
            StockReplenishmentRepository replenishments, UserRepository users) {
        this.products = products;
        this.replenishments = replenishments;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<ReplenishmentResponse> list() {
        return replenishments.findAllByOrderByScheduledAtDesc().stream()
            .map(StockReplenishmentService::response).toList();
    }

    @Transactional
    public ReplenishmentResponse schedule(ReplenishmentRequest request, String email) {
        Product product = products.findByIdForUpdate(request.productId())
            .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado."));
        StockReplenishment replenishment = new StockReplenishment();
        replenishment.setProduct(product);
        replenishment.setQuantity(request.quantity());
        replenishment.setRegisteredBy(users.findByEmailIgnoreCase(email)
            .map(user -> user.getName()).orElse(email));
        return response(replenishments.save(replenishment));
    }

    private static ReplenishmentResponse response(StockReplenishment replenishment) {
        Product product = replenishment.getProduct();
        return new ReplenishmentResponse(replenishment.getId(), product.getId(), product.getSku(),
            product.getName(), replenishment.getQuantity(), replenishment.getQuantityReceived(),
            replenishment.getStatus(), replenishment.getScheduledAt(), replenishment.getCompletedAt(),
            replenishment.getRegisteredBy());
    }
}