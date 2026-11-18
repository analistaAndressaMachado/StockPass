package com.stockpass.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockpass.dto.SupplierManagementDtos.ContractRequest;
import com.stockpass.dto.SupplierManagementDtos.SupplierRequest;
import com.stockpass.model.SupplierContractStatus;
import com.stockpass.model.SupplierStatus;
import com.stockpass.model.User;
import com.stockpass.repository.SupplierContractRepository;
import com.stockpass.repository.SupplierRepository;
import com.stockpass.repository.UserActivityRepository;
import com.stockpass.repository.UserRepository;
import com.stockpass.security.JwtService;
import com.stockpass.service.SupplierManagementService;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SupplierManagementControllerTest {
    private static final String[] ROLES = {"USER", "GESTOR", "ADMIN", "FORNECEDOR", "CLIENTE"};

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwt;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository users;
    @Autowired private SupplierRepository suppliers;
    @Autowired private SupplierContractRepository contracts;
    @Autowired private UserActivityRepository activities;
    @Autowired private SupplierManagementService service;

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
            if ("FORNECEDOR".equals(role)) user.setCompanyName("Empresa fornecedora");
            roleUsers.put(role, users.save(user));
        }
    }

    @Test
    void getRoutesAllowInternalProfilesAndDenySupplierAndClient() throws Exception {
        var supplier = createSupplier("Leitura");
        var contract = createContract(supplier.id(), "GET-" + UUID.randomUUID(), LocalDate.now().plusDays(15));

        for (String role : ROLES) {
            int expected = isInternalReader(role) ? 200 : 403;
            String token = token(role);
            mockMvc.perform(get("/api/suppliers/records").header("Authorization", bearer(token)))
                .andExpect(status().is(expected));
            mockMvc.perform(get("/api/suppliers/records/" + supplier.id()).header("Authorization", bearer(token)))
                .andExpect(status().is(expected));
            mockMvc.perform(get("/api/suppliers/records/" + supplier.id() + "/contracts")
                    .header("Authorization", bearer(token)))
                .andExpect(status().is(expected));
            mockMvc.perform(get("/api/suppliers/contracts/expiring").header("Authorization", bearer(token)))
                .andExpect(status().is(expected));
        }
        assertTrue(contracts.findById(contract.id()).isPresent());
    }

    @Test
    void postAndPutRoutesAllowOnlyManagersAndAdminsAndDeniedRequestsDoNotChangeData() throws Exception {
        var supplier = createSupplier("Original");
        var contract = createContract(supplier.id(), "EDIT-" + UUID.randomUUID(), LocalDate.now().plusDays(20));

        for (String role : ROLES) {
            boolean allowed = isWriter(role);
            String token = token(role);
            String supplierNameBefore = suppliers.findById(supplier.id()).orElseThrow().getLegalName();
            String contractNumberBefore = contracts.findById(contract.id()).orElseThrow().getContractNumber();
            long supplierCountBefore = suppliers.count();
            long contractCountBefore = contracts.count();
            String newSupplierBody = objectMapper.writeValueAsString(supplierBody("Criado " + role));
            ResultActions supplierPost = mockMvc.perform(post("/api/suppliers/records")
                .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON).content(newSupplierBody));
            supplierPost.andExpect(status().is(allowed ? 201 : 403));

            String supplierUpdateBody = objectMapper.writeValueAsString(supplierBody("Editado " + role));
            mockMvc.perform(put("/api/suppliers/records/" + supplier.id())
                    .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                    .content(supplierUpdateBody))
                .andExpect(status().is(allowed ? 200 : 403));

            String contractBody = objectMapper.writeValueAsString(contractBody(
                "Novo contrato " + role, LocalDate.now().plusDays(10)));
            mockMvc.perform(post("/api/suppliers/records/" + supplier.id() + "/contracts")
                    .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                    .content(contractBody))
                .andExpect(status().is(allowed ? 201 : 403));

            mockMvc.perform(put("/api/suppliers/records/" + supplier.id() + "/contracts/" + contract.id())
                    .header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(contractBody("Atualizado " + role,
                        LocalDate.now().plusDays(20)))))
                .andExpect(status().is(allowed ? 200 : 403));

            if (allowed) {
                assertEquals("Editado " + role, suppliers.findById(supplier.id()).orElseThrow().getLegalName());
                assertEquals("Atualizado " + role,
                    contracts.findById(contract.id()).orElseThrow().getContractNumber());
            } else {
                assertEquals(supplierNameBefore, suppliers.findById(supplier.id()).orElseThrow().getLegalName());
                assertEquals(contractNumberBefore,
                    contracts.findById(contract.id()).orElseThrow().getContractNumber());
                assertEquals(supplierCountBefore, suppliers.count());
                assertEquals(contractCountBefore, contracts.count());
            }
        }
    }

    @Test
    void deleteIsForbiddenForEveryRoleIncludingAdmin() throws Exception {
        var supplier = createSupplier("Sem exclusão");
        for (String role : ROLES) {
            mockMvc.perform(delete("/api/suppliers/records/" + supplier.id())
                    .header("Authorization", bearer(token(role))))
                .andExpect(status().isForbidden());
        }
        assertTrue(suppliers.findById(supplier.id()).isPresent());
    }

    @Test
    void unauthenticatedRequestReturnsForbidden() throws Exception {
        // The stateless JWT setup has no authentication entry point configured; Spring Security's default is 403.
        mockMvc.perform(get("/api/suppliers/records")).andExpect(status().isForbidden());
    }

    @Test
    void returnsNotFoundAndBadRequestForInvalidInputs() throws Exception {
        String adminToken = token("ADMIN");
        mockMvc.perform(get("/api/suppliers/records/-999").header("Authorization", bearer(adminToken)))
            .andExpect(status().isNotFound()).andExpect(jsonPath("$.message").exists());
        mockMvc.perform(get("/api/suppliers/records/-999/contracts").header("Authorization", bearer(adminToken)))
            .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/suppliers/records/-999")
                .header("Authorization", bearer(adminToken)).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(supplierBody("Ausente"))))
            .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/suppliers/records").header("Authorization", bearer(adminToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"legalName\":\"\",\"cnpj\":\"12345678000190\",\"email\":\"a@b.test\",\"status\":\"ACTIVE\"}"))
            .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/suppliers/contracts/expiring?days=-1")
                .header("Authorization", bearer(adminToken))).andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/suppliers/contracts/expiring?days=366")
                .header("Authorization", bearer(adminToken))).andExpect(status().isBadRequest());
    }

    @Test
    void omittedDaysUsesThirtyDayDefault() throws Exception {
        var supplier = createSupplier("Janela padrão");
        var twentyDayContract = createContract(supplier.id(), "VENCE-20-" + UUID.randomUUID(),
            LocalDate.now().plusDays(20));
        createContract(supplier.id(), "VENCE-40-" + UUID.randomUUID(), LocalDate.now().plusDays(40));

        mockMvc.perform(get("/api/suppliers/contracts/expiring").header("Authorization", bearer(token("USER"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].id").value(org.hamcrest.Matchers.hasItem(twentyDayContract.id().intValue())))
            .andExpect(jsonPath("$[*].contractNumber").value(org.hamcrest.Matchers.hasItem(twentyDayContract.contractNumber())))
            .andExpect(jsonPath("$[*].contractNumber").value(org.hamcrest.Matchers.not(
                org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.startsWith("VENCE-40-")))));
    }

    @Test
    void activityRecordsActorResolvedFromPrincipalEmail() throws Exception {
        User manager = roleUsers.get("GESTOR");
        String auth = bearer(token("GESTOR"));
        String body = objectMapper.writeValueAsString(supplierBody("Auditoria HTTP"));
        var createdSupplierResult = mockMvc.perform(post("/api/suppliers/records").header("Authorization", auth)
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated()).andReturn();
        Long supplierId = objectMapper.readTree(createdSupplierResult.getResponse().getContentAsString())
            .get("id").asLong();
        var createdContractResult = mockMvc.perform(post("/api/suppliers/records/" + supplierId + "/contracts")
                .header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(contractBody("AUD-CREATED", LocalDate.now().plusDays(30)))))
            .andExpect(status().isCreated()).andReturn();
        Long contractId = objectMapper.readTree(createdContractResult.getResponse().getContentAsString())
            .get("id").asLong();
        mockMvc.perform(put("/api/suppliers/records/" + supplierId).header("Authorization", auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(supplierBody("Auditoria editada"))))
            .andExpect(status().isOk());
        mockMvc.perform(put("/api/suppliers/records/" + supplierId + "/contracts/" + contractId)
                .header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(contractBody("AUD-UPDATED", LocalDate.now().plusDays(35)))))
            .andExpect(status().isOk());

        var recordedActivities = activities.findAllByOrderByCreatedAtDescIdDesc();
        assertEquals(manager.getName(), recordedActivities.stream()
            .filter(activity -> activity.getAction().contains("Criou o fornecedor Auditoria HTTP"))
            .findFirst().orElseThrow().getActor());
        assertEquals(manager.getName(), recordedActivities.stream()
            .filter(activity -> activity.getAction().contains("Editou o fornecedor Auditoria editada"))
            .findFirst().orElseThrow().getActor());
        assertEquals(manager.getName(), recordedActivities.stream()
            .filter(activity -> activity.getAction().contains("Criou o contrato AUD-CREATED"))
            .findFirst().orElseThrow().getActor());
        assertEquals(manager.getName(), recordedActivities.stream()
            .filter(activity -> activity.getAction().contains("Editou o contrato AUD-UPDATED"))
            .findFirst().orElseThrow().getActor());
    }

    @Test
    void supplierProfileAndUserMarketplacePermissionsRemainAvailable() throws Exception {
        mockMvc.perform(get("/api/suppliers/me").header("Authorization", bearer(token("FORNECEDOR"))))
            .andExpect(status().isOk());
        mockMvc.perform(get("/api/suppliers/offers").header("Authorization", bearer(token("USER"))))
            .andExpect(status().isOk());
    }

    private com.stockpass.dto.SupplierManagementDtos.SupplierResponse createSupplier(String name) {
        String digits = ("12345678" + UUID.randomUUID().toString().replaceAll("\\D", "") + "000190")
            .substring(0, 14);
        return service.createSupplier(supplierBody(name, digits), roleUsers.get("ADMIN").getEmail());
    }

    private com.stockpass.dto.SupplierManagementDtos.ContractResponse createContract(Long supplierId, String number,
            LocalDate endDate) {
        return service.createContract(supplierId, contractBody(number, endDate), roleUsers.get("ADMIN").getEmail());
    }

    private SupplierRequest supplierBody(String name) {
        String digits = ("12345678" + UUID.randomUUID().toString().replaceAll("\\D", "") + "000190")
            .substring(0, 14);
        return supplierBody(name, digits);
    }

    private SupplierRequest supplierBody(String name, String cnpj) {
        return new SupplierRequest(name, cnpj, "supplier@example.test", "11999990000", "Rua de teste",
            SupplierStatus.ACTIVE);
    }

    private ContractRequest contractBody(String number, LocalDate endDate) {
        return new ContractRequest(number, LocalDate.now(), endDate, null, SupplierContractStatus.CURRENT,
            "Contrato de teste");
    }

    private String token(String role) {
        return jwt.generate(roleUsers.get(role).getEmail());
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }

    private static boolean isInternalReader(String role) {
        return "USER".equals(role) || isWriter(role);
    }

    private static boolean isWriter(String role) {
        return "GESTOR".equals(role) || "ADMIN".equals(role);
    }
}
