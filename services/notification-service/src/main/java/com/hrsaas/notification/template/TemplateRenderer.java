package com.hrsaas.notification.template;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Renders notification templates with variable substitution.
 */
@Slf4j
@Component
public class TemplateRenderer {

    private static final Pattern VARIABLE_PATTERN = Pattern.compile("\\{\\{\\s*([^}]+)\\s*}}");

    /**
     * Renders a template string with the given variables.
     *
     * @param template  The template string with {{variable}} placeholders
     * @param variables Map of variable names to values
     * @return The rendered string
     */
    public String render(String template, Map<String, Object> variables) {
        if (template == null || template.isBlank()) {
            return template;
        }

        if (variables == null || variables.isEmpty()) {
            return template;
        }

        StringBuffer result = new StringBuffer();
        Matcher matcher = VARIABLE_PATTERN.matcher(template);

        while (matcher.find()) {
            String variableName = matcher.group(1).trim();
            Object value = resolveVariable(variableName, variables);
            String replacement = value != null ? Matcher.quoteReplacement(value.toString()) : "";
            matcher.appendReplacement(result, replacement);
        }
        matcher.appendTail(result);

        return result.toString();
    }

    /**
     * Resolves a variable from the map, supporting nested properties using dot notation.
     * e.g., "employee.name" will look for employee object and get its name property.
     */
    private Object resolveVariable(String variableName, Map<String, Object> variables) {
        if (!variableName.contains(".")) {
            return variables.get(variableName);
        }

        String[] parts = variableName.split("\\.");
        Object current = variables.get(parts[0]);

        for (int i = 1; i < parts.length && current != null; i++) {
            if (current instanceof Map) {
                current = ((Map<?, ?>) current).get(parts[i]);
            } else {
                // Try to get property via reflection
                try {
                    java.lang.reflect.Method getter = current.getClass()
                        .getMethod("get" + capitalize(parts[i]));
                    current = getter.invoke(current);
                } catch (Exception e) {
                    log.debug("Could not resolve nested property: {}", variableName);
                    return null;
                }
            }
        }

        return current;
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        return Character.toUpperCase(str.charAt(0)) + str.substring(1);
    }
}
