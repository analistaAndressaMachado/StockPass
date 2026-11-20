package com.stockpass.controller;

import com.stockpass.dto.ClientDtos.ClientSummaryResponse;
import com.stockpass.dto.ClientDtos.CreateClientRequest;
import com.stockpass.dto.ClientDtos.UpdateClientRequest;
import com.stockpass.dto.ClientDtos.PurchaseResponse;
import com.stockpass.service.ClientManagementService;
import com.stockpass.service.ClientStoreService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/clients")
public class ClientsController {
    private final ClientStoreService service;
    private final ClientManagementService clientManagementService;

    public ClientsController(ClientStoreService service, ClientManagementService clientManagementService) {
        this.service = service;
        this.clientManagementService = clientManagementService;
    }

    @GetMapping
    public List<ClientSummaryResponse> clients() { return service.clients(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClientSummaryResponse createClient(@Valid @RequestBody CreateClientRequest request, Principal principal) {
        return clientManagementService.createClient(request, principal.getName());
    }

    @PutMapping("/{clientId}")
    public ClientSummaryResponse updateClient(@PathVariable Long clientId,
            @Valid @RequestBody UpdateClientRequest request, Principal principal) {
        return clientManagementService.updateClient(clientId, request, principal.getName());
    }

    @DeleteMapping("/{clientId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteClient(@PathVariable Long clientId, Principal principal) {
        clientManagementService.deleteClient(clientId, principal.getName());
    }

    @GetMapping("/{clientId}/purchases")
    public List<PurchaseResponse> purchases(@PathVariable Long clientId) { return service.clientPurchases(clientId); }
}
