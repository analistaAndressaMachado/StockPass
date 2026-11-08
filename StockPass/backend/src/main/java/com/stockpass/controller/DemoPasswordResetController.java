package com.stockpass.controller;

import com.stockpass.dto.AuthDtos.DemoResetPasswordRequest;
import com.stockpass.dto.AuthDtos.MessageResponse;
import com.stockpass.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class DemoPasswordResetController {
    private final AuthService authService;
    private final boolean enabled;
    private final String serverAddress;

    public DemoPasswordResetController(AuthService authService,
            @Value("${app.demo-password-reset.enabled:false}") boolean enabled,
            @Value("${server.address:}") String serverAddress) {
        this.authService = authService;
        this.enabled = enabled;
        this.serverAddress = serverAddress;
    }

    @PostMapping("/api/auth/password/demo-reset")
    public MessageResponse reset(@Valid @RequestBody DemoResetPasswordRequest body, HttpServletRequest request) {
        if (!enabled || !"127.0.0.1".equals(serverAddress) || !"127.0.0.1".equals(request.getRemoteAddr())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Redefinição demonstrativa indisponível.");
        }
        authService.resetDemoPassword(body.email(), body.newPassword());
        return new MessageResponse("Senha redefinida com sucesso. Faça login com a nova senha.");
    }
}