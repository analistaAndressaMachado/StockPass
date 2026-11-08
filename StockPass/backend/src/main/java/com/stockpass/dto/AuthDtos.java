package com.stockpass.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {
 public record LoginRequest(String email,String password){}
 public record RegisterRequest(String name,String email,String password){}
 public record SupplierRegisterRequest(
	 @NotBlank String name,
	 @Email @NotBlank String email,
	 @Size(min = 6) String password,
	 @NotBlank String companyName,
	 String taxId,
	 String phone
 ){}
 public record ClientRegisterRequest(
	 @NotBlank String name,
	 @Email @NotBlank String email,
	 @Size(min = 6) String password
 ){}
 public record ProfileUpdateRequest(
	 @NotBlank String name,
	 @Email @NotBlank String email,
	 String companyName,
	 String taxId,
	 String phone
 ){}
 public record ForgotPasswordRequest(@Email @NotBlank String email){}
 public record DemoResetPasswordRequest(@Email @NotBlank String email,@NotBlank @Size(min = 6) String newPassword){}
 public record ResetPasswordRequest(@NotBlank String token,@Size(min = 6) String newPassword){}
 public record MessageResponse(String message){}
 public record ChangePasswordRequest(String currentPassword,String newPassword){}
 public record UserResponse(Long id,String name,String email,String role,String companyName,String taxId,String phone){}
 public record AuthResponse(String token,UserResponse user){}
}
