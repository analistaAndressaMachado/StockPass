package com.stockpass.service;

import com.stockpass.dto.StockDtos.ProductRequest;
import com.stockpass.dto.StockDtos.ProductResponse;
import com.stockpass.dto.StockDtos.ProductUpdateRequest;
import com.stockpass.model.MovementType;
import com.stockpass.model.Product;
import com.stockpass.model.Category;
import com.stockpass.model.StockMovement;
import com.stockpass.repository.ProductRepository;
import com.stockpass.repository.StockMovementRepository;
import com.stockpass.repository.StockReservationRepository;
import java.util.List;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {
    private final ProductRepository products;
    private final StockMovementRepository movements;
    private final StockReservationRepository reservations;
    private final CategoryService categories;

    public ProductService(ProductRepository products, StockMovementRepository movements,
            StockReservationRepository reservations, CategoryService categories) {
        this.products = products;
        this.movements = movements;
        this.reservations = reservations;
        this.categories = categories;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> list() {
        LocalDateTime now = LocalDateTime.now();
        return products.findAllByOrderByNameAsc().stream().map(product -> response(product, reserved(product, now))).toList();
    }

    @Transactional
    public ProductResponse create(ProductRequest request, String registeredBy) {
        String sku = request.sku().trim();
        if (products.existsBySkuIgnoreCase(sku)) {
            throw new IllegalArgumentException("Já existe um produto com esse código.");
        }

        Product product = new Product();
        product.setSku(sku);
        product.setName(request.name().trim());
        product.setCategory(categories.requireActive(request.categoryId()));
        product.setLegacyCategory(product.getCategory().getName());
        product.setQuantity(request.initialQuantity());
        product.setPrice(request.price());
        product.setSupplier(request.supplier().trim());
        product.setReorderPoint(request.reorderPoint());
        product = products.save(product);

        if (product.getQuantity() > 0) {
            StockMovement initialEntry = new StockMovement();
            initialEntry.setType(MovementType.ENTRY);
            initialEntry.setProduct(product);
            initialEntry.setQuantity(product.getQuantity());
            initialEntry.setSupplier(product.getSupplier());
            initialEntry.setReason("Cadastro inicial");
            initialEntry.setRegisteredBy(registeredBy);
            movements.save(initialEntry);
        }
        return response(product, 0);
    }

    @Transactional
    public ProductResponse update(Long id, ProductUpdateRequest request) {
        Product product = products.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado."));
        String sku = request.sku().trim();
        if (!product.getSku().equalsIgnoreCase(sku) && products.existsBySkuIgnoreCaseAndIdNot(sku, id)) {
            throw new IllegalArgumentException("Já existe outro produto com esse código.");
        }
        product.setSku(sku);
        product.setName(request.name().trim());
        Category requestedCategory = product.getCategory().getId().equals(request.categoryId())
            ? product.getCategory() : categories.requireActive(request.categoryId());
        product.setCategory(requestedCategory);
        product.setLegacyCategory(requestedCategory.getName());
        product.setPrice(request.price());
        product.setSupplier(request.supplier().trim());
        product.setReorderPoint(request.reorderPoint());
        Product saved = products.save(product);
        return response(saved, reserved(saved, LocalDateTime.now()));
    }

    private int reserved(Product product, LocalDateTime now) {
        return Math.toIntExact(reservations.sumActiveQuantity(product.getId(), now));
    }

    private static ProductResponse response(Product product, int reserved) {
        return new ProductResponse(product.getId(), product.getSku(), product.getName(),
            product.getCategory().getId(), product.getCategory().getName(), product.getQuantity(), product.getPrice(),
            product.getSupplier(), product.getReorderPoint(), product.getQuantity(), reserved,
            product.getQuantity() - reserved);
    }
}
