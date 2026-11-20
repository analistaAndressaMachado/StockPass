package com.stockpass.service;

import com.stockpass.dto.ClientDtos.ClientSummaryResponse;
import com.stockpass.dto.ClientDtos.CreateClientRequest;
import com.stockpass.dto.ClientDtos.UpdateClientRequest;
import com.stockpass.model.User;
import com.stockpass.model.UserActivity;
import com.stockpass.repository.UserRepository;
import com.stockpass.repository.UserActivityRepository;
import com.stockpass.repository.ClientPurchaseRepository;
import com.stockpass.repository.PasswordResetTokenRepository;
import com.stockpass.repository.SupplierOfferRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClientManagementService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final ClientPurchaseRepository purchases;
    private final PasswordResetTokenRepository resetTokens;
    private final SupplierOfferRepository supplierOffers;
    private final UserActivityRepository activities;

    public ClientManagementService(UserRepository users, PasswordEncoder passwordEncoder,
            ClientPurchaseRepository purchases, PasswordResetTokenRepository resetTokens,
            SupplierOfferRepository supplierOffers, UserActivityRepository activities) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.purchases = purchases;
        this.resetTokens = resetTokens;
        this.supplierOffers = supplierOffers;
        this.activities = activities;
    }

    @Transactional
    public ClientSummaryResponse createClient(CreateClientRequest request, String actorEmail) {
        String email = request.email().trim();
        if (users.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("E-mail já cadastrado.");
        }

        User client = new User();
        client.setName(request.name().trim());
        client.setEmail(email);
        client.setPhone(clean(request.phone()));
        client.setPassword(passwordEncoder.encode(request.password()));
        client.setRole("CLIENTE");
        client.setActive(request.active());
        User saved = users.save(client);
        record(actorEmail, "Criou o cliente " + saved.getName() + ".");
        return response(saved);
    }

    @Transactional
    public ClientSummaryResponse updateClient(Long clientId, UpdateClientRequest request, String actorEmail) {
        User client = requireClient(clientId);
        String email = request.email().trim();
        if (users.existsByEmailIgnoreCaseAndIdNot(email, clientId)) {
            throw new IllegalArgumentException("E-mail já cadastrado.");
        }

        String password = request.password();
        if (password != null && !password.isBlank() && password.length() < 6) {
            throw new IllegalArgumentException("A senha deve possuir pelo menos 6 caracteres.");
        }

        client.setName(request.name().trim());
        client.setEmail(email);
        client.setPhone(clean(request.phone()));
        client.setActive(request.active());
        if (password != null && !password.isBlank()) {
            client.setPassword(passwordEncoder.encode(password));
        }
        User saved = users.save(client);
        record(actorEmail, "Editou o cliente " + saved.getName() + ".");
        return response(saved);
    }

    @Transactional
    public void deleteClient(Long clientId, String actorEmail) {
        User client = requireClient(clientId);
        if (purchases.existsByClientId(clientId)) {
            throw new ClientConflictException(
                "Este cliente possui compras e não pode ser excluído. Marque como Inativo.");
        }
        if (supplierOffers.existsBySupplierId(clientId)) {
            throw new ClientConflictException(
                "Este usuário possui ofertas de fornecedor vinculadas e não pode ser excluído.");
        }
        if (client.getPhotoPath() != null && !client.getPhotoPath().isBlank()) {
            throw new ClientConflictException(
                "Este cliente possui foto de perfil. Remova a foto antes de excluir o cliente.");
        }
        resetTokens.deleteAllByUserId(clientId);
        record(actorEmail, "Excluiu o cliente " + client.getName() + ".");
        users.delete(client);
    }

    private void record(String actorEmail, String action) {
        UserActivity activity = new UserActivity();
        activity.setActor(users.findByEmailIgnoreCase(actorEmail).map(User::getName).orElse(actorEmail));
        activity.setAction(action);
        activities.save(activity);
    }

    private User requireClient(Long clientId) {
        return users.findById(clientId)
            .filter(user -> "CLIENTE".equals(user.getRole()))
            .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado."));
    }

    private static ClientSummaryResponse response(User client) {
        return new ClientSummaryResponse(client.getId(), client.getName(), client.getEmail(),
            client.getCreatedAt(), client.getPhone(), client.isActive());
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
