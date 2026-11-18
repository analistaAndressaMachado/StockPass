package com.stockpass.controller;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.stockpass.model.User;
import com.stockpass.repository.UserRepository;
import com.stockpass.security.JwtService;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ProfilePhotoControllerTest {
    private static final long MAX_IMAGE_SIZE = 2L * 1024 * 1024;

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository users;
    @Autowired private JwtService jwt;
    @Value("${app.uploads.dir}") private String uploadsDirectory;

    private User owner;
    private User otherUser;
    private final Set<String> createdPhotoFiles = new HashSet<>();

    @BeforeEach
    void createUsers() {
        String suffix = UUID.randomUUID().toString();
        owner = createUser("photo-owner-" + suffix + "@stockpass.test");
        otherUser = createUser("photo-other-" + suffix + "@stockpass.test");
    }

    @AfterEach
    void clearTestUploads() throws Exception {
        Path directory = Path.of(uploadsDirectory).toAbsolutePath().normalize();
        Path temporaryRoot = Path.of(System.getProperty("java.io.tmpdir")).toAbsolutePath().normalize();
        Path productionUploads = Path.of("backend", "uploads").toAbsolutePath().normalize();
        if (!directory.startsWith(temporaryRoot) || directory.equals(temporaryRoot)
                || directory.startsWith(productionUploads)) {
            throw new IllegalStateException("O diretório de uploads de teste precisa ficar dentro da pasta temporária.");
        }
        for (String fileName : createdPhotoFiles) {
            Path file = directory.resolve(fileName).normalize();
            if (directory.equals(file.getParent())) Files.deleteIfExists(file);
        }
        createdPhotoFiles.clear();
    }

    @Test
    void uploadsAndServesPngAndJpgOnlyForAuthenticatedRequests() throws Exception {
        String token = token(owner);
        upload(token, "avatar.png", "image/png", imageBytes("png"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.photoUrl").value("/api/media/users/" + owner.getId()));
        mockMvc.perform(get("/api/media/users/{id}", owner.getId()).header("Authorization", bearer(token)))
            .andExpect(status().isOk()).andExpect(content().contentType("image/png"))
            .andExpect(header().string("X-Content-Type-Options", "nosniff"));
        String firstPhoto = users.findById(owner.getId()).orElseThrow().getPhotoPath();
        assertTrue(Files.exists(Path.of(uploadsDirectory, firstPhoto)));

        upload(token, "avatar.jpg", "image/jpeg", imageBytes("jpg"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.photoUrl").value("/api/media/users/" + owner.getId()));
        mockMvc.perform(get("/api/media/users/{id}", owner.getId()).header("Authorization", bearer(token)))
            .andExpect(status().isOk()).andExpect(content().contentType("image/jpeg"))
            .andExpect(header().string("X-Content-Type-Options", "nosniff"));
        assertFalse(Files.exists(Path.of(uploadsDirectory, firstPhoto)));
        assertTrue(Files.exists(Path.of(uploadsDirectory, users.findById(owner.getId()).orElseThrow().getPhotoPath())));
    }

    @Test
    void rejectsFakePngAndImagesLargerThanTwoMegabytes() throws Exception {
        upload(token(owner), "fake.png", "image/png", "not an image".getBytes())
            .andExpect(status().isBadRequest());

        byte[] tooLarge = new byte[(int) MAX_IMAGE_SIZE + 1];
        upload(token(owner), "large.png", "image/png", tooLarge)
            .andExpect(status().isBadRequest());
        assertNull(users.findById(owner.getId()).orElseThrow().getPhotoPath());
    }

    @Test
    void uploadWithoutAuthenticationIsDenied() throws Exception {
        upload(null, "avatar.png", "image/png", imageBytes("png"))
            .andExpect(status().isForbidden());
        assertNull(users.findById(owner.getId()).orElseThrow().getPhotoPath());
    }

    @Test
    void authenticatedUserCanOnlyChangeTheirOwnPhoto() throws Exception {
        upload(token(owner), "avatar.png", "image/png", imageBytes("png"))
            .andExpect(status().isOk());
        assertTrue(users.findById(owner.getId()).orElseThrow().getPhotoPath() != null);
        assertNull(users.findById(otherUser.getId()).orElseThrow().getPhotoPath());
    }

    @Test
    void removesPhotoAndClearsProfileReference() throws Exception {
        upload(token(owner), "avatar.png", "image/png", imageBytes("png"))
            .andExpect(status().isOk());
        String savedFile = users.findById(owner.getId()).orElseThrow().getPhotoPath();
        assertTrue(Files.exists(Path.of(uploadsDirectory, savedFile)));

        mockMvc.perform(delete("/api/auth/profile/photo").header("Authorization", bearer(token(owner))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.photoUrl").value(org.hamcrest.Matchers.nullValue()));
        assertNull(users.findById(owner.getId()).orElseThrow().getPhotoPath());
        assertFalse(Files.exists(Path.of(uploadsDirectory, savedFile)));
    }

    @Test
    void imageReadRequiresAuthentication() throws Exception {
        upload(token(owner), "avatar.png", "image/png", imageBytes("png"))
            .andExpect(status().isOk());
        mockMvc.perform(get("/api/media/users/{id}", owner.getId()))
            .andExpect(status().isForbidden());
    }

    private org.springframework.test.web.servlet.ResultActions upload(
            String token, String originalName, String contentType, byte[] bytes) throws Exception {
        var request = multipart(HttpMethod.PUT, "/api/auth/profile/photo")
            .file(new MockMultipartFile("file", originalName, contentType, bytes));
        if (token != null) request.header("Authorization", bearer(token));
        String previousPhoto = users.findById(owner.getId()).orElseThrow().getPhotoPath();
        if (previousPhoto != null) createdPhotoFiles.add(previousPhoto);
        var result = mockMvc.perform(request);
        String currentPhoto = users.findById(owner.getId()).orElseThrow().getPhotoPath();
        if (currentPhoto != null) createdPhotoFiles.add(currentPhoto);
        return result;
    }

    private User createUser(String email) {
        User user = new User();
        user.setName("Usuário de teste");
        user.setEmail(email);
        user.setPassword("encoded-password");
        user.setRole("USER");
        return users.save(user);
    }

    private String token(User user) {
        return jwt.generate(user.getEmail());
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }

    private static byte[] imageBytes(String format) throws Exception {
        BufferedImage image = new BufferedImage(8, 8, BufferedImage.TYPE_INT_RGB);
        var graphics = image.createGraphics();
        graphics.setColor(Color.BLUE);
        graphics.fillRect(0, 0, image.getWidth(), image.getHeight());
        graphics.dispose();
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, format, output);
        return output.toByteArray();
    }
}
