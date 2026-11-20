package com.stockpass.controller;

import com.stockpass.service.FileStorageService.ImageFile;
import com.stockpass.service.ProfilePhotoService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/media")
public class MediaController {
    private final ProfilePhotoService photos;

    public MediaController(ProfilePhotoService photos) {
        this.photos = photos;
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<byte[]> userPhoto(@PathVariable Long id) {
        ImageFile image = photos.imageForUser(id);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(image.contentType()))
            .header("X-Content-Type-Options", "nosniff")
            .cacheControl(CacheControl.noStore())
            .body(image.bytes());
    }
}
