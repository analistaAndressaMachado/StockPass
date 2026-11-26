package com.stockpass.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import java.util.Map;

public class AuthDtos {
 public record LoginRequest(@NotBlank @Email @Size(max = 254) String email,
     @NotBlank @Size(max = 72) String password){}
 public record RegisterRequest(@NotBlank @Size(max = 120) String name,
     @NotBlank @Email @Size(max = 254) String email,
     @NotBlank @Size(min = 6, max = 72) String password){}
 public record SupplierRegisterRequest(
	 @NotBlank @Size(max = 120) String name,
	 @Email @NotBlank @Size(max = 254) String email,
	 @NotBlank @Size(min = 6, max = 72) String password,
	 @NotBlank @Size(max = 150) String companyName,
	 @NotBlank @Size(max = 18) @Pattern(regexp = "(?:[0-9]{14}|[0-9]{2}[.][0-9]{3}[.][0-9]{3}/[0-9]{4}-[0-9]{2})") String taxId,
	 @Size(max = 30) String phone
 ){}
 public record ClientRegisterRequest(
	 @NotBlank @Size(max = 120) String name,
	 @Email @NotBlank @Size(max = 254) String email,
	 @NotBlank @Size(min = 6, max = 72) String password
 ){}
 public record ProfileUpdateRequest(
	 @NotBlank @Size(max = 120) String name,
	 @Size(max = 150) String companyName,
	 @Size(max = 18) String taxId,
	 @Size(max = 30) String phone
 ){}
 public record ForgotPasswordRequest(@Email @NotBlank @Size(max = 254) String email){}
 public record DemoResetPasswordRequest(@Email @NotBlank @Size(max = 254) String email,@NotBlank @Size(min = 6, max = 72) String newPassword){}
 public record ResetPasswordRequest(@NotBlank @Size(max = 4096) String token,@NotBlank @Size(min = 6, max = 72) String newPassword){}
 public record MessageResponse(String message){}
 public record ChangePasswordRequest(@NotBlank @Size(max = 72) String currentPassword,
     @NotBlank @Size(min = 6, max = 72) String newPassword){}
 public record UserResponse(Long id,String name,String email,String role,String companyName,String taxId,String phone,String photoUrl,Map<String,String> permissions){
  public UserResponse(Long id,String name,String email,String role,String companyName,String taxId,String phone,String photoUrl){this(id,name,email,role,companyName,taxId,phone,photoUrl,Map.of());}
 }
 public record AuthResponse(String token,UserResponse user){}
}
