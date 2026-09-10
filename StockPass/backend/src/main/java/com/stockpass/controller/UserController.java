package com.stockpass.controller;
import com.stockpass.dto.AuthDtos.UserResponse; import com.stockpass.repository.UserRepository; import org.springframework.web.bind.annotation.*; import java.util.List;
@RestController @RequestMapping("/api/users") public class UserController { private final UserRepository repo; public UserController(UserRepository r){repo=r;} @GetMapping public List<UserResponse> all(){return repo.findAll().stream().map(u->new UserResponse(u.getId(),u.getName(),u.getEmail(),u.getRole())).toList();} }
