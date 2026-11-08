package com.stockpass.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.stockpass.model.User;
import com.stockpass.repository.UserRepository;
import com.stockpass.security.JwtService;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class DemoPasswordResetTest {
    @Mock private UserRepository users;
    @Mock private PasswordEncoder encoder;
    @Mock private JwtService jwt;

    @Test
    void savesEncodedPasswordForExistingUser() {
        var user = new User();
        when(users.findByEmailIgnoreCase("demo@example.test")).thenReturn(Optional.of(user));
        when(encoder.encode("new-password")).thenReturn("encoded-password");
        new AuthService(users, encoder, jwt).resetDemoPassword(" demo@example.test ", "new-password");
        assertEquals("encoded-password", user.getPassword());
        verify(users).save(user);
    }

    @Test
    void rejectsShortPassword() {
        var user = new User();
        when(users.findByEmailIgnoreCase("demo@example.test")).thenReturn(Optional.of(user));
        assertThrows(IllegalArgumentException.class,
            () -> new AuthService(users, encoder, jwt).resetDemoPassword("demo@example.test", "123"));
        verify(users, never()).save(user);
    }
}