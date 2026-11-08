package com.stockpass.controller;

import com.stockpass.service.UserManagementService;
import com.stockpass.service.UserManagementService.Activity;
import com.stockpass.service.UserManagementService.ManagedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
	private final UserManagementService service;

	public record CreateRequest(@NotBlank String name, @NotBlank @Email String email,
		@NotBlank String role, @NotBlank @Size(min = 6) String password) {}
	public record UpdateRequest(@NotBlank String name, @NotBlank String role) {}
	public record StatusRequest(@NotNull Boolean active) {}

	public UserController(UserManagementService service) { this.service = service; }

	@GetMapping public List<ManagedUser> all() { return service.list(); }
	@GetMapping("/activities") public List<Activity> activities() { return service.activities(); }
	@PostMapping @ResponseStatus(HttpStatus.CREATED)
	public ManagedUser create(@Valid @RequestBody CreateRequest request, Principal principal) {
		return service.create(request.name(), request.email(), request.role(), request.password(), principal.getName());
	}
	@PutMapping("/{id}")
	public ManagedUser update(@PathVariable Long id, @Valid @RequestBody UpdateRequest request, Principal principal) {
		return service.update(id, request.name(), request.role(), principal.getName());
	}
	@PutMapping("/{id}/status")
	public ManagedUser status(@PathVariable Long id, @Valid @RequestBody StatusRequest request, Principal principal) {
		return service.setActive(id, request.active(), principal.getName());
	}
}
