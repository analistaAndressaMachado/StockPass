package com.stockpass.repository;

import com.stockpass.model.PasswordResetToken;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByTokenHashAndUsedAtIsNull(String tokenHash);
    List<PasswordResetToken> findAllByUserIdAndUsedAtIsNull(Long userId);
}