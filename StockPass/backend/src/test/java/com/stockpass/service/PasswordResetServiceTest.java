package com.stockpass.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.stockpass.dto.AuthDtos.ResetPasswordRequest;
import com.stockpass.model.PasswordResetToken;
import com.stockpass.model.User;
import com.stockpass.repository.PasswordResetTokenRepository;
import com.stockpass.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {
    @Mock private UserRepository users;
    @Mock private PasswordResetTokenRepository tokens;
    @Mock private JavaMailSender mailSender;
    @Mock private PasswordEncoder passwordEncoder;

    private PasswordResetService service;

    @BeforeEach
    void setUp() {
        service = new PasswordResetService(users, tokens, mailSender, passwordEncoder);
        ReflectionTestUtils.setField(service, "fromAddress", "stockpass@example.test");
        ReflectionTestUtils.setField(service, "frontendUrl", "http://localhost:5173");
        ReflectionTestUtils.setField(service, "ttlMinutes", 30L);
    }

    @Test
    void unknownEmailReceivesSameGenericResponseWithoutSendingMail() {
        when(users.findByEmailIgnoreCase("missing@example.test")).thenReturn(Optional.empty());

        var response = service.requestReset("missing@example.test");

        assertEquals("Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.", response.message());
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void knownEmailReceivesResetLinkWhileOnlyTokenHashIsPersisted() throws Exception {
        User user = new User();
        user.setName("Cliente");
        user.setEmail("cliente@example.test");
        when(users.findByEmailIgnoreCase("cliente@example.test")).thenReturn(Optional.of(user));
        when(tokens.findAllByUserIdAndUsedAtIsNull(user.getId())).thenReturn(List.of());

        var response = service.requestReset("cliente@example.test");

        ArgumentCaptor<PasswordResetToken> storedToken = ArgumentCaptor.forClass(PasswordResetToken.class);
        ArgumentCaptor<SimpleMailMessage> sentEmail = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(tokens).save(storedToken.capture());
        verify(mailSender).send(sentEmail.capture());
        String emailBody = sentEmail.getValue().getText();
        String rawToken = emailBody.replaceFirst("(?s).*resetToken=([^\\s]+).*", "$1");
        assertEquals("Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.", response.message());
        assertEquals("http://localhost:5173/?resetToken=" + rawToken, emailBody.lines()
            .filter(line -> line.contains("resetToken=")).findFirst().orElseThrow());
        assertEquals(hash(rawToken), storedToken.getValue().getTokenHash());
        org.junit.jupiter.api.Assertions.assertNotEquals(rawToken, storedToken.getValue().getTokenHash());
    }

    @Test
    void validTokenChangesPasswordAndCanOnlyBeUsedOnce() throws Exception {
        User user = new User();
        user.setName("Cliente");
        user.setEmail("cliente@example.test");
        user.setPassword("old-hash");
        String rawToken = "one-time-reset-token";
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setTokenHash(hash(rawToken));
        token.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        when(tokens.findByTokenHashAndUsedAtIsNull(hash(rawToken)))
            .thenReturn(Optional.of(token), Optional.empty());
        when(passwordEncoder.encode("new-password")).thenReturn("new-hash");
        when(users.save(user)).thenReturn(user);
        when(tokens.save(token)).thenReturn(token);

        var response = service.resetPassword(new ResetPasswordRequest(rawToken, "new-password"));

        assertEquals("Senha redefinida com sucesso. Faça login com a nova senha.", response.message());
        assertEquals("new-hash", user.getPassword());
        assertNotNull(token.getUsedAt());
        verify(users).save(user);
        verify(tokens).save(token);
        assertThrows(IllegalArgumentException.class,
            () -> service.resetPassword(new ResetPasswordRequest(rawToken, "another-password")));
    }

    @Test
    void expiredTokenIsRejected() throws Exception {
        PasswordResetToken token = new PasswordResetToken();
        token.setTokenHash(hash("expired-token"));
        token.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        when(tokens.findByTokenHashAndUsedAtIsNull(hash("expired-token"))).thenReturn(Optional.of(token));
        when(tokens.save(token)).thenReturn(token);

        assertThrows(IllegalArgumentException.class,
            () -> service.resetPassword(new ResetPasswordRequest("expired-token", "new-password")));
        verify(users, never()).save(any(User.class));
    }

    private static String hash(String token) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(digest);
    }
}
