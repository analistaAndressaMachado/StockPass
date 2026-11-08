package com.stockpass.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.stockpass.dto.AuthDtos.ProfileUpdateRequest;
import com.stockpass.dto.StockDtos.EntryRequest;
import com.stockpass.dto.StockDtos.ExitRequest;
import com.stockpass.dto.StockDtos.ProductRequest;
import com.stockpass.dto.StockDtos.ProductUpdateRequest;
import com.stockpass.dto.StockDtos.ReplenishmentRequest;
import com.stockpass.dto.StockDtos.SupplierAcquisitionRequest;
import com.stockpass.dto.StockDtos.SupplierOfferRequest;
import com.stockpass.dto.AuthDtos.SupplierRegisterRequest;
import com.stockpass.dto.AuthDtos.ClientRegisterRequest;
import com.stockpass.dto.ClientDtos.PurchaseLineRequest;
import com.stockpass.dto.ClientDtos.PurchaseRequest;
import com.stockpass.model.ReplenishmentStatus;
import com.stockpass.model.User;
import com.stockpass.repository.ProductRepository;
import com.stockpass.repository.StockMovementRepository;
import com.stockpass.repository.StockReplenishmentRepository;
import com.stockpass.repository.SupplierOfferRepository;
import com.stockpass.repository.SupplierPurchaseRepository;
import com.stockpass.repository.UserRepository;
import com.stockpass.security.JwtService;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class StockPersistenceIntegrationTest {
    @Autowired private ProductService productService;
    @Autowired private StockMovementService movementService;
    @Autowired private StockReplenishmentService replenishmentService;
    @Autowired private SupplierOfferService supplierOfferService;
    @Autowired private AuthService authService;
    @Autowired private ClientStoreService clientStoreService;
    @Autowired private ProductRepository products;
    @Autowired private StockMovementRepository movements;
    @Autowired private StockReplenishmentRepository replenishments;
    @Autowired private SupplierOfferRepository offers;
    @Autowired private SupplierPurchaseRepository purchases;
    @Autowired private UserRepository users;
    @Autowired private JwtService jwt;
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @Test
    void productAndMovementsPersistAsOneStockFlow() {
        String sku = "TEST-" + UUID.randomUUID();
        var product = productService.create(
            new ProductRequest(sku, "Produto de integração", "Testes", 10,
                new BigDecimal("12.50"), "Fornecedor teste", 3),
            "admin@stockpass.com");

        movementService.entry(new EntryRequest(product.id(), 5, "NF-TEST", null), "admin@stockpass.com");
        movementService.exit(new ExitRequest(product.id(), 3, "Venda", "Pedido de teste"), "admin@stockpass.com");

        assertEquals(12, products.findById(product.id()).orElseThrow().getQuantity());
        assertTrue(movementService.list(com.stockpass.model.MovementType.ENTRY).stream()
            .anyMatch(movement -> movement.sku().equals(sku)));
        assertTrue(movementService.list(com.stockpass.model.MovementType.EXIT).stream()
            .anyMatch(movement -> movement.sku().equals(sku)));
    }

    @Test
    void scheduledReplenishmentIsCompletedByLinkedEntry() {
        String sku = "RESTOCK-" + UUID.randomUUID();
        var product = productService.create(
            new ProductRequest(sku, "Produto para reposição", "Testes", 2,
                new BigDecimal("8.00"), "Fornecedor teste", 5),
            "admin@stockpass.com");
        var scheduled = replenishmentService.schedule(
            new ReplenishmentRequest(product.id(), 3), "admin@stockpass.com");

        assertEquals(ReplenishmentStatus.SCHEDULED, scheduled.status());

        movementService.entry(new EntryRequest(product.id(), 3, "NF-RESTOCK", scheduled.id()),
            "admin@stockpass.com");

        assertEquals(ReplenishmentStatus.COMPLETED,
            replenishments.findById(scheduled.id()).orElseThrow().getStatus());
        assertEquals(5, products.findById(product.id()).orElseThrow().getQuantity());
    }

    @Test
    void supplierCanOnlyManageOwnOffersAndAcquisitionAddsAuditedStock() {
        String suffix = UUID.randomUUID().toString();
        User supplier = new User();
        supplier.setName("Contato fornecedor");
        supplier.setEmail("supplier-" + suffix + "@stockpass.test");
        supplier.setPassword("encoded-password");
        supplier.setRole("FORNECEDOR");
        supplier.setCompanyName("Distribuidora Teste");
        users.save(supplier);

        User otherSupplier = new User();
        otherSupplier.setName("Outro fornecedor");
        otherSupplier.setEmail("other-" + suffix + "@stockpass.test");
        otherSupplier.setPassword("encoded-password");
        otherSupplier.setRole("FORNECEDOR");
        otherSupplier.setCompanyName("Outra Distribuidora");
        users.save(otherSupplier);

        var offer = supplierOfferService.createOffer(supplier.getEmail(),
            new SupplierOfferRequest("SUPSKU-" + suffix, "Produto do fornecedor", "Acessórios",
                new BigDecimal("14.25"), 20));

        assertThrows(IllegalArgumentException.class, () -> supplierOfferService.updateOffer(
            otherSupplier.getEmail(), offer.id(),
            new SupplierOfferRequest("TENTATIVA", "Alteração não autorizada", "Acessórios",
                new BigDecimal("1.00"), 1)));

        var acquisition = supplierOfferService.acquire(offer.id(),
            new SupplierAcquisitionRequest(4), "admin@stockpass.com");

        assertEquals(4, acquisition.quantity());
        assertEquals(new BigDecimal("57.00"), acquisition.totalPrice());
        assertEquals(4, products.findById(acquisition.productId()).orElseThrow().getQuantity());
        assertEquals(16, offers.findById(offer.id()).orElseThrow().getAvailableQuantity());
        var supplierSales = supplierOfferService.salesHistory(supplier.getEmail());
        assertEquals(1, supplierSales.size());
        assertEquals(4, supplierSales.get(0).quantity());
        assertTrue(movements.findAll().stream().anyMatch(movement ->
            movement.getProduct().getId().equals(acquisition.productId()) &&
            "Compra de fornecedor".equals(movement.getReason())));
        assertTrue(purchases.findById(acquisition.purchaseId()).isPresent());
    }

    @Test
    void supplierRoleCannotReadInternalStockEndpoints() throws Exception {
        String email = "role-supplier-" + UUID.randomUUID() + "@stockpass.test";
        User supplier = new User();
        supplier.setName("Fornecedor de teste");
        supplier.setEmail(email);
        supplier.setPassword("encoded-password");
        supplier.setRole("FORNECEDOR");
        supplier.setCompanyName("Empresa de teste");
        users.save(supplier);

        mockMvc.perform(get("/api/products").header("Authorization", "Bearer " + jwt.generate(email)))
            .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/suppliers/offers/mine").header("Authorization", "Bearer " + jwt.generate(email)))
            .andExpect(status().isOk());
        mockMvc.perform(get("/api/suppliers/purchases/mine").header("Authorization", "Bearer " + jwt.generate(email)))
            .andExpect(status().isOk());
        mockMvc.perform(get("/api/products").header("Authorization", "Bearer " + jwt.generate("admin@stockpass.com")))
            .andExpect(status().isOk());
    }

    @Test
    void supplierRegistrationAlwaysCreatesSupplierRole() {
        String email = "registered-supplier-" + UUID.randomUUID() + "@stockpass.test";
        var registered = authService.registerSupplier(new SupplierRegisterRequest(
            "Contato", email, "senha-segura", "Empresa cadastrada", "12.345.678/0001-90", "(11) 99999-0000"));

        assertEquals("FORNECEDOR", registered.role());
        User supplier = users.findByEmailIgnoreCase(email).orElseThrow();
        assertEquals("Empresa cadastrada", supplier.getCompanyName());
    }

    @Test
    void clientDemoCheckoutRecordsPaymentAndStockExit() {
        String suffix = UUID.randomUUID().toString();
        var client = authService.registerClient(new ClientRegisterRequest(
            "Cliente teste", "client-" + suffix + "@stockpass.test", "senha-cliente"));
        var anotherClient = authService.registerClient(new ClientRegisterRequest(
            "Outro cliente", "client-other-" + suffix + "@stockpass.test", "senha-cliente"));
        var product = productService.create(
            new ProductRequest("CLIENT-" + suffix, "Produto da loja", "Teste", 8,
                new BigDecimal("10.00"), "Fornecedor teste", 0),
            "admin@stockpass.com");

        var purchase = clientStoreService.purchase(
            new PurchaseRequest("PIX", java.util.List.of(new PurchaseLineRequest(product.id(), 3))),
            client.email());

        assertEquals("SIMULATED_PAID", purchase.paymentStatus());
        assertEquals(new BigDecimal("30.00"), purchase.total());
        assertEquals(5, products.findById(product.id()).orElseThrow().getQuantity());
        assertEquals(1, clientStoreService.purchases(client.email()).size());
        assertEquals(0, clientStoreService.purchases(anotherClient.email()).size());
        assertTrue(movements.findAll().stream().anyMatch(movement ->
            movement.getProduct().getId().equals(product.id()) &&
            "Venda".equals(movement.getReason()) &&
            movement.getRegisteredBy().equals(client.name())));
    }

    @Test
    void internalStaffCanReadClientRegistrationsAndPurchasesButClientsCannot() throws Exception {
        String suffix = UUID.randomUUID().toString();
        var client = authService.registerClient(new ClientRegisterRequest("Cliente com compra", "buyer-" + suffix + "@stockpass.test", "senha-cliente"));
        var emptyClient = authService.registerClient(new ClientRegisterRequest("Cliente sem compra", "empty-" + suffix + "@stockpass.test", "senha-cliente"));
        var product = productService.create(new ProductRequest("ADMIN-" + suffix, "Produto comprado", "Teste", 5,
            new BigDecimal("10.00"), "Fornecedor teste", 0), "admin@stockpass.com");
        clientStoreService.purchase(new PurchaseRequest("PIX", java.util.List.of(new PurchaseLineRequest(product.id(), 2))), client.email());
        String staffToken = jwt.generate("admin@stockpass.com");
        String clientToken = jwt.generate(client.email());
        User staff = new User();
        staff.setName("Equipe teste");
        staff.setEmail("staff-" + suffix + "@stockpass.test");
        staff.setPassword("encoded-password");
        staff.setRole("USER");
        users.save(staff);
        User manager = new User();
        manager.setName("Gestor teste");
        manager.setEmail("manager-" + suffix + "@stockpass.test");
        manager.setPassword("encoded-password");
        manager.setRole("GESTOR");
        users.save(manager);
        User supplier = new User();
        supplier.setName("Fornecedor teste");
        supplier.setEmail("supplier-view-" + suffix + "@stockpass.test");
        supplier.setPassword("encoded-password");
        supplier.setRole("FORNECEDOR");
        users.save(supplier);

        assertTrue(clientStoreService.clients().stream().anyMatch(item -> item.id().equals(emptyClient.id())));
        var clientsResponse = mockMvc.perform(get("/api/clients").header("Authorization", "Bearer " + staffToken))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertTrue(objectMapper.readTree(clientsResponse).findValuesAsText("email").contains(emptyClient.email()));
        assertTrue(objectMapper.readTree(clientsResponse).findValues("password").isEmpty());
        mockMvc.perform(get("/api/clients").header("Authorization", "Bearer " + jwt.generate(staff.getEmail()))).andExpect(status().isOk());
        mockMvc.perform(get("/api/clients").header("Authorization", "Bearer " + jwt.generate(manager.getEmail()))).andExpect(status().isOk());
        mockMvc.perform(get("/api/clients/" + client.id() + "/purchases").header("Authorization", "Bearer " + staffToken))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].items[0].product").value("Produto comprado"))
            .andExpect(jsonPath("$[0].items[0].quantity").value(2));
        mockMvc.perform(get("/api/clients/" + emptyClient.id() + "/purchases").header("Authorization", "Bearer " + staffToken))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get("/api/clients").header("Authorization", "Bearer " + clientToken)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/clients/" + client.id() + "/purchases").header("Authorization", "Bearer " + clientToken)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/clients").header("Authorization", "Bearer " + jwt.generate(supplier.getEmail()))).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/clients")).andExpect(status().isForbidden());
    }

    @Test
    void clientRoleCanAccessStoreButNotInternalCatalog() throws Exception {
        String email = "role-client-" + UUID.randomUUID() + "@stockpass.test";
        authService.registerClient(new ClientRegisterRequest("Cliente HTTP", email, "senha-cliente"));
        String token = jwt.generate(email);

        mockMvc.perform(get("/api/store/products").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk());
        mockMvc.perform(get("/api/store/purchases").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk());
        mockMvc.perform(get("/api/products").header("Authorization", "Bearer " + token))
            .andExpect(status().isForbidden());
    }

    @Test
    void clientAndSupplierRegistrationEndpointsAcceptValidForms() throws Exception {
        String suffix = UUID.randomUUID().toString();
        mockMvc.perform(post("/api/auth/register-client")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsBytes(java.util.Map.of(
                    "name", "Cliente HTTP", "email", "client-http-" + suffix + "@stockpass.test",
                    "password", "senha-cliente-123"))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.role").value("CLIENTE"));

        mockMvc.perform(post("/api/auth/register-supplier")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsBytes(java.util.Map.of(
                    "name", "Responsável HTTP", "email", "supplier-http-" + suffix + "@stockpass.test",
                    "password", "senha-fornecedor-123", "companyName", "Fornecedor HTTP"))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.role").value("FORNECEDOR"));
    }

    @Test
    void shortPasswordReturnsReadableClientRegistrationValidation() throws Exception {
        mockMvc.perform(post("/api/auth/register-client")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsBytes(java.util.Map.of(
                    "name", "Cliente HTTP", "email", "short-password@stockpass.test", "password", "123"))))
            .andExpect(status().isBadRequest());
    }

    @Test
    void clientCanUpdateOwnNameAndEmailWithoutChangingRole() {
        String oldEmail = "profile-client-" + UUID.randomUUID() + "@stockpass.test";
        var client = authService.registerClient(new ClientRegisterRequest("Cliente antigo", oldEmail, "senha-cliente"));

        var updated = authService.updateProfile(oldEmail,
            new ProfileUpdateRequest("Cliente atualizado", "cliente-atualizado-" + UUID.randomUUID() + "@stockpass.test",
                "Empresa não permitida", "CNPJ não permitido", "Telefone não permitido"));

        assertEquals("Cliente atualizado", updated.name());
        assertEquals("CLIENTE", updated.role());
        User persisted = users.findById(client.id()).orElseThrow();
        assertEquals(updated.email(), persisted.getEmail());
        assertNull(persisted.getCompanyName());
    }

    @Test
    void supplierCanUpdateBusinessProfileAndProductDetailsWithoutChangingStock() {
        String suffix = UUID.randomUUID().toString();
        var supplier = authService.registerSupplier(new SupplierRegisterRequest(
            "Contato", "profile-supplier-" + suffix + "@stockpass.test", "senha-fornecedor",
            "Empresa antiga", null, null));
        var updatedSupplier = authService.updateProfile(supplier.email(),
            new ProfileUpdateRequest("Contato atualizado", "profile-supplier-updated-" + suffix + "@stockpass.test",
                "Empresa nova", "12.345.678/0001-90", "11999990000"));
        assertEquals("Empresa nova", updatedSupplier.companyName());
        assertEquals("FORNECEDOR", updatedSupplier.role());

        var product = productService.create(
            new ProductRequest("EDIT-" + suffix, "Produto editável", "Geral", 7,
                new BigDecimal("20.00"), "Fornecedor antigo", 2),
            "admin@stockpass.com");
        var updatedProduct = productService.update(product.id(), new ProductUpdateRequest(
            "SKU-EDIT-" + suffix, "Nome editado", "Categoria editada", new BigDecimal("25.50"),
            "Fornecedor novo", 4));

        assertEquals("SKU-EDIT-" + suffix, updatedProduct.sku());
        assertEquals("Nome editado", updatedProduct.name());
        assertEquals("Fornecedor novo", updatedProduct.supplier());
        assertEquals(4, updatedProduct.reorderPoint());
        assertEquals(7, products.findById(product.id()).orElseThrow().getQuantity());
    }
}