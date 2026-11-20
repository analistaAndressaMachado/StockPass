package com.stockpass.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockpass.model.ClientPurchase;
import com.stockpass.model.PasswordResetToken;
import com.stockpass.model.SupplierOffer;
import com.stockpass.model.User;
import com.stockpass.repository.ClientPurchaseRepository;
import com.stockpass.repository.PasswordResetTokenRepository;
import com.stockpass.repository.SupplierOfferRepository;
import com.stockpass.repository.UserRepository;
import com.stockpass.security.JwtService;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ClientsControllerTest {
    private static final String[] ROLES = {"USER", "GESTOR", "ADMIN", "CLIENTE"};

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwt;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository users;
    @Autowired private ClientPurchaseRepository purchases;
    @Autowired private PasswordResetTokenRepository resetTokens;
    @Autowired private SupplierOfferRepository supplierOffers;
    @Autowired private PasswordEncoder passwordEncoder;

    private final Map<String, User> roleUsers = new LinkedHashMap<>();

    @BeforeEach
    void createRoleUsers() {
        String suffix = UUID.randomUUID().toString();
        for (String role : ROLES) {
            User user = new User();
            user.setName("Usuário " + role);
            user.setEmail(role.toLowerCase() + "-" + suffix + "@stockpass.test");
            user.setPassword("encoded-password");
            user.setRole(role);
            roleUsers.put(role, users.save(user));
        }
    }

    @Test
    void adminAndManagerCanCreateClientAndResponsesNeverExposePassword() throws Exception {
        for (String role : new String[] {"ADMIN", "GESTOR"}) {
            String email = role.toLowerCase() + "-new-" + UUID.randomUUID() + "@stockpass.test";
            String plainPassword = "senha-inicial-secreta";
            mockMvc.perform(post("/api/clients").header("Authorization", bearer(token(role)))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(clientBody("Cliente " + role, email,
                        "11987654321", plainPassword, true))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Cliente " + role))
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.phone").value("11987654321"))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.role").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist());

            User saved = users.findByEmailIgnoreCase(email).orElseThrow();
            org.junit.jupiter.api.Assertions.assertEquals("CLIENTE", saved.getRole());
            org.junit.jupiter.api.Assertions.assertTrue(passwordEncoder.matches(plainPassword, saved.getPassword()));
            org.junit.jupiter.api.Assertions.assertNotEquals(plainPassword, saved.getPassword());

            mockMvc.perform(get("/api/clients").header("Authorization", bearer(token(role))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.email == '%s')].phone".formatted(email)).value(
                    org.hamcrest.Matchers.hasItem("11987654321")))
                .andExpect(jsonPath("$[?(@.email == '%s')].active".formatted(email)).value(
                    org.hamcrest.Matchers.hasItem(true)));
        }
    }

    @Test
    void duplicateEmailIsRejectedAcrossAllUserRoles() throws Exception {
        for (String role : ROLES) {
            mockMvc.perform(post("/api/clients").header("Authorization", bearer(token("ADMIN")))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(clientBody("Duplicado",
                        roleUsers.get(role).getEmail(), null, "senha123", true))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
        }
    }

    @Test
    void invalidEmailShortPasswordAndBlankNameAreRejected() throws Exception {
        assertInvalid(clientBody("Nome válido", "email-invalido", null, "senha123", true), "$.message");
        assertInvalid(clientBody("Nome válido", uniqueEmail(), null, "12345", true), "$.message");
        assertInvalid(clientBody("   ", uniqueEmail(), null, "senha123", true), "$.message");
    }

    @Test
    void postIsForbiddenForUserAndClient() throws Exception {
        for (String role : new String[] {"USER", "CLIENTE"}) {
            mockMvc.perform(post("/api/clients").header("Authorization", bearer(token(role)))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(clientBody("Sem permissão", uniqueEmail(),
                        null, "senha123", true))))
                .andExpect(status().isForbidden());
        }
    }

    @Test
    void inactiveClientAppearsInactiveAndCannotLogIn() throws Exception {
        String email = uniqueEmail();
        String password = "senha-inicial";
        mockMvc.perform(post("/api/clients").header("Authorization", bearer(token("ADMIN")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(clientBody("Cliente inativo", email,
                    null, password, false))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.active").value(false))
            .andExpect(jsonPath("$.password").doesNotExist());

        mockMvc.perform(get("/api/clients").header("Authorization", bearer(token("ADMIN"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.email == '%s')].active".formatted(email)).value(
                org.hamcrest.Matchers.hasItem(false)));

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void adminAndManagerCanEditClientWithoutChangingPasswordOrRole() throws Exception {
        for (String role : new String[] {"ADMIN", "GESTOR"}) {
            User client = newClient("Editar " + role);
            String oldPassword = "senha-antiga";
            client.setPassword(passwordEncoder.encode(oldPassword));
            users.save(client);

            mockMvc.perform(put("/api/clients/" + client.getId())
                    .header("Authorization", bearer(token(role))).contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(updateBody("Nome atualizado " + role,
                        client.getEmail(), "11911112222", null, true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Nome atualizado " + role))
                .andExpect(jsonPath("$.email").value(client.getEmail()))
                .andExpect(jsonPath("$.phone").value("11911112222"))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.role").doesNotExist());

            User updated = users.findById(client.getId()).orElseThrow();
            org.junit.jupiter.api.Assertions.assertEquals("CLIENTE", updated.getRole());
            org.junit.jupiter.api.Assertions.assertTrue(passwordEncoder.matches(oldPassword, updated.getPassword()));
            assertLogin(client.getEmail(), oldPassword, 200);
        }
    }

    @Test
    void editingWithNewPasswordEncodesItAndUsesItForLogin() throws Exception {
        User client = newClient("Troca senha");
        String oldPassword = "senha-antiga";
        String newPassword = "senha-nova-segura";
        client.setPassword(passwordEncoder.encode(oldPassword));
        users.save(client);

        mockMvc.perform(put("/api/clients/" + client.getId())
                .header("Authorization", bearer(token("ADMIN"))).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateBody(client.getName(), client.getEmail(),
                    client.getPhone(), newPassword, true))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.password").doesNotExist());

        User updated = users.findById(client.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertTrue(passwordEncoder.matches(newPassword, updated.getPassword()));
        assertLogin(client.getEmail(), oldPassword, 400);
        assertLogin(client.getEmail(), newPassword, 200);
    }

    @Test
    void editingWithShortNonemptyPasswordIsRejected() throws Exception {
        User client = newClient("Senha curta");
        String oldPasswordHash = client.getPassword();
        mockMvc.perform(put("/api/clients/" + client.getId())
                .header("Authorization", bearer(token("ADMIN"))).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateBody(client.getName(), client.getEmail(),
                    client.getPhone(), "12345", true))))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").isNotEmpty());
        org.junit.jupiter.api.Assertions.assertEquals(oldPasswordHash,
            users.findById(client.getId()).orElseThrow().getPassword());
    }

    @Test
    void otherUsersEmailIsRejectedAndOwnEmailCanRemainUnchanged() throws Exception {
        User client = newClient("E-mail do cliente");
        String originalEmail = client.getEmail();
        mockMvc.perform(put("/api/clients/" + client.getId())
                .header("Authorization", bearer(token("ADMIN"))).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateBody(client.getName(),
                    roleUsers.get("USER").getEmail(), null, null, true))))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").isNotEmpty());

        mockMvc.perform(put("/api/clients/" + client.getId())
                .header("Authorization", bearer(token("ADMIN"))).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateBody("Nome mantido", originalEmail,
                    null, null, true))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.email").value(originalEmail));
    }

    @Test
    void editReturnsNotFoundForMissingIdAndNonClientUser() throws Exception {
        String requestBody = objectMapper.writeValueAsString(updateBody("Nome", uniqueEmail(), null, null, true));
        mockMvc.perform(put("/api/clients/99999999").header("Authorization", bearer(token("ADMIN")))
                .contentType(MediaType.APPLICATION_JSON).content(requestBody))
            .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/clients/" + roleUsers.get("USER").getId())
                .header("Authorization", bearer(token("ADMIN"))).contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isNotFound());
    }

    @Test
    void editAndDeleteAreForbiddenForUserAndClient() throws Exception {
        User client = newClient("Sem permissão");
        String requestBody = objectMapper.writeValueAsString(updateBody(client.getName(), client.getEmail(),
            null, null, true));
        for (String role : new String[] {"USER", "CLIENTE"}) {
            mockMvc.perform(put("/api/clients/" + client.getId()).header("Authorization", bearer(token(role)))
                    .contentType(MediaType.APPLICATION_JSON).content(requestBody))
                .andExpect(status().isForbidden());
            mockMvc.perform(delete("/api/clients/" + client.getId())
                    .header("Authorization", bearer(token(role))))
                .andExpect(status().isForbidden());
        }
        org.junit.jupiter.api.Assertions.assertTrue(users.findById(client.getId()).isPresent());
    }

    @Test
    void deleteRemovesClientAndItsPasswordResetTokensWhenThereAreNoPurchases() throws Exception {
        User client = newClient("Pode excluir");
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(client);
        resetToken.setTokenHash(UUID.randomUUID().toString().replace("-", "")
            + UUID.randomUUID().toString().replace("-", ""));
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(20));
        resetTokens.save(resetToken);

        mockMvc.perform(delete("/api/clients/" + client.getId())
                .header("Authorization", bearer(token("ADMIN"))))
            .andExpect(status().isNoContent());

        org.junit.jupiter.api.Assertions.assertTrue(users.findById(client.getId()).isEmpty());
        org.junit.jupiter.api.Assertions.assertTrue(resetTokens.findAllByUserIdAndUsedAtIsNull(client.getId()).isEmpty());
    }

    @Test
    void deleteIsRejectedWhenClientHasPurchases() throws Exception {
        User client = newClient("Com compras");
        ClientPurchase purchase = new ClientPurchase();
        purchase.setOrderNumber("TEST-" + UUID.randomUUID());
        purchase.setClient(client);
        purchase.setTotal(new BigDecimal("15.00"));
        purchase.setPaymentMethod("PIX");
        purchase.setPaymentStatus("SIMULATED_PAID");
        purchases.save(purchase);

        mockMvc.perform(delete("/api/clients/" + client.getId())
                .header("Authorization", bearer(token("ADMIN"))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value(
                "Este cliente possui compras e não pode ser excluído. Marque como Inativo."));
        org.junit.jupiter.api.Assertions.assertTrue(users.findById(client.getId()).isPresent());
    }

    @Test
    void deleteIsRejectedWhenClientHasProfilePhotoOrSupplierOffers() throws Exception {
        User withPhoto = newClient("Com foto");
        withPhoto.setPhotoPath("foto-cliente.png");
        users.save(withPhoto);
        mockMvc.perform(delete("/api/clients/" + withPhoto.getId())
                .header("Authorization", bearer(token("ADMIN"))))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.message").isNotEmpty());

        User withOffer = newClient("Com oferta");
        SupplierOffer offer = new SupplierOffer();
        offer.setSupplier(withOffer);
        offer.setSku("SKU-" + UUID.randomUUID());
        offer.setName("Oferta vinculada");
        offer.setCategory("Teste");
        offer.setPrice(new BigDecimal("10.00"));
        offer.setAvailableQuantity(1);
        supplierOffers.save(offer);
        mockMvc.perform(delete("/api/clients/" + withOffer.getId())
                .header("Authorization", bearer(token("ADMIN"))))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void editingClientToInactivePreventsLogin() throws Exception {
        User client = newClient("Será inativo");
        mockMvc.perform(put("/api/clients/" + client.getId())
                .header("Authorization", bearer(token("ADMIN"))).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateBody(client.getName(), client.getEmail(),
                    client.getPhone(), null, false))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.active").value(false));
        assertLogin(client.getEmail(), "senha-inicial", 400);
    }

    private void assertInvalid(Object body, String responsePath) throws Exception {
        mockMvc.perform(post("/api/clients").header("Authorization", bearer(token("ADMIN")))
                .contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath(responsePath).isNotEmpty());
    }

    private static Map<String, Object> clientBody(String name, String email, String phone,
            String password, boolean active) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", name);
        body.put("email", email);
        body.put("phone", phone);
        body.put("password", password);
        body.put("active", active);
        return body;
    }

    private static Map<String, Object> updateBody(String name, String email, String phone,
            String password, boolean active) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", name);
        body.put("email", email);
        body.put("phone", phone);
        body.put("password", password);
        body.put("active", active);
        return body;
    }

    private User newClient(String name) {
        User client = new User();
        client.setName(name);
        client.setEmail(uniqueEmail());
        client.setPassword(passwordEncoder.encode("senha-inicial"));
        client.setRole("CLIENTE");
        client.setActive(true);
        return users.save(client);
    }

    private void assertLogin(String email, String password, int expectedStatus) throws Exception {
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("email", email, "password", password))))
            .andExpect(status().is(expectedStatus));
    }

    private static String uniqueEmail() {
        return "client-" + UUID.randomUUID() + "@stockpass.test";
    }

    private String token(String role) {
        return jwt.generate(roleUsers.get(role).getEmail());
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }
}
