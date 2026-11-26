package com.stockpass.service;

import com.stockpass.model.Category;
import com.stockpass.repository.CategoryRepository;
import java.util.Locale;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Idempotently links products from the legacy free-text category column to category rows. */
@Component
public class LegacyCategoryMigration implements ApplicationRunner {
    private final JdbcTemplate jdbc;
    private final CategoryRepository categories;

    public LegacyCategoryMigration(JdbcTemplate jdbc, CategoryRepository categories) {
        this.jdbc = jdbc;
        this.categories = categories;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) { migrate(); }

    @Transactional
    public void migrate() {
        boolean hasLegacyCategory = jdbc.query("PRAGMA table_info(products)", rs -> {
            while (rs.next()) if ("category".equalsIgnoreCase(rs.getString("name"))) return true;
            return false;
        });
        boolean hasCategoryId = jdbc.query("PRAGMA table_info(products)", rs -> {
            while (rs.next()) if ("category_id".equalsIgnoreCase(rs.getString("name"))) return true;
            return false;
        });
        if (!hasLegacyCategory || !hasCategoryId) return;

        var legacyProducts = jdbc.query("SELECT id, category FROM products WHERE category_id IS NULL",
            (rs, row) -> new LegacyProduct(rs.getLong("id"), rs.getString("category")));
        for (LegacyProduct legacyProduct : legacyProducts) {
            long productId = legacyProduct.id();
            String legacyName = legacyProduct.category();
            String name = legacyName == null || legacyName.isBlank() ? "Sem categoria" : legacyName.trim();
            String normalized = name.toLowerCase(Locale.ROOT);
            Category category = categories.findByNormalizedName(normalized).orElseGet(() -> {
                Category created = new Category();
                created.setName(name);
                created.setNormalizedName(normalized);
                return categories.save(created);
            });
            jdbc.update("UPDATE products SET category_id = ? WHERE id = ? AND category_id IS NULL",
                category.getId(), productId);
        }
    }

    private record LegacyProduct(long id, String category) {}
}
