package com.stockpass.controller;

import com.stockpass.dto.ClientDtos.ClientSummaryResponse;
import com.stockpass.dto.ClientDtos.PurchaseResponse;
import com.stockpass.service.ClientStoreService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/clients")
public class ClientsController {
    private final ClientStoreService service;

    public ClientsController(ClientStoreService service) { this.service = service; }

    @GetMapping
    public List<ClientSummaryResponse> clients() { return service.clients(); }

    @GetMapping("/{clientId}/purchases")
    public List<PurchaseResponse> purchases(@PathVariable Long clientId) { return service.clientPurchases(clientId); }
}