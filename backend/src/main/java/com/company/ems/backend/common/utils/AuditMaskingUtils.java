package com.company.ems.backend.common.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AuditMaskingUtils {

    private static final Logger log = LoggerFactory.getLogger(AuditMaskingUtils.class);
    private static final ObjectMapper mapper = new ObjectMapper();

    static {
        mapper.registerModule(new JavaTimeModule());
    }

    private static final String[] SENSITIVE_FIELDS = {
            "nationalId", "salary", "bankAccountNumber", "socialSecurityNumber", "taxId", "password"
    };

    /**
     * Converts an object to JSON string while masking sensitive fields.
     */
    public static String serializeAndMask(Object data) {
        if (data == null) {
            return null;
        }
        try {
            JsonNode root = mapper.valueToTree(data);
            maskSensitiveNode(root);
            return mapper.writeValueAsString(root);
        } catch (Exception ex) {
            log.warn("Failed to serialize or mask audit payload of type {}: {}", data.getClass(), ex.getMessage());
            return "{\"error\": \"Failed to serialize payload\"}";
        }
    }

    private static void maskSensitiveNode(JsonNode node) {
        if (node.isObject()) {
            ObjectNode objectNode = (ObjectNode) node;

            for (String field : SENSITIVE_FIELDS) {
                if (objectNode.has(field) && !objectNode.get(field).isNull()) {
                    String val = objectNode.get(field).asText();
                    objectNode.put(field, maskString(val));
                }
            }

            // Recursive
            objectNode.fields().forEachRemaining(entry -> maskSensitiveNode(entry.getValue()));
        } else if (node.isArray()) {
            for (JsonNode child : node) {
                maskSensitiveNode(child);
            }
        }
    }

    private static String maskString(String value) {
        if (value == null || value.length() == 0)
            return value;
        if (value.length() <= 4)
            return "****";
        return value.substring(0, 2) + "***" + value.substring(value.length() - 2);
    }
}
