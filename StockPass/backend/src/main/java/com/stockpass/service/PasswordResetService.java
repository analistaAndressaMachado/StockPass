package com.stockpass.service;

import com.stockpass.dto.AuthDtos.MessageResponse;
import com.stockpass.dto.AuthDtos.ResetPasswordRequest;
import com.stockpass.model.PasswordResetToken;
import com.stockpass.model.User;
import com.stockpass.repository.PasswordResetTokenRepository;
import com.stockpass.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PasswordResetService {
    private static final Logger LOGGER = LoggerFactory.getLogger(PasswordResetService.class);
    private static final String GENERIC_MESSAGE =
        "Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.";

    private final UserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.password-reset.from}")
    private String fromAddress;

    @Value("${app.password-reset.frontend-url}")
    private String frontendUrl;

    @Value("${app.password-reset.ttl-minutes:30}")
    private long ttlMinutes;

    public PasswordResetService(UserRepository users, PasswordResetTokenRepository tokens,
            JavaMailSender mailSender, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.tokens = tokens;
        this.mailSender = mailSender;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public MessageResponse requestReset(String email) {
        User user = users.findByEmailIgnoreCase(email.trim()).orElse(null);
        if (user == null) return new MessageResponse(GENERIC_MESSAGE);

        LocalDateTime now = LocalDateTime.now();
        tokens.findAllByUserIdAndUsedAtIsNull(user.getId()).forEach(token -> token.setUsedAt(now));

        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setTokenHash(hash(rawToken));
        resetToken.setExpiresAt(now.plusMinutes(ttlMinutes));
        tokens.save(resetToken);

        String resetUrl = frontendUrl.replaceAll("/$", "") + "/?resetToken=" + rawToken;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(user.getEmail());
        message.setSubject("Redefinição de senha - StockPass");
        message.setText("Olá, " + user.getName() + ".\n\n" +
            "Recebemos um pedido para redefinir sua senha. O link expira em " + ttlMinutes + " minutos e só pode ser usado uma vez.\n\n" +
            resetUrl + "\n\n" +
            "Se você não solicitou esta alteração, ignore esta mensagem.");

        try {
            mailSender.send(message);
        } catch (MailException error) {
            LOGGER.error("Falha ao enviar mensagem de redefinição de senha.", error);
        }
        return new MessageResponse(GENERIC_MESSAGE);
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        String tokenHash = hash(request.token());
        PasswordResetToken resetToken = tokens.findByTokenHashAndUsedAtIsNull(tokenHash)
            .orElseThrow(() -> new IllegalArgumentException("Link inválido ou expirado. Solicite uma nova redefinição."));
        LocalDateTime now = LocalDateTime.now();
        if (!resetToken.getExpiresAt().isAfter(now)) {
            resetToken.setUsedAt(now);
            tokens.save(resetToken);
            throw new IllegalArgumentException("Link inválido ou expirado. Solicite uma nova redefinição.");
        }
        if (request.newPassword() == null || request.newPassword().length() < 6) {
            throw new IllegalArgumentException("A nova senha deve possuir pelo menos 6 caracteres.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        users.save(user);
        resetToken.setUsedAt(now);
        tokens.save(resetToken);
        return new MessageResponse("Senha redefinida com sucesso. Faça login com a nova senha.");
    }

    private static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (java.security.NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 não está disponível.", error);
        }
    }
}