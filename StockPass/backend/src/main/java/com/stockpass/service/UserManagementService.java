package com.stockpass.service;

import com.stockpass.model.User;
import com.stockpass.model.UserActivity;
import com.stockpass.repository.UserActivityRepository;
import com.stockpass.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserManagementService {
    private static final Set<String> INTERNAL_ROLES = Set.of("USER", "GESTOR", "ADMIN");
    private final UserRepository users;
    private final UserActivityRepository activities;
    private final PasswordEncoder encoder;

    public record ManagedUser(Long id, String name, String email, String role, boolean active, LocalDateTime lastLoginAt) {}
    public record Activity(Long id, LocalDateTime createdAt, String actor, String action) {}

    public UserManagementService(UserRepository users, UserActivityRepository activities, PasswordEncoder encoder) {
        this.users = users;
        this.activities = activities;
        this.encoder = encoder;
    }

    @Transactional(readOnly = true)
    public List<ManagedUser> list() {
        return users.findAll().stream().filter(user -> INTERNAL_ROLES.contains(user.getRole())).map(this::response).toList();
    }

    @Transactional(readOnly = true)
    public List<Activity> activities() {
        return activities.findAllByOrderByCreatedAtDescIdDesc().stream()
            .map(activity -> new Activity(activity.getId(), activity.getCreatedAt(), activity.getActor(), activity.getAction())).toList();
    }

    @Transactional
    public ManagedUser create(String name, String email, String role, String password, String actorEmail) {
        validateRole(role);
        String normalizedEmail = email.trim();
        if (users.existsByEmailIgnoreCase(normalizedEmail)) throw new IllegalArgumentException("E-mail já cadastrado.");
        User user = new User();
        user.setName(name.trim());
        user.setEmail(normalizedEmail);
        user.setRole(role);
        user.setPassword(encoder.encode(password));
        user.setActive(true);
        users.save(user);
        record(actorEmail, "Criou o usuário " + user.getName() + " (" + role + ").");
        return response(user);
    }

    @Transactional
    public ManagedUser update(Long id, String name, String role, String actorEmail) {
        validateRole(role);
        User user = internalUser(id);
        if (user.getEmail().equalsIgnoreCase(actorEmail)) throw new IllegalArgumentException("Altere seus dados no próprio perfil.");
        protectLastAdmin(user, role, user.isActive());
        user.setName(name.trim());
        user.setRole(role);
        users.save(user);
        record(actorEmail, "Atualizou o usuário " + user.getName() + " (" + role + ").");
        return response(user);
    }

    @Transactional
    public ManagedUser setActive(Long id, boolean active, String actorEmail) {
        User user = internalUser(id);
        if (user.getEmail().equalsIgnoreCase(actorEmail)) throw new IllegalArgumentException("Você não pode alterar o status da própria conta.");
        protectLastAdmin(user, user.getRole(), active);
        user.setActive(active);
        users.save(user);
        record(actorEmail, (active ? "Reativou" : "Desativou") + " o usuário " + user.getName() + ".");
        return response(user);
    }

    private void protectLastAdmin(User user, String role, boolean active) {
        if ("ADMIN".equals(user.getRole()) && user.isActive() && (!active || !"ADMIN".equals(role)) &&
            users.findAllByRoleOrderByNameAsc("ADMIN").stream().filter(User::isActive).count() <= 1) {
            throw new IllegalArgumentException("É necessário manter ao menos um administrador ativo.");
        }
    }

    private User internalUser(Long id) {
        return users.findById(id).filter(user -> INTERNAL_ROLES.contains(user.getRole()))
            .orElseThrow(() -> new IllegalArgumentException("Usuário interno não encontrado."));
    }

    private void validateRole(String role) {
        if (!INTERNAL_ROLES.contains(role)) throw new IllegalArgumentException("Perfil inválido.");
    }

    private void record(String actorEmail, String action) {
        UserActivity activity = new UserActivity();
        activity.setActor(users.findByEmailIgnoreCase(actorEmail).map(User::getName).orElse(actorEmail));
        activity.setAction(action);
        activities.save(activity);
    }

    private ManagedUser response(User user) {
        return new ManagedUser(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.isActive(), user.getLastLoginAt());
    }
}