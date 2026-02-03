package com.hrsaas.common.privacy;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Service for encrypting and decrypting sensitive data using AES-GCM.
 */
@Slf4j
@Service
public class EncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    private final SecretKey secretKey;

    public EncryptionService(@Value("${app.encryption.key:#{null}}") String encodedKey) {
        if (encodedKey != null && !encodedKey.isBlank()) {
            byte[] decodedKey = Base64.getDecoder().decode(encodedKey);
            this.secretKey = new SecretKeySpec(decodedKey, "AES");
        } else {
            // Generate a random key for development (NOT for production)
            log.warn("No encryption key provided. Using random key. This is NOT suitable for production!");
            byte[] key = new byte[32]; // 256-bit key
            new SecureRandom().nextBytes(key);
            this.secretKey = new SecretKeySpec(key, "AES");
        }
    }

    /**
     * Encrypt plaintext using AES-GCM.
     * Returns Base64-encoded string containing IV + ciphertext.
     */
    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isEmpty()) {
            return plaintext;
        }

        try {
            // Generate random IV
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            // Initialize cipher
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec);

            // Encrypt
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            // Combine IV and ciphertext
            ByteBuffer buffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            buffer.put(iv);
            buffer.put(ciphertext);

            return Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception e) {
            log.error("Encryption failed", e);
            throw new RuntimeException("Encryption failed", e);
        }
    }

    /**
     * Decrypt ciphertext using AES-GCM.
     */
    public String decrypt(String encryptedText) {
        if (encryptedText == null || encryptedText.isEmpty()) {
            return encryptedText;
        }

        try {
            byte[] decoded = Base64.getDecoder().decode(encryptedText);

            // Extract IV and ciphertext
            ByteBuffer buffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[GCM_IV_LENGTH];
            buffer.get(iv);
            byte[] ciphertext = new byte[buffer.remaining()];
            buffer.get(ciphertext);

            // Initialize cipher
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);

            // Decrypt
            byte[] plaintext = cipher.doFinal(ciphertext);
            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Decryption failed", e);
            throw new RuntimeException("Decryption failed", e);
        }
    }

    /**
     * Check if a value appears to be encrypted (Base64 format).
     */
    public boolean isEncrypted(String value) {
        if (value == null || value.isEmpty()) {
            return false;
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(value);
            return decoded.length > GCM_IV_LENGTH;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
