package com.stockpass.service;

import com.stockpass.dto.StockDtos.EntryRequest;
import com.stockpass.dto.StockDtos.ExitRequest;
import com.stockpass.dto.StockDtos.MovementResponse;
import com.stockpass.dto.StockDtos.StockReservationResponse;
import com.stockpass.model.MovementType;
import com.stockpass.model.Product;
import com.stockpass.model.ReplenishmentStatus;
import com.stockpass.model.StockMovement;
import com.stockpass.model.StockReplenishment;
import com.stockpass.model.StockReservation;
import com.stockpass.repository.ProductRepository;
import com.stockpass.repository.StockMovementRepository;
import com.stockpass.repository.StockReplenishmentRepository;
import com.stockpass.repository.StockReservationRepository;
import com.stockpass.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockMovementService {
    private static final Set<String> EXIT_REASONS = Set.of("Venda", "Perda", "Devolução", "Outro");

    private final ProductRepository products;
    private final StockMovementRepository movements;
    private final StockReplenishmentRepository replenishments;
    private final StockReservationRepository reservations;
    private final UserRepository users;

    public StockMovementService(ProductRepository products, StockMovementRepository movements,
            StockReplenishmentRepository replenishments, StockReservationRepository reservations,
            UserRepository users) {
        this.products = products;
        this.movements = movements;
        this.replenishments = replenishments;
        this.reservations = reservations;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<MovementResponse> list(MovementType type) {
        return movements.findAllByTypeOrderByCreatedAtDesc(type).stream()
            .map(StockMovementService::response).toList();
    }

    @Transactional
    public MovementResponse entry(EntryRequest request, String email) {
        Product product = activeProduct(request.productId());
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
            int received = replenishment.getQuantityReceived() + request.quantity();
            if (received > replenishment.getQuantity()) {
                throw new IllegalArgumentException("A quantidade recebida excede o saldo da reposição agendada.");
            }
            replenishment.setQuantityReceived(received);
            if (received == replenishment.getQuantity()) {
                replenishment.setStatus(ReplenishmentStatus.COMPLETED);
                replenishment.setCompletedAt(LocalDateTime.now());
            }
            replenishments.save(replenishment);
        }
        return response(movements.save(movement));
    }

    /** Endpoint legado: continua registrando a saída imediatamente para manter o frontend atual compatível. */
    @Transactional
    public MovementResponse exit(ExitRequest request, String email) {
        validateReason(request.reason());
        Product product = activeProduct(request.productId());
        LocalDateTime now = LocalDateTime.now();
        expireForProduct(product.getId(), now);
        if (request.quantity() > available(product, now)) {
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

    @Transactional
    public StockReservationResponse reserveExit(ExitRequest request, String email) {
        validateReason(request.reason());
        Product product = activeProduct(request.productId());
        LocalDateTime now = LocalDateTime.now();
        expireForProduct(product.getId(), now);
        if (request.quantity() > available(product, now)) {
            throw new IllegalArgumentException("A quantidade solicitada excede o estoque disponível.");
        }

        StockReservation reservation = new StockReservation();
        reservation.setProduct(product);
        reservation.setQuantity(request.quantity());
        reservation.setReason(request.reason());
        reservation.setObservation(clean(request.observation()));
        reservation.setCreatedBy(userName(email));
        reservation.setCreatedAt(now);
        reservation.setExpiresAt(now.plusSeconds(120));
        reservation.setStatus(StockReservation.ACTIVE);
        return reservationResponse(reservations.save(reservation));
    }

    @Transactional
    public MovementResponse confirmReservation(Long reservationId) {
        if (reservations.acquireWriteLock(reservationId) == 0) {
            throw new IllegalArgumentException("Reserva não encontrada.");
        }
        StockReservation initial = reservations.findById(reservationId)
            .orElseThrow(() -> new IllegalArgumentException("Reserva não encontrada."));
        Product product = lockedProduct(initial.getProduct().getId());
        if (!product.isActive()) {
            throw new IllegalArgumentException("Não é possível confirmar a reserva: o produto está inativo.");
        }
        StockReservation reservation = reservations.findByIdForUpdate(reservationId)
            .orElseThrow(() -> new IllegalArgumentException("Reserva não encontrada."));
        LocalDateTime now = LocalDateTime.now();
        expireForProduct(product.getId(), now);
        expireIfOverdue(reservation, now);
        if (!reservation.getStatus().equals(StockReservation.ACTIVE)) {
            throw new IllegalArgumentException(reservation.getStatus().equals(StockReservation.EXPIRED)
                ? "Esta reserva já expirou." : "Esta reserva já foi encerrada.");
        }
        if (available(product, now) < 0) {
            throw new IllegalArgumentException("As reservas excedem o estoque disponível. Atualize o estoque antes de confirmar.");
        }

        product.setQuantity(product.getQuantity() - reservation.getQuantity());
        products.save(product);
        StockMovement movement = new StockMovement();
        movement.setType(MovementType.EXIT);
        movement.setProduct(product);
        movement.setQuantity(reservation.getQuantity());
        movement.setReason(reservation.getReason());
        movement.setObservation(reservation.getObservation());
        movement.setRegisteredBy(reservation.getCreatedBy());
        reservation.setStatus(StockReservation.CONFIRMED);
        reservation.setResolvedAt(now);
        reservations.save(reservation);
        return response(movements.save(movement));
    }

    @Transactional
    public StockReservationResponse cancelReservation(Long reservationId) {
        if (reservations.acquireWriteLock(reservationId) == 0) {
            throw new IllegalArgumentException("Reserva não encontrada.");
        }
        StockReservation initial = reservations.findById(reservationId)
            .orElseThrow(() -> new IllegalArgumentException("Reserva não encontrada."));
        Product product = lockedProduct(initial.getProduct().getId());
        StockReservation reservation = reservations.findByIdForUpdate(reservationId)
            .orElseThrow(() -> new IllegalArgumentException("Reserva não encontrada."));
        LocalDateTime now = LocalDateTime.now();
        expireForProduct(product.getId(), now);
        if (reservation.getStatus().equals(StockReservation.ACTIVE)) {
            if (!reservation.getExpiresAt().isAfter(now)) expireIfOverdue(reservation, now);
            else {
                reservation.setStatus(StockReservation.CANCELLED);
                reservation.setResolvedAt(now);
            }
        }
        return reservationResponse(reservations.save(reservation));
    }

    @Transactional
    public List<StockReservationResponse> activeReservations() {
        LocalDateTime now = LocalDateTime.now();
        expireDueReservations(now);
        return reservations.findAllByStatusOrderByCreatedAtAsc(StockReservation.ACTIVE).stream()
            .filter(item -> item.getExpiresAt().isAfter(now))
            .map(StockMovementService::reservationResponse).toList();
    }

    @Scheduled(fixedDelay = 1000)
    @Transactional
    public void expireReservations() {
        expireDueReservations(LocalDateTime.now());
    }

    private void expireDueReservations(LocalDateTime now) {
        List<StockReservation> due = reservations.findAllByStatusAndExpiresAtLessThanEqual(
            StockReservation.ACTIVE, now);
        for (StockReservation item : due) {
            Product product = lockedProduct(item.getProduct().getId());
            expireForProduct(product.getId(), now);
        }
    }

    private void expireForProduct(Long productId, LocalDateTime now) {
        List<StockReservation> due = reservations.findAllByProductIdAndStatusAndExpiresAtLessThanEqual(
            productId, StockReservation.ACTIVE, now);
        for (StockReservation item : due) {
            reservations.findByIdForUpdate(item.getId()).ifPresent(reservation -> {
                if (reservation.getStatus().equals(StockReservation.ACTIVE) && !reservation.getExpiresAt().isAfter(now)) {
                    expireIfOverdue(reservation, now);
                    reservations.save(reservation);
                }
            });
        }
    }

    private static void expireIfOverdue(StockReservation reservation, LocalDateTime now) {
        if (reservation.getStatus().equals(StockReservation.ACTIVE) && !reservation.getExpiresAt().isAfter(now)) {
            reservation.setStatus(StockReservation.EXPIRED);
            reservation.setResolvedAt(now);
        }
    }

    private int available(Product product, LocalDateTime now) {
        Long reserved = reservations.sumActiveQuantity(product.getId(), now);
        return product.getQuantity() - Math.toIntExact(reserved);
    }

    private static void validateReason(String reason) {
        if (!EXIT_REASONS.contains(reason)) {
            throw new IllegalArgumentException("Selecione um motivo válido para a saída.");
        }
    }

    private Product lockedProduct(Long id) {
        if (products.acquireWriteLock(id) == 0) {
            throw new IllegalArgumentException("Produto não encontrado.");
        }
        return products.findByIdForUpdate(id)
            .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado."));
    }

    private Product activeProduct(Long id) {
        Product product = lockedProduct(id);
        if (!product.isActive()) throw new IllegalArgumentException("Este produto está inativo e não aceita novas movimentações.");
        return product;
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

    private static StockReservationResponse reservationResponse(StockReservation reservation) {
        Product product = reservation.getProduct();
        return new StockReservationResponse(reservation.getId(), product.getId(), product.getSku(),
            product.getName(), reservation.getQuantity(), reservation.getReason(), reservation.getObservation(),
            reservation.getCreatedBy(), reservation.getCreatedAt(), reservation.getExpiresAt(), reservation.getStatus());
    }
}
