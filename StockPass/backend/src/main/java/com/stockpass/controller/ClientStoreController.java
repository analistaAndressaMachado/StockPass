package com.stockpass.controller;

import com.stockpass.dto.ClientDtos.PurchaseRequest;
import com.stockpass.dto.ClientDtos.PurchaseResponse;
import com.stockpass.dto.ClientDtos.StoreProductResponse;
import com.stockpass.service.ClientStoreService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/store")
public class ClientStoreController {
    private final ClientStoreService service;

    public ClientStoreController(ClientStoreService service) { this.service = service; }

    @GetMapping("/products")
    public List<StoreProductResponse> products() { return service.products(); }

    @PostMapping("/purchases")
    @ResponseStatus(HttpStatus.CREATED)
    public PurchaseResponse purchase(@Valid @RequestBody PurchaseRequest request, Principal principal) {
        return service.purchase(request, principal.getName());
    }

    @GetMapping("/purchases")
    public List<PurchaseResponse> purchases(Principal principal) {
        return service.purchases(principal.getName());
    }
}