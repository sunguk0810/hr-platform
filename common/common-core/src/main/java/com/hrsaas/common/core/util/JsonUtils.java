package com.hrsaas.common.core.util;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

/**
 * JSON utility methods using Jackson.
 */
public final class JsonUtils {

    private static final ObjectMapper objectMapper = createObjectMapper();

    private JsonUtils() {
        // Utility class
    }

    private static ObjectMapper createObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        return mapper;
    }

    public static ObjectMapper getObjectMapper() {
        return objectMapper;
    }

    public static String toJson(Object obj) {
        if (obj == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON serialization failed", e);
        }
    }

    public static String toPrettyJson(Object obj) {
        if (obj == null) {
            return null;
        }
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON serialization failed", e);
        }
    }

    public static <T> T fromJson(String json, Class<T> clazz) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, clazz);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON deserialization failed", e);
        }
    }

    public static <T> T fromJson(String json, TypeReference<T> typeRef) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, typeRef);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON deserialization failed", e);
        }
    }

    public static JsonNode toJsonNode(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readTree(json);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON parsing failed", e);
        }
    }

    public static <T> T convertValue(Object fromValue, Class<T> toValueType) {
        return objectMapper.convertValue(fromValue, toValueType);
    }

    public static <T> T convertValue(Object fromValue, TypeReference<T> toValueTypeRef) {
        return objectMapper.convertValue(fromValue, toValueTypeRef);
    }
}
