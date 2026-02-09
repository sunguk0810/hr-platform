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
public class ApprovalDocumentClientResponse {
    private UUID approvalId;
    private String status;
}
