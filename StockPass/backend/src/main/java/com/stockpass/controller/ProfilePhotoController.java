package com.stockpass.controller;

import com.stockpass.dto.AuthDtos.UserResponse;
import com.stockpass.service.ProfilePhotoService;
import java.security.Principal;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/auth/profile/photo")
public class ProfilePhotoController {
    private final ProfilePhotoService photos;

    public ProfilePhotoController(ProfilePhotoService photos) {
        this.photos = photos;
    }

    @PutMapping
    public UserResponse upload(Principal principal, @RequestParam("file") MultipartFile file) {
        return photos.upload(principal.getName(), file);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.OK)
    public UserResponse remove(Principal principal) {
        return photos.remove(principal.getName());
    }
}
