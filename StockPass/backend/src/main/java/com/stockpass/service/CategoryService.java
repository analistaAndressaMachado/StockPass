package com.stockpass.service;

import com.stockpass.dto.StockDtos.CategoryRequest;
import com.stockpass.dto.StockDtos.CategoryResponse;
import com.stockpass.model.Category;
import com.stockpass.repository.CategoryRepository;
import com.stockpass.repository.ProductRepository;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {
    private final CategoryRepository categories;
    private final ProductRepository products;

    public CategoryService(CategoryRepository categories, ProductRepository products) {
        this.categories = categories;
        this.products = products;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> list() {
        return categories.findAllByOrderByNameAsc().stream().map(this::response).toList();
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> listActive() {
        return categories.findAllByActiveTrueOrderByNameAsc().stream().map(this::response).toList();
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        String name = cleanName(request.name());
        String normalized = normalize(name);
        if (categories.findByNormalizedName(normalized).isPresent()) {
            throw new IllegalArgumentException("Já existe uma categoria com esse nome.");
        }
        Category category = new Category();
        category.setName(name);
        category.setNormalizedName(normalized);
        category.setDescription(cleanDescription(request.description()));
        return response(categories.save(category));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = categories.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Categoria não encontrada."));
        String name = cleanName(request.name());
        String normalized = normalize(name);
        if (categories.existsByNormalizedNameAndIdNot(normalized, id)) {
            throw new IllegalArgumentException("Já existe uma categoria com esse nome.");
        }
        category.setName(name);
        category.setNormalizedName(normalized);
        category.setDescription(cleanDescription(request.description()));
        return response(categories.save(category));
    }

    @Transactional
    public CategoryResponse setActive(Long id, boolean active) {
        Category category = categories.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Categoria não encontrada."));
        category.setActive(active);
        return response(categories.save(category));
    }

    Category requireActive(Long id) {
        Category category = categories.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Categoria não encontrada."));
        if (!category.isActive()) throw new IllegalArgumentException("Não é possível associar um produto a uma categoria inativa.");
        return category;
    }

    private CategoryResponse response(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getDescription(),
            category.isActive(), category.getCreatedAt(), products.countByCategory_Id(category.getId()));
    }

    private static String cleanName(String name) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("O nome da categoria é obrigatório.");
        return name.trim();
    }

    private static String normalize(String name) { return name.toLowerCase(Locale.ROOT); }
    private static String cleanDescription(String description) {
        return description == null || description.isBlank() ? null : description.trim();
    }
}
