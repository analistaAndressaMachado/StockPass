package com.stockpass.service;

import com.stockpass.dto.StockDtos.SupplierAcquisitionRequest;
import com.stockpass.dto.StockDtos.SupplierAcquisitionResponse;
import com.stockpass.dto.StockDtos.SupplierOfferRequest;
import com.stockpass.dto.StockDtos.SupplierOfferResponse;
import com.stockpass.dto.StockDtos.SupplierProfileResponse;
import com.stockpass.dto.StockDtos.SupplierSaleResponse;
import com.stockpass.model.MovementType;
import com.stockpass.model.Product;
import com.stockpass.model.StockMovement;
import com.stockpass.model.SupplierOffer;
import com.stockpass.model.SupplierPurchase;
import com.stockpass.model.User;
import com.stockpass.repository.ProductRepository;
import com.stockpass.repository.StockMovementRepository;
import com.stockpass.repository.SupplierOfferRepository;
import com.stockpass.repository.SupplierPurchaseRepository;
import com.stockpass.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupplierOfferService {
    private final SupplierOfferRepository offers;
    private final SupplierPurchaseRepository purchases;
    private final ProductRepository products;
    private final StockMovementRepository movements;
    private final UserRepository users;

    public SupplierOfferService(SupplierOfferRepository offers, SupplierPurchaseRepository purchases,
            ProductRepository products, StockMovementRepository movements, UserRepository users) {
        this.offers = offers;
        this.purchases = purchases;
        this.products = products;
        this.movements = movements;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public SupplierProfileResponse profile(String email) {
        User supplier = requireSupplier(email);
        return new SupplierProfileResponse(supplier.getId(), supplier.getName(), supplier.getEmail(),
            supplier.getCompanyName(), supplier.getTaxId(), supplier.getPhone());
    }

    @Transactional(readOnly = true)
    public List<SupplierOfferResponse> marketplace() {
        return offers.findAllByActiveTrueAndAvailableQuantityGreaterThanOrderByNameAsc(0)
            .stream().map(SupplierOfferService::offerResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<SupplierOfferResponse> ownOffers(String email) {
        User supplier = requireSupplier(email);
        return offers.findAllBySupplierIdOrderByCreatedAtDesc(supplier.getId()).stream()
            .map(SupplierOfferService::offerResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<SupplierSaleResponse> salesHistory(String email) {
        User supplier = requireSupplier(email);
        return purchases.findAllBySupplierId(supplier.getId()).stream()
            .map(purchase -> new SupplierSaleResponse(purchase.getId(), purchase.getOffer().getSku(),
                purchase.getProduct().getName(), purchase.getQuantity(), purchase.getUnitPrice(),
                purchase.getUnitPrice().multiply(BigDecimal.valueOf(purchase.getQuantity())),
                purchase.getPurchasedAt()))
            .toList();
    }

    @Transactional
    public SupplierOfferResponse createOffer(String email, SupplierOfferRequest request) {
        User supplier = requireSupplier(email);
        String sku = request.sku().trim();
        if (offers.existsBySupplierIdAndSkuIgnoreCase(supplier.getId(), sku)) {
            throw new IllegalArgumentException("Você já cadastrou uma oferta com esse código.");
        }
        SupplierOffer offer = new SupplierOffer();
        offer.setSupplier(supplier);
        apply(offer, request, sku);
        return offerResponse(offers.save(offer));
    }

    @Transactional
    public SupplierOfferResponse updateOffer(String email, Long offerId, SupplierOfferRequest request) {
        User supplier = requireSupplier(email);
        SupplierOffer offer = offers.findByIdAndSupplierId(offerId, supplier.getId())
            .orElseThrow(() -> new IllegalArgumentException("Oferta não encontrada para este fornecedor."));
        String sku = request.sku().trim();
        if (!offer.getSku().equalsIgnoreCase(sku) && offers.existsBySupplierIdAndSkuIgnoreCase(supplier.getId(), sku)) {
            throw new IllegalArgumentException("Você já cadastrou uma oferta com esse código.");
        }
        apply(offer, request, sku);
        return offerResponse(offers.save(offer));
    }

    @Transactional
    public void deactivateOffer(String email, Long offerId) {
        User supplier = requireSupplier(email);
        SupplierOffer offer = offers.findByIdAndSupplierId(offerId, supplier.getId())
            .orElseThrow(() -> new IllegalArgumentException("Oferta não encontrada para este fornecedor."));
        offer.setActive(false);
        offers.save(offer);
    }

    @Transactional
    public SupplierAcquisitionResponse acquire(Long offerId, SupplierAcquisitionRequest request, String buyerEmail) {
        SupplierOffer offer = offers.findByIdForUpdate(offerId)
            .orElseThrow(() -> new IllegalArgumentException("Oferta não encontrada."));
        if (!offer.isActive()) throw new IllegalArgumentException("Esta oferta não está mais disponível.");
        if (request.quantity() > offer.getAvailableQuantity()) {
            throw new IllegalArgumentException("A quantidade excede o disponível deste fornecedor.");
        }

        User buyer = users.findByEmailIgnoreCase(buyerEmail)
            .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
        Product product = offer.getInventoryProduct();
        if (product == null) {
            product = new Product();
            product.setSku(inventorySku(offer));
            product.setName(offer.getName());
            product.setCategory(offer.getCategory());
            product.setQuantity(0);
            product.setPrice(offer.getPrice());
            product.setSupplier(offer.getSupplier().getCompanyName());
            product.setReorderPoint(0);
            product = products.save(product);
            offer.setInventoryProduct(product);
        }

        product.setQuantity(product.getQuantity() + request.quantity());
        product.setPrice(offer.getPrice());
        product.setSupplier(offer.getSupplier().getCompanyName());
        products.save(product);

        offer.setAvailableQuantity(offer.getAvailableQuantity() - request.quantity());
        offers.save(offer);

        StockMovement movement = new StockMovement();
        movement.setType(MovementType.ENTRY);
        movement.setProduct(product);
        movement.setQuantity(request.quantity());
        movement.setSupplier(offer.getSupplier().getCompanyName());
        movement.setReason("Compra de fornecedor");
        movement.setRegisteredBy(buyer.getName());
        movements.save(movement);

        SupplierPurchase purchase = new SupplierPurchase();
        purchase.setOffer(offer);
        purchase.setProduct(product);
        purchase.setQuantity(request.quantity());
        purchase.setUnitPrice(offer.getPrice());
        purchase.setPurchasedBy(buyer.getName());
        purchase = purchases.save(purchase);

        return new SupplierAcquisitionResponse(purchase.getId(), offer.getId(), product.getId(),
            product.getSku(), product.getName(), offer.getSupplier().getCompanyName(), request.quantity(),
            offer.getPrice(), offer.getPrice().multiply(BigDecimal.valueOf(request.quantity())),
            product.getQuantity(), purchase.getPurchasedAt());
    }

    private User requireSupplier(String email) {
        User supplier = users.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new IllegalArgumentException("Fornecedor não encontrado."));
        if (!"FORNECEDOR".equals(supplier.getRole())) {
            throw new IllegalArgumentException("Esta operação é exclusiva para contas de fornecedor.");
        }
        return supplier;
    }

    private static void apply(SupplierOffer offer, SupplierOfferRequest request, String sku) {
        offer.setSku(sku);
        offer.setName(request.name().trim());
        offer.setCategory(request.category().trim());
        offer.setPrice(request.price());
        offer.setAvailableQuantity(request.availableQuantity());
        offer.setActive(true);
    }

    private String inventorySku(SupplierOffer offer) {
        String requestedSku = offer.getSku();
        if (!products.existsBySkuIgnoreCase(requestedSku)) return requestedSku;
        return "SUP-" + offer.getId() + "-" + requestedSku;
    }

    private static SupplierOfferResponse offerResponse(SupplierOffer offer) {
        User supplier = offer.getSupplier();
        return new SupplierOfferResponse(offer.getId(), offer.getSku(), offer.getName(), offer.getCategory(),
            offer.getPrice(), offer.getAvailableQuantity(), supplier.getId(), supplier.getName(),
            supplier.getCompanyName());
    }
}