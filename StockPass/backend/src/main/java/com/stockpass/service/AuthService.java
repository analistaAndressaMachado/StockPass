package com.stockpass.service;
import com.stockpass.dto.AuthDtos.*; import com.stockpass.model.User; import com.stockpass.repository.UserRepository; import com.stockpass.security.JwtService; import org.springframework.security.crypto.password.PasswordEncoder; import org.springframework.stereotype.Service;
@Service public class AuthService {
 private final UserRepository repo; private final PasswordEncoder encoder; private final JwtService jwt;
 public AuthService(UserRepository r,PasswordEncoder e,JwtService j){repo=r;encoder=e;jwt=j;}
 private UserResponse out(User u){return new UserResponse(u.getId(),u.getName(),u.getEmail(),u.getRole());}
 public AuthResponse login(LoginRequest req){User u=repo.findByEmailIgnoreCase(req.email()).orElseThrow(()->new IllegalArgumentException("E-mail ou senha inválidos.")); if(!encoder.matches(req.password(),u.getPassword())) throw new IllegalArgumentException("E-mail ou senha inválidos."); return new AuthResponse(jwt.generate(u.getEmail()),out(u));}
 public UserResponse register(RegisterRequest req){if(repo.existsByEmailIgnoreCase(req.email())) throw new IllegalArgumentException("E-mail já cadastrado."); if(req.password()==null||req.password().length()<6) throw new IllegalArgumentException("A senha deve possuir pelo menos 6 caracteres."); User u=new User();u.setName(req.name());u.setEmail(req.email());u.setPassword(encoder.encode(req.password()));return out(repo.save(u));}
 public UserResponse profile(String email){return repo.findByEmailIgnoreCase(email).map(this::out).orElseThrow(()->new IllegalArgumentException("Usuário não encontrado."));}
 public void changePassword(String email,ChangePasswordRequest req){User u=repo.findByEmailIgnoreCase(email).orElseThrow(); if(!encoder.matches(req.currentPassword(),u.getPassword())) throw new IllegalArgumentException("Senha atual incorreta."); if(req.newPassword()==null||req.newPassword().length()<6) throw new IllegalArgumentException("A nova senha deve possuir pelo menos 6 caracteres.");u.setPassword(encoder.encode(req.newPassword()));repo.save(u);}
}
