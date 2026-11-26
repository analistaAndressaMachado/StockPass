package com.stockpass.config;

import com.stockpass.service.ClientConflictException;
import com.stockpass.service.ResourceNotFoundException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    ResponseEntity<Map<String, String>> notFound(ResourceNotFoundException error) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", error.getMessage()));
    }

    @ExceptionHandler(ClientConflictException.class)
    ResponseEntity<Map<String, String>> conflict(ClientConflictException error) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", error.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException error) {
        return ResponseEntity.badRequest().body(Map.of("message", error.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, String>> invalidRequest(MethodArgumentNotValidException error) {
        var firstError = error.getBindingResult().getFieldErrors().stream()
            .min(java.util.Comparator.comparing(org.springframework.validation.FieldError::getField))
            .orElse(null);
        String path = firstError == null ? "" : firstError.getField();
        String field = path.substring(path.lastIndexOf('.') + 1);
        int nameMaxLength = firstError != null && firstError.getObjectName().toLowerCase().contains("product") ? 150 : 120;
        String message = switch (field) {
            case "email" -> "Informe um e-mail válido com até 254 caracteres.";
            case "password", "newPassword", "currentPassword" -> "Confira a senha: ela deve ter entre 6 e 72 caracteres.";
            case "name" -> "Informe um nome com até " + nameMaxLength + " caracteres.";
            case "companyName" -> "Informe um nome de empresa com até 150 caracteres.";
            case "quantity" -> "A quantidade deve ser um número inteiro maior que zero.";
            case "initialQuantity", "reorderPoint", "availableQuantity" -> "Informe uma quantidade inteira igual ou maior que zero.";
            case "price" -> "Informe um valor não negativo com no máximo duas casas decimais.";
            case "sku" -> "Informe um código com até 64 caracteres.";
            case "categoryId", "productId" -> "Selecione um produto ou categoria válido.";
            case "taxId" -> "Informe um CNPJ válido.";
            default -> "Confira os campos obrigatórios e os limites informados.";
        };
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<Map<String, String>> unreadableRequest(HttpMessageNotReadableException error) {
        return ResponseEntity.badRequest().body(Map.of(
            "message", "Os dados enviados estão em formato inválido. Confira os tipos e valores dos campos."));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<Map<String, String>> uploadTooLarge(MaxUploadSizeExceededException error) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
            .body(Map.of("message", "A imagem deve ter até 2 MB."));
    }
}
