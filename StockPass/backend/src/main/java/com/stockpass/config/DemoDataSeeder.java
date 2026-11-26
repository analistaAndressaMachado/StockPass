package com.stockpass.config;

import com.stockpass.dto.StockDtos.EntryRequest;
import com.stockpass.dto.StockDtos.ExitRequest;
import com.stockpass.dto.StockDtos.ProductRequest;
import com.stockpass.model.Category;
import com.stockpass.model.StockMovement;
import com.stockpass.model.StockReservation;
import com.stockpass.model.Supplier;
import com.stockpass.model.SupplierStatus;
import com.stockpass.model.User;
import com.stockpass.repository.CategoryRepository;
import com.stockpass.repository.ProductRepository;
import com.stockpass.repository.StockMovementRepository;
import com.stockpass.repository.StockReservationRepository;
import com.stockpass.repository.SupplierRepository;
import com.stockpass.repository.UserRepository;
import com.stockpass.service.CategoryService;
import com.stockpass.service.ProductService;
import com.stockpass.service.StockMovementService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;
import org.springframework.transaction.annotation.Transactional;

/** Optional, additive and repeatable fictional data loader for local demonstrations. */
@Component
@Profile("local")
@ConditionalOnProperty(name = "app.demo-data.enabled", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {
    private static final String DEMO_ACTOR = "demo-seed@stockpass.invalid";
    private static final System.Logger LOGGER = System.getLogger(DemoDataSeeder.class.getName());
    private static final List<String> CATEGORY_NAMES = List.of(
        "Demonstração - Eletrônicos", "Demonstração - Informática", "Demonstração - Escritório",
        "Demonstração - Acessórios", "Demonstração - Materiais");
    private static final List<String> SUPPLIER_NAMES = List.of(
        "Demonstração - Orion Distribuição", "Demonstração - Nuvem Tech",
        "Demonstração - Ponto Office", "Demonstração - Prisma Componentes",
        "Demonstração - Horizonte Suprimentos");
    private static final List<SeedProduct> PRODUCTS = List.of(
        p("Notebook empresarial 14 polegadas",0,0,"4899.90",5,12),
        p("Monitor LED 24 polegadas",0,1,"899.90",6,2),
        p("Teclado mecânico compacto",3,3,"329.90",5,18),
        p("Mouse sem fio ergonômico",3,1,"119.90",4,0),
        p("Cadeira de escritório ajustável",2,2,"1199.00",7,4),
        p("Hub USB-C com 7 portas",3,3,"249.90",5,12),
        p("SSD NVMe 1 TB",1,1,"579.90",4,9),
        p("Webcam Full HD",0,0,"289.90",5,2),
        p("Impressora laser compacta",2,2,"1099.00",3,6),
        p("Cabo HDMI 2 metros",3,3,"39.90",4,0),
        p("Headset USB com microfone",3,1,"189.90",5,11),
        p("HD externo portátil 2 TB",1,0,"699.90",5,3),
        p("Roteador Wi-Fi dual band",0,1,"379.90",4,14),
        p("Suporte articulado para notebook",2,2,"159.90",4,8),
        p("Papel sulfite A4 pacote 500 folhas",4,4,"34.90",10,30),
        p("Caneta esferográfica azul caixa",4,2,"42.00",6,0),
        p("Filtro de linha 6 tomadas",4,4,"69.90",5,15),
        p("Memória RAM DDR4 8 GB",1,3,"159.90",5,2),
        p("Scanner de mesa compacto",2,2,"789.00",3,9),
        p("Adaptador USB-C para Ethernet",3,1,"99.90",5,10),
        p("Nobreak 1200 VA",0,0,"899.00",5,5),
        p("Toner preto para impressora laser",4,4,"279.90",4,1),
        p("Etiquetas adesivas A4 pacote",4,2,"27.50",8,22),
        p("Microfone USB para conferência",0,1,"459.90",4,6),
        p("Docking station USB-C",1,3,"749.90",4,7));

    private final CategoryRepository categories;
    private final CategoryService categoryService;
    private final ProductRepository products;
    private final ProductService productService;
    private final StockMovementService movementService;
    private final StockMovementRepository movements;
    private final StockReservationRepository reservations;
    private final SupplierRepository suppliers;
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(CategoryRepository categories, CategoryService categoryService,
            ProductRepository products, ProductService productService, StockMovementService movementService,
            StockMovementRepository movements, StockReservationRepository reservations,
            SupplierRepository suppliers, UserRepository users, PasswordEncoder passwordEncoder) {
        this.categories = categories;
        this.categoryService = categoryService;
        this.products = products;
        this.productService = productService;
        this.movementService = movementService;
        this.movements = movements;
        this.reservations = reservations;
        this.suppliers = suppliers;
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        int categoryCount = seedCategories();
        int supplierCount = seedSuppliers();
        int clientCount = seedClients();
        Map<String, Long> seededProducts = new HashMap<>();
        int productCount = 0;
        int entryCount = 0;
        int exitCount = 0;
        LocalDateTime now = LocalDateTime.now();

        for (int index = 0; index < PRODUCTS.size(); index++) {
            SeedProduct seed = PRODUCTS.get(index);
            String sku = sku(index);
            if (products.findBySkuIgnoreCase(sku).isPresent()) continue;

            Category category = categories.findByNormalizedName(normalize(CATEGORY_NAMES.get(seed.categoryIndex())))
                .orElseThrow(() -> new IllegalStateException("Categoria de demonstração não encontrada."));
            if (!category.isActive()) {
                throw new IllegalStateException("A categoria " + category.getName() +
                    " está inativa; a carga preservou seu estado e não pode associar novos produtos a ela.");
            }
            productService.create(new ProductRequest(sku, seed.name(), category.getId(), 0,
                new BigDecimal(seed.price()), SUPPLIER_NAMES.get(seed.supplierIndex()), seed.reorderPoint()), DEMO_ACTOR);
            productCount++;
            int confirmationQuantity = index == 2 ? 2 : 0;
            int intendedHistoryBalance = seed.finalStock() + confirmationQuantity;
            int firstExit = 1 + index % 3;
            int secondEntry = 2 + index % 2;
            LocalDateTime base = now.minusDays(70 - index % 30L);
            long productId = products.findBySkuIgnoreCase(sku).orElseThrow().getId();
            seededProducts.put(sku, productId);

            entryCount += addEntry(productId, intendedHistoryBalance + firstExit,
                "DEMO-ENT-" + (index + 1) + "-A", DEMO_ACTOR, base);
            exitCount += addExit(productId, firstExit, "Venda", DEMO_ACTOR, base.plusDays(5));
            entryCount += addEntry(productId, secondEntry,
                "DEMO-ENT-" + (index + 1) + "-B", DEMO_ACTOR, base.plusDays(10));
            exitCount += addExit(productId, secondEntry, "Outro", DEMO_ACTOR, base.plusDays(15));
        }

        int activeReservations = 0;
        int confirmedReservations = 0;
        int cancelledReservations = 0;
        Long activeProduct = productIdFor("DEMO-2026-001", seededProducts);
        if (activeProduct != null) {
            var reservation = movementService.reserveExit(new ExitRequest(activeProduct, 2, "Venda",
                "Reserva fictícia para demonstração."), DEMO_ACTOR);
            reservations.findById(reservation.id()).ifPresent(item -> {
                item.setCreatedAt(now.minusDays(1));
                item.setExpiresAt(now.plusDays(30));
                reservations.save(item);
            });
            activeReservations++;
        }
        Long confirmedProduct = productIdFor("DEMO-2026-003", seededProducts);
        if (confirmedProduct != null) {
            var reservation = movementService.reserveExit(new ExitRequest(confirmedProduct, 2, "Venda",
                "Reserva confirmada fictícia."), DEMO_ACTOR);
            var movement = movementService.confirmReservation(reservation.id());
            setMovementDate(movement.id(), now.minusDays(8));
            confirmedReservations++;
            exitCount++;
        }
        Long cancelledProduct = productIdFor("DEMO-2026-005", seededProducts);
        if (cancelledProduct != null) {
            var reservation = movementService.reserveExit(new ExitRequest(cancelledProduct, 1, "Outro",
                "Reserva cancelada fictícia."), DEMO_ACTOR);
            movementService.cancelReservation(reservation.id());
            cancelledReservations++;
        }

        LOGGER.log(System.Logger.Level.INFO,
            "Carga StockPass: categorias={0}, fornecedores={1}, clientes={2}, produtos={3}, entradas={4}, saídas={5}, reservas ativas={6}, confirmadas={7}, canceladas={8}.",
            categoryCount, supplierCount, clientCount, productCount, entryCount, exitCount,
            activeReservations, confirmedReservations, cancelledReservations);
    }

    private int seedCategories() {
        int created = 0;
        for (String name : CATEGORY_NAMES) {
            if (categories.findByNormalizedName(normalize(name)).isPresent()) continue;
            categoryService.create(new com.stockpass.dto.StockDtos.CategoryRequest(name,
                "Categoria fictícia criada pela carga demonstrativa."));
            created++;
        }
        return created;
    }

    private int seedSuppliers() {
        int created = 0;
        for (int i = 0; i < SUPPLIER_NAMES.size(); i++) {
            String cnpj = String.format("000000000000%02d", i + 1);
            if (suppliers.existsByCnpj(cnpj)) continue;
            Supplier supplier = new Supplier();
            supplier.setLegalName(SUPPLIER_NAMES.get(i));
            supplier.setCnpj(cnpj);
            supplier.setEmail(String.format("fornecedor%02d@demo.invalid", i + 1));
            supplier.setPhone(String.format("(13) 4000-%04d", i + 1));
            supplier.setAddress("Rua Fictícia " + (i + 1) + ", Centro, Cidade Exemplo - SP");
            supplier.setStatus(SupplierStatus.ACTIVE);
            suppliers.save(supplier);
            created++;
        }
        return created;
    }

    private int seedClients() {
        int created = 0;
        for (int i = 1; i <= 4; i++) {
            String email = String.format("cliente%02d@demo.invalid", i);
            if (users.existsByEmailIgnoreCase(email)) continue;
            User client = new User();
            client.setName(String.format("Cliente Demonstração %02d", i));
            client.setEmail(email);
            client.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            client.setRole("CLIENTE");
            client.setActive(true);
            users.save(client);
            created++;
        }
        return created;
    }

    private int addEntry(long productId, int quantity, String invoice, String actor, LocalDateTime date) {
        var movement = movementService.entry(new EntryRequest(productId, quantity, invoice, null), actor);
        setMovementDate(movement.id(), date);
        return 1;
    }

    private int addExit(long productId, int quantity, String reason, String actor, LocalDateTime date) {
        var movement = movementService.exit(new ExitRequest(productId, quantity, reason,
            "Movimentação fictícia de demonstração."), actor);
        setMovementDate(movement.id(), date);
        return 1;
    }

    private void setMovementDate(Long movementId, LocalDateTime date) {
        StockMovement movement = movements.findById(movementId)
            .orElseThrow(() -> new IllegalStateException("Movimentação recém-criada não encontrada."));
        movement.setCreatedAt(date);
        movements.save(movement);
    }

    private static Long productIdFor(String sku, Map<String, Long> seededProducts) {
        return seededProducts.get(sku);
    }

    private static String normalize(String name) { return name.toLowerCase(java.util.Locale.ROOT); }
    private static String sku(int index) { return String.format("DEMO-2026-%03d", index + 1); }
    private static SeedProduct p(String name, int category, int supplier, String price, int reorder, int stock) {
        return new SeedProduct(name, category, supplier, price, reorder, stock);
    }

    private record SeedProduct(String name, int categoryIndex, int supplierIndex, String price,
        int reorderPoint, int finalStock) {}
}
