package com.hrsaas.common.entity.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Arrays;
import java.util.List;

/**
 * Converts List<String> to TEXT[] column.
 */
@Converter
public class StringListConverter implements AttributeConverter<List<String>, String[]> {

    @Override
    public String[] convertToDatabaseColumn(List<String> list) {
        if (list == null) {
            return null;
        }
        return list.toArray(new String[0]);
    }

    @Override
    public List<String> convertToEntityAttribute(String[] array) {
        if (array == null) {
            return null;
        }
        return Arrays.asList(array);
    }
}
