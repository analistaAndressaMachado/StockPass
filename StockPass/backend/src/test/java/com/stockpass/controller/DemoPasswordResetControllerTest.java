package com.stockpass.controller;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.stockpass.dto.AuthDtos.DemoResetPasswordRequest;
import com.stockpass.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class DemoPasswordResetControllerTest {
    @Mock private AuthService authService;
    @Mock private HttpServletRequest request;

    @Test
    void allowsLocalRequestOnlyWhenDemoIsEnabledAndBoundToLoopback() {
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        var controller = new DemoPasswordResetController(authService, true, "127.0.0.1");
        controller.reset(new DemoResetPasswordRequest("demo@example.test", "new-password"), request);
        verify(authService).resetDemoPassword("demo@example.test", "new-password");
    }

    @Test
    void deniesRequestsUnlessEnabledAndLocallyBound() {
        var body = new DemoResetPasswordRequest("demo@example.test", "new-password");
        assertThrows(ResponseStatusException.class,
            () -> new DemoPasswordResetController(authService, false, "127.0.0.1").reset(body, request));
        assertThrows(ResponseStatusException.class,
            () -> new DemoPasswordResetController(authService, true, "0.0.0.0").reset(body, request));
        when(request.getRemoteAddr()).thenReturn("192.0.2.1");
        assertThrows(ResponseStatusException.class,
            () -> new DemoPasswordResetController(authService, true, "127.0.0.1").reset(body, request));
        verify(authService, never()).resetDemoPassword(body.email(), body.newPassword());
    }
}