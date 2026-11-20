package com.stockpass.service;

import com.stockpass.dto.SupplierManagementDtos.ContractRequest;
import com.stockpass.dto.SupplierManagementDtos.ContractResponse;
import com.stockpass.dto.SupplierManagementDtos.SupplierRequest;
import com.stockpass.dto.SupplierManagementDtos.SupplierResponse;
import com.stockpass.model.Supplier;
import com.stockpass.model.SupplierContract;
import com.stockpass.model.SupplierContractStatus;
import com.stockpass.model.SupplierContractAttachment;
import com.stockpass.model.UserActivity;
import com.stockpass.repository.SupplierContractRepository;
import com.stockpass.repository.SupplierContractAttachmentRepository;
import com.stockpass.repository.SupplierRepository;
import com.stockpass.repository.UserActivityRepository;
import com.stockpass.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class SupplierManagementService {
    private final SupplierRepository suppliers;
    private final SupplierContractRepository contracts;
    private final SupplierContractAttachmentRepository attachments;
    private final FileStorageService fileStorage;
    private final UserRepository users;
    private final UserActivityRepository activities;

    public SupplierManagementService(SupplierRepository suppliers, SupplierContractRepository contracts,
            SupplierContractAttachmentRepository attachments, FileStorageService fileStorage,
            UserRepository users, UserActivityRepository activities) {
        this.suppliers = suppliers;
        this.contracts = contracts;
        this.attachments = attachments;
        this.fileStorage = fileStorage;
        this.users = users;
        this.activities = activities;
    }

    @Transactional
    public SupplierResponse createSupplier(SupplierRequest request, String actorEmail) {
        String cnpj = normalizeCnpj(request.cnpj());
        if (suppliers.existsByCnpj(cnpj)) {
            throw new IllegalArgumentException("Já existe um fornecedor cadastrado com esse CNPJ.");
        }
        Supplier supplier = new Supplier();
        apply(supplier, request, cnpj);
        Supplier saved = suppliers.save(supplier);
        record(actorEmail, "Criou o fornecedor " + saved.getLegalName() + ".");
        return response(saved);
    }

    @Transactional(readOnly = true)
    public List<SupplierResponse> listSuppliers() {
        return suppliers.findAll().stream().map(SupplierManagementService::response).toList();
    }

    @Transactional(readOnly = true)
    public SupplierResponse getSupplier(Long id) {
        return suppliers.findById(id).map(SupplierManagementService::response)
            .orElseThrow(() -> new ResourceNotFoundException("Fornecedor não encontrado."));
    }

    @Transactional(readOnly = true)
    public List<ContractResponse> listExpiringContracts(int days) {
        if (days < 0 || days > 365) {
            throw new IllegalArgumentException("O prazo deve estar entre 0 e 365 dias.");
        }
        LocalDate today = LocalDate.now();
        return contracts.findAllByStatusAndEndDateBetweenOrderByEndDateAsc(
                SupplierContractStatus.CURRENT, today, today.plusDays(days)).stream()
            .map(SupplierManagementService::response).toList();
    }

    @Transactional
    public SupplierResponse updateSupplier(Long id, SupplierRequest request, String actorEmail) {
        Supplier supplier = suppliers.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Fornecedor não encontrado."));
        String cnpj = normalizeCnpj(request.cnpj());
        if (!supplier.getCnpj().equals(cnpj) && suppliers.existsByCnpjAndIdNot(cnpj, id)) {
            throw new IllegalArgumentException("Já existe um fornecedor cadastrado com esse CNPJ.");
        }
        apply(supplier, request, cnpj);
        supplier.setUpdatedAt(LocalDateTime.now());
        Supplier saved = suppliers.save(supplier);
        record(actorEmail, "Editou o fornecedor " + saved.getLegalName() + ".");
        return response(saved);
    }

    @Transactional(readOnly = true)
    public List<ContractResponse> listContracts(Long supplierId) {
        requireSupplier(supplierId);
        return contracts.findAllBySupplierIdOrderByEndDateAsc(supplierId).stream()
            .map(SupplierManagementService::response).toList();
    }

    @Transactional
    public ContractResponse createContract(Long supplierId, ContractRequest request, String actorEmail) {
        Supplier supplier = requireSupplier(supplierId);
        validateContract(request);
        SupplierContract contract = new SupplierContract();
        contract.setSupplier(supplier);
        apply(contract, request);
        SupplierContract saved = contracts.save(contract);
        record(actorEmail, "Criou o contrato " + saved.getContractNumber() + " do fornecedor " + supplier.getLegalName() + ".");
        return response(saved);
    }

    @Transactional
    public ContractResponse updateContract(Long supplierId, Long contractId, ContractRequest request, String actorEmail) {
        Supplier supplier = requireSupplier(supplierId);
        SupplierContract contract = contracts.findByIdAndSupplierId(contractId, supplierId)
            .orElseThrow(() -> new ResourceNotFoundException("Contrato não encontrado para este fornecedor."));
        validateContract(request);
        apply(contract, request);
        contract.setUpdatedAt(LocalDateTime.now());
        SupplierContract saved = contracts.save(contract);
        record(actorEmail, "Editou o contrato " + saved.getContractNumber() + " do fornecedor " + supplier.getLegalName() + ".");
        return response(saved);
    }

    @Transactional
    public ContractAttachmentResponse addContractAttachment(Long supplierId, Long contractId, MultipartFile file) {
        SupplierContract contract = requireContract(supplierId, contractId);
        FileStorageService.StoredDocument stored = fileStorage.storeContractDocument(file);
        SupplierContractAttachment attachment = new SupplierContractAttachment();
        attachment.setContract(contract);
        attachment.setStorageName(stored.fileName());
        attachment.setOriginalName(stored.originalName());
        attachment.setContentType(stored.contentType());
        attachment.setSize(stored.size());
        try {
            return attachmentResponse(attachments.saveAndFlush(attachment));
        } catch (RuntimeException error) {
            fileStorage.deleteDocument(stored.fileName());
            throw error;
        }
    }

    @Transactional(readOnly = true)
    public List<ContractAttachmentResponse> listContractAttachments(Long supplierId, Long contractId) {
        SupplierContract contract = requireContract(supplierId, contractId);
        return contract.getAttachments().stream().map(SupplierManagementService::attachmentResponse).toList();
    }

    @Transactional(readOnly = true)
    public FileStorageService.DocumentFile readContractAttachment(Long supplierId, Long contractId, Long attachmentId) {
        SupplierContract contract = requireContract(supplierId, contractId);
        SupplierContractAttachment attachment = attachments.findByIdAndContractId(attachmentId, contract.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado para este contrato."));
        return fileStorage.readDocument(attachment.getStorageName(), attachment.getContentType(), attachment.getOriginalName());
    }

    @Transactional
    public void removeContractAttachment(Long supplierId, Long contractId, Long attachmentId) {
        SupplierContract contract = requireContract(supplierId, contractId);
        SupplierContractAttachment attachment = attachments.findByIdAndContractId(attachmentId, contract.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Documento não encontrado para este contrato."));
        String storageName = attachment.getStorageName();
        attachments.delete(attachment);
        attachments.flush();
        fileStorage.deleteDocument(storageName);
    }

    private SupplierContract requireContract(Long supplierId, Long contractId) {
        requireSupplier(supplierId);
        return contracts.findByIdAndSupplierId(contractId, supplierId)
            .orElseThrow(() -> new ResourceNotFoundException("Contrato não encontrado para este fornecedor."));
    }

    private Supplier requireSupplier(Long id) {
        return suppliers.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Fornecedor não encontrado."));
    }

    private static String normalizeCnpj(String value) {
        String digits = value == null ? "" : value.replaceAll("\\D", "");
        if (digits.length() != 14) {
            throw new IllegalArgumentException("O CNPJ deve conter 14 dígitos.");
        }
        return digits;
    }

    private static void validateContract(ContractRequest request) {
        if (request.startDate().isAfter(request.endDate())) {
            throw new IllegalArgumentException("A data de início não pode ser posterior à data de fim.");
        }
        if (request.value() != null && request.value().signum() < 0) {
            throw new IllegalArgumentException("O valor do contrato não pode ser negativo.");
        }
    }

    private static void apply(Supplier supplier, SupplierRequest request, String cnpj) {
        supplier.setLegalName(request.legalName().trim());
        supplier.setCnpj(cnpj);
        supplier.setEmail(request.email().trim());
        supplier.setPhone(clean(request.phone()));
        supplier.setAddress(clean(request.address()));
        supplier.setStatus(request.status());
    }

    private static void apply(SupplierContract contract, ContractRequest request) {
        contract.setContractNumber(request.contractNumber().trim());
        contract.setStartDate(request.startDate());
        contract.setEndDate(request.endDate());
        contract.setValue(request.value());
        contract.setStatus(request.status());
        contract.setObservations(clean(request.observations()));
    }

    private void record(String actorEmail, String action) {
        UserActivity activity = new UserActivity();
        activity.setActor(users.findByEmailIgnoreCase(actorEmail).map(user -> user.getName()).orElse(actorEmail));
        activity.setAction(action);
        activities.save(activity);
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static SupplierResponse response(Supplier supplier) {
        return new SupplierResponse(supplier.getId(), supplier.getLegalName(), supplier.getCnpj(), supplier.getEmail(),
            supplier.getPhone(), supplier.getAddress(), supplier.getStatus(), supplier.getCreatedAt(), supplier.getUpdatedAt());
    }

    private static ContractResponse response(SupplierContract contract) {
        return new ContractResponse(contract.getId(), contract.getSupplier().getId(), contract.getContractNumber(),
            contract.getStartDate(), contract.getEndDate(), contract.getValue(), contract.getStatus(),
            contract.getObservations(), contract.getCreatedAt(), contract.getUpdatedAt());
    }

    private static ContractAttachmentResponse attachmentResponse(SupplierContractAttachment attachment) {
        return new ContractAttachmentResponse(attachment.getId(), attachment.getOriginalName(), attachment.getContentType(),
            attachment.getSize(), attachment.getCreatedAt());
    }

    public record ContractAttachmentResponse(Long id, String originalName, String contentType, long size, LocalDateTime createdAt) {}
}
