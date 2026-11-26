package com.stockpass.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockpass.dto.StockDtos.CategoryRequest;
import com.stockpass.service.CategoryService;
import com.stockpass.security.JwtService;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class InputValidationIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JwtService jwt;
    @Autowired private CategoryService categories;

    @Test
    void publicRegistrationRejectsEmptyFieldsInvalidEmailAndOverlongName() throws Exception {
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsBytes(Map.of())))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").exists());

        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsBytes(Map.of(
                    "name", "Pessoa", "email", "email-invalido", "password", "senha-valida"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Informe um e-mail válido com até 254 caracteres."));

        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsBytes(Map.of(
                    "name", "N".repeat(121), "email", "long-name-" + UUID.randomUUID() + "@stockpass.test",
                    "password", "senha-valida"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Informe um nome com até 120 caracteres."));
    }

    @Test
    void validRegistrationAndProductPayloadsAreAccepted() throws Exception {
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsBytes(Map.of(
                    "name", "Usuário válido", "email", "valid-" + UUID.randomUUID() + "@stockpass.test",
                    "password", "senha-valida"))))
            .andExpect(status().isCreated());

        Long categoryId = categories.create(new CategoryRequest("Validação " + UUID.randomUUID(), null)).id();
        mockMvc.perform(post("/api/products").header("Authorization", adminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsBytes(Map.of(
                    "sku", "VALID-" + UUID.randomUUID(), "name", "Produto válido", "categoryId", categoryId,
                    "initialQuantity", 0, "price", new BigDecimal("12.50"), "supplier", "Fornecedor válido",
                    "reorderPoint", 0))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    void internalUserEndpointValidatesRequiredFieldsAndNameLength() throws Exception {
        String token = adminToken();
        mockMvc.perform(post("/api/users").header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsBytes(Map.of())))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").exists());

        mockMvc.perform(post("/api/users").header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsBytes(Map.of(
                    "name", "U".repeat(121), "email", "long-internal-" + UUID.randomUUID() + "@stockpass.test",
                    "role", "USER", "password", "senha-valida"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Informe um nome com até 120 caracteres."));

        mockMvc.perform(post("/api/users").header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsBytes(Map.of(
                    "name", "Funcionário válido", "email", "internal-" + UUID.randomUUID() + "@stockpass.test",
                    "role", "USER", "password", "senha-valida"))))
            .andExpect(status().isCreated());
    }

    @Test
    void productAndMovementEndpointsRejectNegativeOrNonIntegerQuantities() throws Exception {
        Long categoryId = categories.create(new CategoryRequest("Quantidades " + UUID.randomUUID(), null)).id();
        mockMvc.perform(post("/api/products").header("Authorization", adminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsBytes(Map.of(
                    "sku", "NEG-" + UUID.randomUUID(), "name", "Produto", "categoryId", categoryId,
                    "initialQuantity", -1, "price", "2.00", "supplier", "Fornecedor", "reorderPoint", 0))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Informe uma quantidade inteira igual ou maior que zero."));

        mockMvc.perform(post("/api/products").header("Authorization", adminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsBytes(Map.of(
                    "sku", "PRICE-" + UUID.randomUUID(), "name", "Produto", "categoryId", categoryId,
                    "initialQuantity", 1, "price", new BigDecimal("-0.01"), "supplier", "Fornecedor", "reorderPoint", 0))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Informe um valor não negativo com no máximo duas casas decimais."));

        mockMvc.perform(post("/api/products").header("Authorization", adminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsBytes(Map.of(
                    "sku", "LONG-" + UUID.randomUUID(), "name", "P".repeat(151), "categoryId", categoryId,
                    "initialQuantity", 1, "price", new BigDecimal("2.00"), "supplier", "Fornecedor", "reorderPoint", 0))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Informe um nome com até 150 caracteres."));

        mockMvc.perform(post("/api/entries").header("Authorization", adminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":1,\"quantity\":1.5}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value(
                "Os dados enviados estão em formato inválido. Confira os tipos e valores dos campos."));

        mockMvc.perform(post("/api/exits").header("Authorization", adminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsBytes(Map.of(
                    "productId", 1, "quantity", 0, "reason", "Venda"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("A quantidade deve ser um número inteiro maior que zero."));
    }

    private String adminToken() { return "Bearer " + jwt.generate("admin@stockpass.com"); }
}
