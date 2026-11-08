package com.stockpass.service;

import com.stockpass.dto.StockDtos.EntryRequest;
import com.stockpass.dto.StockDtos.ExitRequest;
import com.stockpass.dto.StockDtos.MovementResponse;
import com.stockpass.model.MovementType;
import com.stockpass.model.Product;
import com.stockpass.model.ReplenishmentStatus;
import com.stockpass.model.StockMovement;
import com.stockpass.model.StockReplenishment;
import com.stockpass.repository.ProductRepository;
import com.stockpass.repository.StockReplenishmentRepository;
import com.stockpass.repository.StockMovementRepository;
import com.stockpass.repository.UserRepository;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockMovementService {
    private static final Set<String> EXIT_REASONS = Set.of("Venda", "Perda", "Devolução", "Outro");

    private final ProductRepository products;
    private final StockMovementRepository movements;
    private final StockReplenishmentRepository replenishments;
    private final UserRepository users;

    public StockMovementService(ProductRepository products, StockMovementRepository movements,
            StockReplenishmentRepository replenishments, UserRepository users) {
        this.products = products;
        this.movements = movements;
        this.replenishments = replenishments;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<MovementResponse> list(MovementType type) {
        return movements.findAllByTypeOrderByCreatedAtDesc(type).stream()
            .map(StockMovementService::response).toList();
    }

    @Transactional
    public MovementResponse entry(EntryRequest request, String email) {
        Product product = lockedProduct(request.productId());
        product.setQuantity(product.getQuantity() + request.quantity());
        products.save(product);

        StockMovement movement = new StockMovement();
        movement.setType(MovementType.ENTRY);
        movement.setProduct(product);
        movement.setQuantity(request.quantity());
        movement.setSupplier(product.getSupplier());
        movement.setInvoiceNumber(clean(request.invoiceNumber()));
        movement.setRegisteredBy(userName(email));

        if (request.replenishmentId() != null) {
            StockReplenishment replenishment = replenishments.findByIdForUpdate(request.replenishmentId())
                .orElseThrow(() -> new IllegalArgumentException("Reposição agendada não encontrada."));
            if (!java.util.Objects.equals(replenishment.getProduct().getId(), product.getId())) {
                throw new IllegalArgumentException("A reposição selecionada pertence a outro produto.");
            }
            if (replenishment.getStatus() != ReplenishmentStatus.SCHEDULED) {
                throw new IllegalArgumentException("Esta reposição já foi concluída.");
            }
            int recebido = replenishment.getQuantityReceived() + request.quantity();
            if (recebido > replenishment.getQuantity()) {
                throw new IllegalArgumentException("A quantidade recebida excede o saldo da reposição agendada.");
            }
            replenishment.setQuantityReceived(recebido);
            if (recebido == replenishment.getQuantity()) {
                replenishment.setStatus(ReplenishmentStatus.COMPLETED);
                replenishment.setCompletedAt(java.time.LocalDateTime.now());
            }
            replenishments.save(replenishment);
        }
        return response(movements.save(movement));
    }

    @Transactional
    public MovementResponse exit(ExitRequest request, String email) {
        if (!EXIT_REASONS.contains(request.reason())) {
            throw new IllegalArgumentException("Selecione um motivo válido para a saída.");
        }
        Product product = lockedProduct(request.productId());
        if (request.quantity() > product.getQuantity()) {
            throw new IllegalArgumentException("A quantidade solicitada excede o estoque disponível.");
        }
        product.setQuantity(product.getQuantity() - request.quantity());
        products.save(product);

        StockMovement movement = new StockMovement();
        movement.setType(MovementType.EXIT);
        movement.setProduct(product);
        movement.setQuantity(request.quantity());
        movement.setReason(request.reason());
        movement.setObservation(clean(request.observation()));
        movement.setRegisteredBy(userName(email));
        return response(movements.save(movement));
    }

    private Product lockedProduct(Long id) {
        return products.findByIdForUpdate(id)
            .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado."));
    }

    private String userName(String email) {
        return users.findByEmailIgnoreCase(email).map(user -> user.getName()).orElse(email);
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static MovementResponse response(StockMovement movement) {
        Product product = movement.getProduct();
        return new MovementResponse(movement.getId(), movement.getType().name(), movement.getCreatedAt(),
            product.getSku(), product.getName(), movement.getQuantity(), movement.getSupplier(),
            movement.getInvoiceNumber(), movement.getReason(), movement.getRegisteredBy(),
            movement.getObservation());
    }
}