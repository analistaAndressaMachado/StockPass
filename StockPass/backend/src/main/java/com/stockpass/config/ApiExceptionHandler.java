package com.stockpass.config;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException error) {
        return ResponseEntity.badRequest().body(Map.of("message", error.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, String>> invalidRequest(MethodArgumentNotValidException error) {
        String message = error.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(fieldError -> switch (fieldError.getField()) {
                case "email" -> "Informe um e-mail válido.";
                case "password", "newPassword" -> "A senha deve possuir pelo menos 6 caracteres.";
                case "name" -> "Informe seu nome.";
                case "companyName" -> "Informe o nome da empresa.";
                default -> "Confira os dados informados e tente novamente.";
            })
            .orElse("Confira os dados informados e tente novamente.");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", message));
    }
}
