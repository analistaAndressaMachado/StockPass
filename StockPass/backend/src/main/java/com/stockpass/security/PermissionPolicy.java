package com.stockpass.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockpass.model.User;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

public final class PermissionPolicy {
    public static final Set<String> MODULES = Set.of("painel", "catalogo", "entrada", "saida", "relatorios", "clientes", "fornecedores", "usuarios");
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final Map<String, String> LEVELS = Map.of("nenhum", "nenhum", "ver", "ver", "editar", "editar");

    private PermissionPolicy() {}

    public static Map<String, String> defaults(String role) {
        Map<String, String> result = new LinkedHashMap<>();
        for (String module : MODULES) result.put(module, "nenhum");
        if (!Set.of("USER", "GESTOR", "ADMIN").contains(role)) return result;
        for (String module : Set.of("painel", "relatorios")) result.put(module, "ver");
        for (String module : Set.of("catalogo", "entrada", "saida")) result.put(module, "editar");
        result.put("clientes", "USER".equals(role) ? "ver" : "editar");
        result.put("fornecedores", "USER".equals(role) ? "ver" : "editar");
        result.put("usuarios", "GESTOR".equals(role) ? "ver" : "nenhum");
        if ("ADMIN".equals(role)) {
            result.put("usuarios", "editar");
            result.put("clientes", "editar");
        }
        return result;
    }

    public static Map<String, String> effective(User user) {
        Map<String, String> result = defaults(user.getRole());
        if (user.getPermissionsJson() == null || user.getPermissionsJson().isBlank()) return result;
        try {
            Map<String, String> saved = JSON.readValue(user.getPermissionsJson(), new TypeReference<>() {});
            saved.forEach((module, level) -> {
                if (MODULES.contains(module) && LEVELS.containsKey(level)) result.put(module, level);
            });
        } catch (Exception ignored) { }
        return result;
    }

    public static void apply(User user, Map<String, String> requested) {
        Map<String, String> result = defaults(user.getRole());
        if (requested != null) requested.forEach((module, level) -> {
            if (module == null || level == null || !MODULES.contains(module) || !LEVELS.containsKey(level)) {
                throw new IllegalArgumentException("Permissão inválida.");
            }
            result.put(module, level);
        });
        try { user.setPermissionsJson(JSON.writeValueAsString(result)); }
        catch (Exception error) { throw new IllegalStateException("Não foi possível salvar as permissões.", error); }
    }
}
