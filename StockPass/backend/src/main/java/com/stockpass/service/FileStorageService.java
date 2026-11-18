package com.stockpass.service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Iterator;
import java.util.Locale;
import java.util.UUID;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {
    public static final long MAX_IMAGE_SIZE = 2L * 1024 * 1024;
    private static final long MAX_IMAGE_PIXELS = 20_000_000L;

    private final Path root;

    public FileStorageService(@Value("${app.uploads.dir:uploads}") String directory) {
        this.root = Path.of(directory).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException error) {
            throw new IllegalStateException("Não foi possível preparar o diretório de imagens.", error);
        }
    }

    public StoredImage storeImage(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Selecione uma imagem.");
        if (file.getSize() > MAX_IMAGE_SIZE) throw new IllegalArgumentException("A imagem deve ter até 2 MB.");

        final byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException error) {
            throw new IllegalArgumentException("Não foi possível ler a imagem enviada.", error);
        }
        if (bytes.length == 0 || bytes.length > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException("A imagem deve ter até 2 MB.");
        }

        String format = detectFormat(bytes);
        String extension = "png".equals(format) ? ".png" : ".jpg";
        String contentType = "png".equals(format) ? "image/png" : "image/jpeg";
        String fileName = UUID.randomUUID() + extension;
        Path destination = resolve(fileName);
        Path temporary = resolve(UUID.randomUUID() + ".tmp");
        try {
            Files.write(temporary, bytes);
            try {
                Files.move(temporary, destination, StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException unsupported) {
                Files.move(temporary, destination);
            }
            return new StoredImage(fileName, contentType);
        } catch (IOException error) {
            try { Files.deleteIfExists(temporary); } catch (IOException ignored) { }
            throw new IllegalArgumentException("Não foi possível guardar a imagem enviada.", error);
        }
    }

    public ImageFile readImage(String fileName) {
        Path path = resolve(fileName);
        try {
            byte[] bytes = Files.readAllBytes(path);
            String contentType = fileName.toLowerCase(Locale.ROOT).endsWith(".png") ? "image/png" : "image/jpeg";
            return new ImageFile(bytes, contentType);
        } catch (IOException error) {
            throw new ResourceNotFoundException("Imagem não encontrada.");
        }
    }

    public void deleteImage(String fileName) {
        if (fileName == null || fileName.isBlank()) return;
        try {
            Files.deleteIfExists(resolve(fileName));
        } catch (IOException error) {
            throw new IllegalStateException("Não foi possível remover a imagem antiga.", error);
        }
    }

    private String detectFormat(byte[] bytes) {
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            if (input == null) throw new IllegalArgumentException("Envie uma imagem JPG ou PNG válida.");
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw new IllegalArgumentException("Envie uma imagem JPG ou PNG válida.");
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, true);
                String format = reader.getFormatName().toLowerCase(Locale.ROOT);
                if (!format.equals("png") && !format.equals("jpeg") && !format.equals("jpg")) {
                    throw new IllegalArgumentException("Apenas imagens JPG e PNG são aceitas.");
                }
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || (long) width * height > MAX_IMAGE_PIXELS) {
                    throw new IllegalArgumentException("A imagem possui dimensões inválidas ou muito grandes.");
                }
                BufferedImage decoded = reader.read(0);
                if (decoded == null || decoded.getWidth() <= 0 || decoded.getHeight() <= 0) {
                    throw new IllegalArgumentException("Envie uma imagem JPG ou PNG válida.");
                }
                return format.equals("png") ? "png" : "jpeg";
            } finally {
                reader.dispose();
            }
        } catch (IOException error) {
            throw new IllegalArgumentException("Envie uma imagem JPG ou PNG válida.", error);
        }
    }

    private Path resolve(String fileName) {
        if (fileName == null || fileName.isBlank()) throw new ResourceNotFoundException("Imagem não encontrada.");
        Path relative = Path.of(fileName);
        Path resolved = root.resolve(relative).normalize();
        if (relative.isAbsolute() || fileName.contains("/") || fileName.contains("\\")
                || relative.getNameCount() != 1 || relative.getFileName() == null
                || !resolved.startsWith(root) || !resolved.getFileName().toString().equals(fileName)) {
            throw new ResourceNotFoundException("Imagem não encontrada.");
        }
        return resolved;
    }

    public record StoredImage(String fileName, String contentType) {}
    public record ImageFile(byte[] bytes, String contentType) {}
}
