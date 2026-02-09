package com.hrsaas.employee.config;

import com.hrsaas.common.privacy.EncryptionService;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * JPA AttributeConverter for encrypting/decrypting resident numbers.
 * Handles legacy plaintext data gracefully during migration.
 */
@Component
@Converter(autoApply = false)
public class ResidentNumberConverter implements AttributeConverter<String, String> {

    private static EncryptionService encryptionService;

    @Autowired
    public void init(EncryptionService service) {
        ResidentNumberConverter.encryptionService = service;
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return attribute;
        }
        return encryptionService.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return dbData;
        }
        if (encryptionService.isEncrypted(dbData)) {
            return encryptionService.decrypt(dbData);
        }
        // Legacy plaintext data - return as-is for migration compatibility
        return dbData;
    }
}
