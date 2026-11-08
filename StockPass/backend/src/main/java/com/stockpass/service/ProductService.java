package com.stockpass.service;

import com.stockpass.dto.StockDtos.ProductRequest;
import com.stockpass.dto.StockDtos.ProductResponse;
import com.stockpass.dto.StockDtos.ProductUpdateRequest;
import com.stockpass.model.MovementType;
import com.stockpass.model.Product;
import com.stockpass.model.StockMovement;
import com.stockpass.repository.ProductRepository;
import com.stockpass.repository.StockMovementRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {
    private final ProductRepository products;
    private final StockMovementRepository movements;

    public ProductService(ProductRepository products, StockMovementRepository movements) {
        this.products = products;
        this.movements = movements;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> list() {
        return products.findAllByOrderByNameAsc().stream().map(ProductService::response).toList();
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
        product.setCategory(request.category().trim());
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
        return response(product);
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
        product.setCategory(request.category().trim());
        product.setPrice(request.price());
        product.setSupplier(request.supplier().trim());
        product.setReorderPoint(request.reorderPoint());
        return response(products.save(product));
    }

    public static ProductResponse response(Product product) {
        return new ProductResponse(product.getId(), product.getSku(), product.getName(),
            product.getCategory(), product.getQuantity(), product.getPrice(),
            product.getSupplier(), product.getReorderPoint());
    }
}