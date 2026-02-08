package com.hrsaas.organization.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateApprovalRequest {

    private String type;
    private UUID referenceId;
    private String title;
    private String content;

    public static CreateApprovalRequest of(String type, UUID referenceId, String title, String content) {
        return CreateApprovalRequest.builder()
            .type(type)
            .referenceId(referenceId)
            .title(title)
            .content(content)
            .build();
    }
}
