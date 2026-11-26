package com.stockpass.controller;

import com.stockpass.dto.StockDtos.CategoryRequest;
import com.stockpass.dto.StockDtos.CategoryResponse;
import com.stockpass.service.CategoryService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {
    private final CategoryService service;
    public CategoryController(CategoryService service) { this.service = service; }

    @GetMapping
    public List<CategoryResponse> list(@RequestParam(defaultValue = "false") boolean activeOnly) {
        return activeOnly ? service.listActive() : service.list();
    }

    @PostMapping
    public CategoryResponse create(@Valid @RequestBody CategoryRequest request) { return service.create(request); }

    @PutMapping("/{id}")
    public CategoryResponse update(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return service.update(id, request);
    }

    @PutMapping("/{id}/status")
    public CategoryResponse setActive(@PathVariable Long id, @RequestBody CategoryStatusRequest request) {
        return service.setActive(id, request.active());
    }

    public record CategoryStatusRequest(boolean active) {}
}
