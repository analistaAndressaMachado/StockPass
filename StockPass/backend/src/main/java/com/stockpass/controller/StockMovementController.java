package com.stockpass.controller;

import com.stockpass.dto.StockDtos.EntryRequest;
import com.stockpass.dto.StockDtos.ExitRequest;
import com.stockpass.dto.StockDtos.MovementResponse;
import com.stockpass.dto.StockDtos.ReplenishmentRequest;
import com.stockpass.dto.StockDtos.ReplenishmentResponse;
import com.stockpass.model.MovementType;
import com.stockpass.service.StockMovementService;
import com.stockpass.service.StockReplenishmentService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StockMovementController {
    private final StockMovementService service;
    private final StockReplenishmentService replenishmentService;

    public StockMovementController(StockMovementService service, StockReplenishmentService replenishmentService) {
        this.service = service;
        this.replenishmentService = replenishmentService;
    }

    @GetMapping("/api/replenishments")
    public List<ReplenishmentResponse> replenishments() { return replenishmentService.list(); }

    @PostMapping("/api/replenishments")
    public ReplenishmentResponse schedule(@Valid @RequestBody ReplenishmentRequest request, Principal principal) {
        return replenishmentService.schedule(request, principal.getName());
    }

    @GetMapping("/api/entries")
    public List<MovementResponse> entries() { return service.list(MovementType.ENTRY); }

    @PostMapping("/api/entries")
    public MovementResponse createEntry(@Valid @RequestBody EntryRequest request, Principal principal) {
        return service.entry(request, principal.getName());
    }

    @GetMapping("/api/exits")
    public List<MovementResponse> exits() { return service.list(MovementType.EXIT); }

    @PostMapping("/api/exits")
    public MovementResponse createExit(@Valid @RequestBody ExitRequest request, Principal principal) {
        return service.exit(request, principal.getName());
    }
}