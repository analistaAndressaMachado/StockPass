package com.stockpass.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.stockpass.dto.SupplierManagementDtos.ContractRequest;
import com.stockpass.dto.SupplierManagementDtos.SupplierRequest;
import com.stockpass.model.SupplierContractStatus;
import com.stockpass.model.SupplierStatus;
import com.stockpass.repository.SupplierContractRepository;
import com.stockpass.repository.SupplierRepository;
import com.stockpass.repository.UserActivityRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class SupplierManagementServiceTest {
    @Autowired private SupplierManagementService service;
    @Autowired private SupplierRepository suppliers;
    @Autowired private SupplierContractRepository contracts;
    @Autowired private UserActivityRepository activities;

    @Test
    void createsSupplierWithNormalizedUniqueCnpjAndRecordsActor() {
        var created = service.createSupplier(supplierRequest("12.345.678/0001-90", "Distribuidora " + UUID.randomUUID()),
            "admin@stockpass.com");

        assertEquals("12345678000190", created.cnpj());
        assertEquals(SupplierStatus.ACTIVE, created.status());
        assertEquals("Administrador", activities.findAllByOrderByCreatedAtDescIdDesc().get(0).getActor());
        assertTrue(activities.findAllByOrderByCreatedAtDescIdDesc().get(0).getAction().contains("Criou o fornecedor"));
    }

    @Test
    void rejectsDuplicateCnpjEvenWhenFormattingDiffers() {
        service.createSupplier(supplierRequest("12.345.678/0001-90", "Fornecedor A"), "admin@stockpass.com");

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
            () -> service.createSupplier(supplierRequest("12345678000190", "Fornecedor B"), "admin@stockpass.com"));

        assertTrue(error.getMessage().contains("CNPJ"));
    }

    @Test
    void rejectsCnpjWithWrongNumberOfDigits() {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
            () -> service.createSupplier(supplierRequest("123", "Fornecedor inválido"), "admin@stockpass.com"));

        assertTrue(error.getMessage().contains("14 dígitos"));
    }

    @Test
    void updatesSupplierAndRecordsEdit() {
        var created = service.createSupplier(supplierRequest("12.345.678/0001-90", "Fornecedor inicial"),
            "admin@stockpass.com");

        var updated = service.updateSupplier(created.id(), new SupplierRequest("Fornecedor atualizado",
            "12.345.678/0001-90", "novo@example.com", null, " Endereço novo ", SupplierStatus.INACTIVE),
            "admin@stockpass.com");

        assertEquals("Fornecedor atualizado", updated.legalName());
        assertEquals("Endereço novo", updated.address());
        assertEquals(SupplierStatus.INACTIVE, updated.status());
        assertTrue(activities.findAllByOrderByCreatedAtDescIdDesc().get(0).getAction().contains("Editou o fornecedor"));
    }

    @Test
    void createsContractWithOptionalValueAndRecordsActivity() {
        var supplier = service.createSupplier(supplierRequest("12.345.678/0001-90", "Fornecedor contratos"),
            "admin@stockpass.com");

        var response = service.createContract(supplier.id(), contractRequest("CT-001", LocalDate.of(2026, 1, 1),
            LocalDate.of(2026, 12, 31), null, SupplierContractStatus.CURRENT), "admin@stockpass.com");

        assertNull(response.value());
        assertEquals(1, contracts.findAllBySupplierIdOrderByEndDateAsc(supplier.id()).size());
        assertTrue(activities.findAllByOrderByCreatedAtDescIdDesc().get(0).getAction().contains("Criou o contrato CT-001"));
    }

    @Test
    void rejectsContractWithStartAfterEndOrNegativeValue() {
        var supplier = service.createSupplier(supplierRequest("12.345.678/0001-90", "Fornecedor datas"),
            "admin@stockpass.com");

        assertThrows(IllegalArgumentException.class, () -> service.createContract(supplier.id(),
            contractRequest("CT-002", LocalDate.of(2026, 12, 1), LocalDate.of(2026, 1, 1),
                BigDecimal.ONE, SupplierContractStatus.CURRENT), "admin@stockpass.com"));
        assertThrows(IllegalArgumentException.class, () -> service.createContract(supplier.id(),
            contractRequest("CT-003", LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 1),
                new BigDecimal("-0.01"), SupplierContractStatus.CURRENT), "admin@stockpass.com"));

        assertTrue(contracts.findAll().isEmpty());
    }

    @Test
    void updatesContractStatusAndRejectsContractOwnedByAnotherSupplier() {
        var first = service.createSupplier(supplierRequest("12.345.678/0001-90", "Fornecedor um"), "admin@stockpass.com");
        var second = service.createSupplier(supplierRequest("98.765.432/0001-10", "Fornecedor dois"), "admin@stockpass.com");
        var contract = service.createContract(first.id(), contractRequest("CT-004", LocalDate.of(2026, 1, 1),
            LocalDate.of(2026, 12, 1), new BigDecimal("250.00"), SupplierContractStatus.CURRENT), "admin@stockpass.com");

        var updated = service.updateContract(first.id(), contract.id(), contractRequest("CT-004", LocalDate.of(2026, 1, 1),
            LocalDate.of(2026, 12, 1), new BigDecimal("250.00"), SupplierContractStatus.CANCELED), "admin@stockpass.com");

        assertEquals(SupplierContractStatus.CANCELED, updated.status());
        assertTrue(activities.findAllByOrderByCreatedAtDescIdDesc().get(0).getAction().contains("Editou o contrato CT-004"));
        assertThrows(IllegalArgumentException.class, () -> service.updateContract(second.id(), contract.id(),
            contractRequest("CT-004", LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 1), null,
                SupplierContractStatus.CURRENT), "admin@stockpass.com"));
    }

    private static SupplierRequest supplierRequest(String cnpj, String name) {
        return new SupplierRequest(name, cnpj, "supplier@example.com", "(11) 99999-0000", "Rua Teste, 10", SupplierStatus.ACTIVE);
    }

    private static ContractRequest contractRequest(String number, LocalDate start, LocalDate end,
            BigDecimal value, SupplierContractStatus status) {
        return new ContractRequest(number, start, end, value, status, "Observação de teste");
    }
}
