package com.stockpass.controller;

import com.stockpass.dto.StockDtos.SupplierAcquisitionRequest;
import com.stockpass.dto.StockDtos.SupplierAcquisitionResponse;
import com.stockpass.dto.StockDtos.SupplierOfferRequest;
import com.stockpass.dto.StockDtos.SupplierOfferResponse;
import com.stockpass.dto.StockDtos.SupplierProfileResponse;
import com.stockpass.dto.StockDtos.SupplierSaleResponse;
import com.stockpass.service.SupplierOfferService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {
    private final SupplierOfferService service;

    public SupplierController(SupplierOfferService service) { this.service = service; }

    @GetMapping("/me")
    public SupplierProfileResponse profile(Principal principal) {
        return service.profile(principal.getName());
    }

    @GetMapping("/offers")
    public List<SupplierOfferResponse> marketplace() { return service.marketplace(); }

    @PostMapping("/offers/{offerId}/acquire")
    public SupplierAcquisitionResponse acquire(@PathVariable Long offerId,
            @Valid @RequestBody SupplierAcquisitionRequest request, Principal principal) {
        return service.acquire(offerId, request, principal.getName());
    }

    @GetMapping("/offers/mine")
    public List<SupplierOfferResponse> ownOffers(Principal principal) {
        return service.ownOffers(principal.getName());
    }

    @GetMapping("/purchases/mine")
    public List<SupplierSaleResponse> salesHistory(Principal principal) {
        return service.salesHistory(principal.getName());
    }

    @PostMapping("/offers/mine")
    @ResponseStatus(HttpStatus.CREATED)
    public SupplierOfferResponse createOffer(@Valid @RequestBody SupplierOfferRequest request, Principal principal) {
        return service.createOffer(principal.getName(), request);
    }

    @PutMapping("/offers/mine/{offerId}")
    public SupplierOfferResponse updateOffer(@PathVariable Long offerId,
            @Valid @RequestBody SupplierOfferRequest request, Principal principal) {
        return service.updateOffer(principal.getName(), offerId, request);
    }

    @DeleteMapping("/offers/mine/{offerId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateOffer(@PathVariable Long offerId, Principal principal) {
        service.deactivateOffer(principal.getName(), offerId);
    }
}