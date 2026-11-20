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
    public static final long MAX_CONTRACT_FILE_SIZE = 10L * 1024 * 1024;
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

    public StoredDocument storeContractDocument(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Selecione um arquivo para anexar.");
        if (file.getSize() > MAX_CONTRACT_FILE_SIZE) throw new IllegalArgumentException("Cada documento pode ter até 10 MB.");
        String original = file.getOriginalFilename() == null ? "" : Path.of(file.getOriginalFilename().replace('\\', '/')).getFileName().toString();
        String lower = original.toLowerCase(Locale.ROOT);
        String extension = lower.lastIndexOf('.') < 0 ? "" : lower.substring(lower.lastIndexOf('.'));
        String contentType = switch (extension) {
            case ".pdf" -> "application/pdf";
            case ".doc" -> "application/msword";
            case ".docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case ".odt" -> "application/vnd.oasis.opendocument.text";
            case ".rtf" -> "application/rtf";
            default -> throw new IllegalArgumentException("Use arquivos PDF, DOC, DOCX, ODT ou RTF.");
        };
        if (original.isBlank()) throw new IllegalArgumentException("O nome do arquivo é inválido.");
        final byte[] bytes;
        try { bytes = file.getBytes(); }
        catch (IOException error) { throw new IllegalArgumentException("Não foi possível ler o documento enviado.", error); }
        if (bytes.length == 0 || bytes.length > MAX_CONTRACT_FILE_SIZE) throw new IllegalArgumentException("Cada documento pode ter até 10 MB.");
        if (!validDocumentSignature(extension, bytes)) throw new IllegalArgumentException("O conteúdo do arquivo não corresponde ao formato informado.");
        String storedName = UUID.randomUUID() + extension;
        Path destination = resolve(storedName);
        try {
            Files.write(destination, bytes);
            return new StoredDocument(storedName, original, contentType, bytes.length);
        } catch (IOException error) {
            throw new IllegalArgumentException("Não foi possível guardar o documento enviado.", error);
        }
    }

    public DocumentFile readDocument(String fileName, String contentType, String originalName) {
        try {
            return new DocumentFile(Files.readAllBytes(resolve(fileName)), contentType, originalName);
        } catch (IOException error) {
            throw new ResourceNotFoundException("Documento não encontrado.");
        }
    }

    public void deleteDocument(String fileName) { deleteImage(fileName); }

    private static boolean validDocumentSignature(String extension, byte[] bytes) {
        if (extension.equals(".pdf")) return bytes.length >= 5 && bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F' && bytes[4] == '-';
        if (extension.equals(".doc")) return bytes.length >= 8 && (bytes[0] & 0xff) == 0xd0 && (bytes[1] & 0xff) == 0xcf && (bytes[2] & 0xff) == 0x11 && (bytes[3] & 0xff) == 0xe0;
        if (extension.equals(".docx") || extension.equals(".odt")) return bytes.length >= 4 && bytes[0] == 'P' && bytes[1] == 'K' && bytes[2] == 3 && bytes[3] == 4;
        return extension.equals(".rtf") && bytes.length >= 5 && bytes[0] == '{' && bytes[1] == '\\' && bytes[2] == 'r' && bytes[3] == 't' && bytes[4] == 'f';
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
    public record StoredDocument(String fileName, String originalName, String contentType, long size) {}
    public record DocumentFile(byte[] bytes, String contentType, String originalName) {}
}
