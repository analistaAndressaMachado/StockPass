package com.stockpass.dto;
public class AuthDtos {
 public record LoginRequest(String email,String password){}
 public record RegisterRequest(String name,String email,String password){}
 public record ChangePasswordRequest(String currentPassword,String newPassword){}
 public record UserResponse(Long id,String name,String email,String role){}
 public record AuthResponse(String token,UserResponse user){}
}
