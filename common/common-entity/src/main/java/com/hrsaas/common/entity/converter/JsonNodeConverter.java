package com.hrsaas.common.entity.converter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converts JsonNode to JSONB column.
 */
@Converter
public class JsonNodeConverter implements AttributeConverter<JsonNode, String> {

    private static final ObjectMapper mapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(JsonNode node) {
        if (node == null) {
            return null;
        }
        try {
            return mapper.writeValueAsString(node);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert JsonNode to String", e);
        }
    }

    @Override
    public JsonNode convertToEntityAttribute(String json) {
        if (json == null) {
            return null;
        }
        try {
            return mapper.readTree(json);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert String to JsonNode", e);
        }
    }
}
