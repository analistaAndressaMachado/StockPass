package com.stockpass.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.stockpass.dto.StockDtos.CategoryRequest;
import com.stockpass.dto.StockDtos.ProductRequest;
import com.stockpass.model.Category;
import com.stockpass.repository.CategoryRepository;
import com.stockpass.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.UUID;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class CategoryManagementIntegrationTest {
    @Autowired private CategoryService categories;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductService productService;
    @Autowired private ProductRepository products;
    @Autowired private LegacyCategoryMigration migration;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private EntityManager entityManager;

    @Test
    void categoryCanBeCreatedEditedSearchedAndRejectsDuplicateNames() {
        var created = categories.create(new CategoryRequest("  Mercearia  ", "Produtos secos"));
        assertEquals("Mercearia", created.name());
        assertEquals("Produtos secos", created.description());
        assertEquals(0, created.productCount());
        assertTrue(created.active());

        var edited = categories.update(created.id(), new CategoryRequest("Alimentos", null));
        assertEquals("Alimentos", edited.name());
        assertThrows(IllegalArgumentException.class,
            () -> categories.create(new CategoryRequest(" alimentos ", null)));
        assertThrows(IllegalArgumentException.class,
            () -> categories.create(new CategoryRequest("   ", null)));
    }

    @Test
    void deactivationPreservesLinkedProductAndNewProductsCannotUseInactiveCategory() {
        var category = categories.create(new CategoryRequest("Papelaria", null));
        var product = createProduct("Produto antigo", category.id());
        var inactive = categories.setActive(category.id(), false);

        assertFalse(inactive.active());
        assertEquals(1, inactive.productCount());
        var linked = products.findById(product.id()).orElseThrow();
        assertEquals("Papelaria", linked.getCategory().getName());
        assertThrows(IllegalArgumentException.class, () -> createProduct("Produto novo", category.id()));

        var renamed = categories.update(category.id(), new CategoryRequest("Material escolar", null));
        assertEquals("Material escolar", products.findById(product.id()).orElseThrow().getCategory().getName());
        assertEquals(1, renamed.productCount());
    }

    @Test
    void migrationLinksLegacyTextWithoutChangingProductsAndCanRunAgain() {
        var categoryId = categories.create(new CategoryRequest("Temporária", null)).id();
        var product = createProduct("Migrar legado", categoryId);
        var columns = jdbc.query("PRAGMA table_info(products)", (rs, row) -> rs.getString("name"));
        if (!columns.contains("category")) jdbc.execute("ALTER TABLE products ADD COLUMN category TEXT");
        jdbc.update("UPDATE products SET category = ?, category_id = NULL WHERE id = ?", "Categoria Legada", product.id());

        migration.migrate();
        migration.migrate();
        entityManager.clear();

        var persisted = products.findById(product.id()).orElseThrow();
        assertEquals("Migrar legado", persisted.getName());
        assertEquals("Categoria Legada", persisted.getCategory().getName());
        assertEquals(5, persisted.getQuantity());
    }

    private com.stockpass.dto.StockDtos.ProductResponse createProduct(String name, Long categoryId) {
        return productService.create(new ProductRequest("CAT-" + UUID.randomUUID(), name, categoryId, 5,
            new BigDecimal("3.50"), "Fornecedor", 0), "admin@stockpass.com");
    }
}
