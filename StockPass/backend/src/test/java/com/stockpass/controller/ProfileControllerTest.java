package com.stockpass.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockpass.model.User;
import com.stockpass.repository.UserRepository;
import com.stockpass.security.JwtService;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
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
class ProfileControllerTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository users;
    @Autowired private JwtService jwt;

    private User user;
    private User supplier;

    @BeforeEach
    void createUsers() {
        String suffix = UUID.randomUUID().toString();
        user = createUser("user-" + suffix + "@stockpass.test", "USER");
        supplier = createUser("supplier-" + suffix + "@stockpass.test", "FORNECEDOR");
        supplier.setCompanyName("Empresa original");
        supplier.setTaxId("12345678000190");
        supplier.setPhone("11999990000");
        supplier = users.save(supplier);
    }

    @Test
    void profileUpdateChangesNameAndIgnoresSubmittedEmail() throws Exception {
        mockMvc.perform(put("/api/auth/profile")
                .header("Authorization", bearer(jwt.generate(user.getEmail())))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Nome atualizado\",\"email\":\"intruso@stockpass.test\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Nome atualizado"))
            .andExpect(jsonPath("$.email").value(user.getEmail()));

        User persisted = users.findById(user.getId()).orElseThrow();
        assertEquals("Nome atualizado", persisted.getName());
        assertEquals(user.getEmail(), persisted.getEmail());
    }

    @Test
    void supplierCanStillUpdateCompanyTaxIdAndPhoneAlongWithName() throws Exception {
        String request = objectMapper.writeValueAsString(new ProfileUpdateBody(
            "Fornecedor atualizado", "Outra empresa", "98765432000110", "11988887777"));

        mockMvc.perform(put("/api/auth/profile")
                .header("Authorization", bearer(jwt.generate(supplier.getEmail())))
                .contentType(MediaType.APPLICATION_JSON).content(request))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Fornecedor atualizado"))
            .andExpect(jsonPath("$.email").value(supplier.getEmail()))
            .andExpect(jsonPath("$.companyName").value("Outra empresa"))
            .andExpect(jsonPath("$.taxId").value("98765432000110"))
            .andExpect(jsonPath("$.phone").value("11988887777"));

        User persisted = users.findById(supplier.getId()).orElseThrow();
        assertEquals("Fornecedor atualizado", persisted.getName());
        assertEquals(supplier.getEmail(), persisted.getEmail());
        assertEquals("Outra empresa", persisted.getCompanyName());
        assertEquals("98765432000110", persisted.getTaxId());
        assertEquals("11988887777", persisted.getPhone());
    }

    private User createUser(String email, String role) {
        User created = new User();
        created.setName("Nome original");
        created.setEmail(email);
        created.setPassword("encoded-password");
        created.setRole(role);
        return users.save(created);
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }

    private record ProfileUpdateBody(String name, String companyName, String taxId, String phone) {}
}
