package com.stockpass.controller;

import com.stockpass.dto.SupplierManagementDtos.ContractRequest;
import com.stockpass.dto.SupplierManagementDtos.ContractResponse;
import com.stockpass.dto.SupplierManagementDtos.SupplierRequest;
import com.stockpass.dto.SupplierManagementDtos.SupplierResponse;
import com.stockpass.service.SupplierManagementService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierManagementController {
    private final SupplierManagementService service;

    public SupplierManagementController(SupplierManagementService service) {
        this.service = service;
    }

    @GetMapping("/records")
    public List<SupplierResponse> listSuppliers() {
        return service.listSuppliers();
    }

    @GetMapping("/records/{id}")
    public SupplierResponse getSupplier(@PathVariable Long id) {
        return service.getSupplier(id);
    }

    @PostMapping("/records")
    @ResponseStatus(HttpStatus.CREATED)
    public SupplierResponse createSupplier(@Valid @RequestBody SupplierRequest request, Principal principal) {
        return service.createSupplier(request, principal.getName());
    }

    @PutMapping("/records/{id}")
    public SupplierResponse updateSupplier(@PathVariable Long id, @Valid @RequestBody SupplierRequest request,
            Principal principal) {
        return service.updateSupplier(id, request, principal.getName());
    }

    @GetMapping("/records/{id}/contracts")
    public List<ContractResponse> listContracts(@PathVariable Long id) {
        return service.listContracts(id);
    }

    @PostMapping("/records/{id}/contracts")
    @ResponseStatus(HttpStatus.CREATED)
    public ContractResponse createContract(@PathVariable Long id, @Valid @RequestBody ContractRequest request,
            Principal principal) {
        return service.createContract(id, request, principal.getName());
    }

    @PutMapping("/records/{id}/contracts/{contractId}")
    public ContractResponse updateContract(@PathVariable Long id, @PathVariable Long contractId,
            @Valid @RequestBody ContractRequest request, Principal principal) {
        return service.updateContract(id, contractId, request, principal.getName());
    }

    @GetMapping("/records/{id}/contracts/{contractId}/attachments")
    public List<SupplierManagementService.ContractAttachmentResponse> listAttachments(@PathVariable Long id, @PathVariable Long contractId) {
        return service.listContractAttachments(id, contractId);
    }

    @PostMapping(value = "/records/{id}/contracts/{contractId}/attachments", consumes = "multipart/form-data")
    @ResponseStatus(HttpStatus.CREATED)
    public SupplierManagementService.ContractAttachmentResponse addAttachment(@PathVariable Long id, @PathVariable Long contractId,
            @RequestParam("file") MultipartFile file) {
        return service.addContractAttachment(id, contractId, file);
    }

    @GetMapping("/records/{id}/contracts/{contractId}/attachments/{attachmentId}/file")
    public ResponseEntity<byte[]> downloadAttachment(@PathVariable Long id, @PathVariable Long contractId, @PathVariable Long attachmentId) {
        var document = service.readContractAttachment(id, contractId, attachmentId);
        String safeName = URLEncoder.encode(document.originalName(), StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(document.contentType()))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + safeName)
            .header("X-Content-Type-Options", "nosniff").cacheControl(CacheControl.noStore()).body(document.bytes());
    }

    @DeleteMapping("/records/{id}/contracts/{contractId}/attachments/{attachmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeAttachment(@PathVariable Long id, @PathVariable Long contractId, @PathVariable Long attachmentId) {
        service.removeContractAttachment(id, contractId, attachmentId);
    }

    @GetMapping("/contracts/expiring")
    public List<ContractResponse> listExpiringContracts(@RequestParam(defaultValue = "30") int days) {
        return service.listExpiringContracts(days);
    }
}
