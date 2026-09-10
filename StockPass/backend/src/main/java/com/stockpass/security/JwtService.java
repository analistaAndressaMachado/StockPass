package com.stockpass.security;
import io.jsonwebtoken.Jwts; import io.jsonwebtoken.security.Keys; import org.springframework.beans.factory.annotation.Value; import org.springframework.stereotype.Service; import java.nio.charset.StandardCharsets; import java.util.Date;
@Service public class JwtService {
 @Value("${app.jwt.secret}") private String secret; @Value("${app.jwt.expiration-ms}") private long expiration;
 public String generate(String email){var key=Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)); return Jwts.builder().subject(email).issuedAt(new Date()).expiration(new Date(System.currentTimeMillis()+expiration)).signWith(key).compact();}
}
