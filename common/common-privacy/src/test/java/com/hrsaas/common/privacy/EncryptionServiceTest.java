package com.hrsaas.common.privacy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.security.SecureRandom;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("EncryptionService Tests")
class EncryptionServiceTest {

    private EncryptionService encryptionService;
    private String validKey;

    @BeforeEach
    void setUp() {
        // Generate a valid 128-bit AES key for testing
        byte[] key = new byte[16];
        new SecureRandom().nextBytes(key);
        validKey = Base64.getEncoder().encodeToString(key);
        encryptionService = new EncryptionService(validKey);
    }

    @Nested
    @DisplayName("Constructor")
    class Constructor {

        @Test
        @DisplayName("Valid key provided: uses provided key")
        void constructor_validKey_success() {
            EncryptionService service = new EncryptionService(validKey);
            String plaintext = "test";
            String encrypted = service.encrypt(plaintext);
            assertThat(service.decrypt(encrypted)).isEqualTo(plaintext);
        }

        @Test
        @DisplayName("Null key: uses random key")
        void constructor_nullKey_usesRandomKey() {
            EncryptionService service = new EncryptionService(null);
            String plaintext = "test";
            String encrypted = service.encrypt(plaintext);
            // Even with random key, decrypt should work for the same instance
            assertThat(service.decrypt(encrypted)).isEqualTo(plaintext);
        }

        @Test
        @DisplayName("Empty key: uses random key")
        void constructor_emptyKey_usesRandomKey() {
            EncryptionService service = new EncryptionService("");
            String plaintext = "test";
            String encrypted = service.encrypt(plaintext);
            assertThat(service.decrypt(encrypted)).isEqualTo(plaintext);
        }
    }

    @Nested
    @DisplayName("Encrypt")
    class Encrypt {

        @Test
        @DisplayName("Valid string: returns encrypted Base64 string")
        void encrypt_validString_returnsEncrypted() {
            String plaintext = "Hello World";
            String encrypted = encryptionService.encrypt(plaintext);

            assertThat(encrypted).isNotNull();
            assertThat(encrypted).isNotEqualTo(plaintext);
            // Should be Base64
            assertThat(Base64.getDecoder().decode(encrypted)).isNotEmpty();
        }

        @Test
        @DisplayName("Different IVs: same input produces different output")
        void encrypt_sameInput_producesDifferentOutput() {
            String plaintext = "Hello World";
            String encrypted1 = encryptionService.encrypt(plaintext);
            String encrypted2 = encryptionService.encrypt(plaintext);

            assertThat(encrypted1).isNotEqualTo(encrypted2);
        }

        @Test
        @DisplayName("Null input: returns null")
        void encrypt_null_returnsNull() {
            assertThat(encryptionService.encrypt(null)).isNull();
        }

        @Test
        @DisplayName("Empty input: returns empty")
        void encrypt_empty_returnsEmpty() {
            assertThat(encryptionService.encrypt("")).isEmpty();
        }
    }

    @Nested
    @DisplayName("Decrypt")
    class Decrypt {

        @Test
        @DisplayName("Valid encrypted string: returns original plaintext")
        void decrypt_validEncrypted_returnsPlaintext() {
            String plaintext = "Sensitive Data 123";
            String encrypted = encryptionService.encrypt(plaintext);
            String decrypted = encryptionService.decrypt(encrypted);

            assertThat(decrypted).isEqualTo(plaintext);
        }

        @Test
        @DisplayName("Null input: returns null")
        void decrypt_null_returnsNull() {
            assertThat(encryptionService.decrypt(null)).isNull();
        }

        @Test
        @DisplayName("Empty input: returns empty")
        void decrypt_empty_returnsEmpty() {
            assertThat(encryptionService.decrypt("")).isEmpty();
        }

        @Test
        @DisplayName("Invalid Base64: throws RuntimeException")
        void decrypt_invalidBase64_throwsException() {
            assertThatThrownBy(() -> encryptionService.decrypt("NotBase64!!"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Decryption failed");
        }

        @Test
        @DisplayName("Tampered ciphertext: throws RuntimeException")
        void decrypt_tamperedCiphertext_throwsException() {
            String plaintext = "test";
            String encrypted = encryptionService.encrypt(plaintext);

            // A simpler way to tamper is to decode, modify bytes, and re-encode
            byte[] bytes = Base64.getDecoder().decode(encrypted);
            bytes[bytes.length - 1] ^= 1; // Flip a bit in the tag
            String tamperedBase64 = Base64.getEncoder().encodeToString(bytes);

            assertThatThrownBy(() -> encryptionService.decrypt(tamperedBase64))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Decryption failed");
        }
    }

    @Nested
    @DisplayName("IsEncrypted")
    class IsEncrypted {

        @Test
        @DisplayName("Valid encrypted string: returns true")
        void isEncrypted_validEncrypted_returnsTrue() {
            String encrypted = encryptionService.encrypt("test");
            assertThat(encryptionService.isEncrypted(encrypted)).isTrue();
        }

        @Test
        @DisplayName("Not Base64: returns false")
        void isEncrypted_notBase64_returnsFalse() {
            assertThat(encryptionService.isEncrypted("NotBase64!!")).isFalse();
        }

        @Test
        @DisplayName("Short Base64 (less than IV length): returns false")
        void isEncrypted_shortBase64_returnsFalse() {
            // "test" in base64 is "dGVzdA==", which decodes to 4 bytes. IV length is 12.
            String shortBase64 = Base64.getEncoder().encodeToString("test".getBytes());
            assertThat(encryptionService.isEncrypted(shortBase64)).isFalse();
        }

        @Test
        @DisplayName("Null input: returns false")
        void isEncrypted_null_returnsFalse() {
            assertThat(encryptionService.isEncrypted(null)).isFalse();
        }

        @Test
        @DisplayName("Empty input: returns false")
        void isEncrypted_empty_returnsFalse() {
            assertThat(encryptionService.isEncrypted("")).isFalse();
        }
    }
}
