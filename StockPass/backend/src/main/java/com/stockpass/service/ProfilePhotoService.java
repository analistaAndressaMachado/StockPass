package com.stockpass.service;

import com.stockpass.dto.AuthDtos.UserResponse;
import com.stockpass.model.User;
import com.stockpass.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ProfilePhotoService {
    private final UserRepository users;
    private final FileStorageService storage;

    public ProfilePhotoService(UserRepository users, FileStorageService storage) {
        this.users = users;
        this.storage = storage;
    }

    public UserResponse upload(String principalEmail, MultipartFile file) {
        User user = findUser(principalEmail);
        String oldFile = user.getPhotoPath();
        FileStorageService.StoredImage savedFile = storage.storeImage(file);
        user.setPhotoPath(savedFile.fileName());
        UserResponse response;
        try {
            response = toResponse(users.saveAndFlush(user));
        } catch (RuntimeException error) {
            storage.deleteImage(savedFile.fileName());
            throw error;
        }
        storage.deleteImage(oldFile);
        return response;
    }

    public UserResponse remove(String principalEmail) {
        User user = findUser(principalEmail);
        String oldFile = user.getPhotoPath();
        user.setPhotoPath(null);
        UserResponse response = toResponse(users.saveAndFlush(user));
        storage.deleteImage(oldFile);
        return response;
    }

    public FileStorageService.ImageFile imageForUser(Long userId) {
        User user = users.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Imagem não encontrada."));
        if (user.getPhotoPath() == null || user.getPhotoPath().isBlank()) {
            throw new ResourceNotFoundException("Imagem não encontrada.");
        }
        return storage.readImage(user.getPhotoPath());
    }

    private User findUser(String principalEmail) {
        return users.findByEmailIgnoreCase(principalEmail)
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
    }

    private UserResponse toResponse(User user) {
        String photoUrl = user.getPhotoPath() == null ? null : "/api/media/users/" + user.getId();
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(),
            user.getCompanyName(), user.getTaxId(), user.getPhone(), photoUrl,
            com.stockpass.security.PermissionPolicy.effective(user));
    }
}
