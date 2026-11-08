package com.stockpass.controller;
import jakarta.validation.Valid;
import com.stockpass.dto.AuthDtos.*; import com.stockpass.service.AuthService; import org.springframework.http.*; import org.springframework.web.bind.annotation.*; import java.security.Principal; import java.util.Map;
@RestController @RequestMapping("/api/auth") public class AuthController {
 private final AuthService service; private final com.stockpass.service.PasswordResetService passwordResetService; public AuthController(AuthService s,com.stockpass.service.PasswordResetService p){service=s;passwordResetService=p;}
 @PostMapping("/login") public AuthResponse login(@RequestBody LoginRequest r){return service.login(r);}
 @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED) public UserResponse register(@RequestBody RegisterRequest r){return service.register(r);}
 @PostMapping("/register-supplier") @ResponseStatus(HttpStatus.CREATED) public UserResponse registerSupplier(@Valid @RequestBody SupplierRegisterRequest r){return service.registerSupplier(r);}
 @PostMapping("/register-client") @ResponseStatus(HttpStatus.CREATED) public UserResponse registerClient(@Valid @RequestBody ClientRegisterRequest r){return service.registerClient(r);}
 @PostMapping("/password/forgot") @ResponseStatus(HttpStatus.ACCEPTED) public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest r){return passwordResetService.requestReset(r.email());}
 @PostMapping("/password/reset") public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest r){return passwordResetService.resetPassword(r);}
 @GetMapping("/profile") public UserResponse profile(Principal p){return service.profile(p.getName());}
 @PutMapping("/profile") public UserResponse updateProfile(Principal p,@Valid @RequestBody ProfileUpdateRequest r){return service.updateProfile(p.getName(),r);}
 @PutMapping("/password") public Map<String,String> password(Principal p,@RequestBody ChangePasswordRequest r){service.changePassword(p.getName(),r);return Map.of("message","Senha alterada com sucesso.");}
}
