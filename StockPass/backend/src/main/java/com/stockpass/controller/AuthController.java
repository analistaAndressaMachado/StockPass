package com.stockpass.controller;
import com.stockpass.dto.AuthDtos.*; import com.stockpass.service.AuthService; import org.springframework.http.*; import org.springframework.web.bind.annotation.*; import java.security.Principal; import java.util.Map;
@RestController @RequestMapping("/api/auth") public class AuthController {
 private final AuthService service; public AuthController(AuthService s){service=s;}
 @PostMapping("/login") public AuthResponse login(@RequestBody LoginRequest r){return service.login(r);}
 @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED) public UserResponse register(@RequestBody RegisterRequest r){return service.register(r);}
 @GetMapping("/profile") public UserResponse profile(Principal p){return service.profile(p.getName());}
 @PutMapping("/password") public Map<String,String> password(Principal p,@RequestBody ChangePasswordRequest r){service.changePassword(p.getName(),r);return Map.of("message","Senha alterada com sucesso.");}
}
