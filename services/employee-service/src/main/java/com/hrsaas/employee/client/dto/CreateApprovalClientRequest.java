package com.hrsaas.employee.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateApprovalClientRequest {
    private String documentType;
    private UUID referenceId;
    private String title;
    private String content;
}
