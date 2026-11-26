package com.stockpass.service;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Existing products must remain active when the new nullable column is added to SQLite. */
@Component
public class ProductActiveMigration implements ApplicationRunner {
    private final JdbcTemplate jdbc;

    public ProductActiveMigration(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        boolean hasActiveColumn = jdbc.query("PRAGMA table_info(products)", rs -> {
            while (rs.next()) if ("active".equalsIgnoreCase(rs.getString("name"))) return true;
            return false;
        });
        if (hasActiveColumn) jdbc.update("UPDATE products SET active = 1 WHERE active IS NULL");
    }
}
