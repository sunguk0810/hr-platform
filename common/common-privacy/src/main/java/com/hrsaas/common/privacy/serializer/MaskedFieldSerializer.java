package com.hrsaas.common.privacy.serializer;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.BeanProperty;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.ContextualSerializer;
import com.hrsaas.common.privacy.Masked;
import com.hrsaas.common.privacy.MaskType;
import com.hrsaas.common.privacy.MaskingService;
import com.hrsaas.common.privacy.PrivacyContext;

import java.io.IOException;

/**
 * Jackson serializer that applies masking to fields annotated with @Masked.
 * Masking is applied based on the user's role and context:
 * - HR_ADMIN, SUPER_ADMIN: See original values
 * - User viewing own data: See original values
 * - Others: See masked values
 */
public class MaskedFieldSerializer extends JsonSerializer<String> implements ContextualSerializer {

    private final MaskingService maskingService;
    private final MaskType maskType;
    private final int visibleChars;

    /**
     * Default constructor for Jackson.
     */
    public MaskedFieldSerializer() {
        this.maskingService = new MaskingService();
        this.maskType = MaskType.GENERIC;
        this.visibleChars = 2;
    }

    /**
     * Constructor with specific mask type.
     */
    public MaskedFieldSerializer(MaskingService maskingService, MaskType maskType, int visibleChars) {
        this.maskingService = maskingService;
        this.maskType = maskType;
        this.visibleChars = visibleChars;
    }

    @Override
    public void serialize(String value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        if (value == null) {
            gen.writeNull();
            return;
        }

        // Check if masking should be skipped
        if (!PrivacyContext.shouldApplyMasking()) {
            gen.writeString(value);
            return;
        }

        // Apply masking based on type
        String maskedValue = applyMasking(value);
        gen.writeString(maskedValue);
    }

    private String applyMasking(String value) {
        return switch (maskType) {
            case NAME -> maskingService.maskName(value);
            case EMAIL -> maskingService.maskEmail(value);
            case PHONE -> maskingService.maskPhone(value);
            case RESIDENT_NUMBER -> maskingService.maskResidentNumber(value);
            case ACCOUNT_NUMBER -> maskingService.maskAccountNumber(value);
            case ADDRESS -> maskingService.maskAddress(value);
            case CARD_NUMBER -> maskingService.maskCardNumber(value);
            case GENERIC -> maskingService.maskGeneric(value, visibleChars);
        };
    }

    @Override
    public JsonSerializer<?> createContextual(SerializerProvider prov, BeanProperty property)
            throws JsonMappingException {
        if (property == null) {
            return this;
        }

        Masked masked = property.getAnnotation(Masked.class);
        if (masked == null) {
            masked = property.getContextAnnotation(Masked.class);
        }

        if (masked != null) {
            return new MaskedFieldSerializer(maskingService, masked.type(), masked.visibleChars());
        }

        return this;
    }
}
