package com.hrsaas.approval.service;

import com.hrsaas.approval.domain.dto.request.CreateApprovalTemplateRequest;
import com.hrsaas.approval.domain.dto.request.UpdateApprovalTemplateRequest;
import com.hrsaas.approval.domain.dto.response.ApprovalTemplateResponse;

import java.util.List;
import java.util.UUID;

public interface ApprovalTemplateService {

    ApprovalTemplateResponse create(CreateApprovalTemplateRequest request);

    ApprovalTemplateResponse getById(UUID id);

    ApprovalTemplateResponse getByCode(String code);

    List<ApprovalTemplateResponse> getAll();

    List<ApprovalTemplateResponse> getActive();

    List<ApprovalTemplateResponse> getByDocumentType(String documentType);

    ApprovalTemplateResponse update(UUID id, UpdateApprovalTemplateRequest request);

    void delete(UUID id);
}
