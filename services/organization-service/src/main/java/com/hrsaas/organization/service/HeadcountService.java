package com.hrsaas.organization.service;

import com.hrsaas.organization.domain.dto.request.CreateHeadcountPlanRequest;
import com.hrsaas.organization.domain.dto.request.CreateHeadcountRequestRequest;
import com.hrsaas.organization.domain.dto.request.UpdateHeadcountPlanRequest;
import com.hrsaas.organization.domain.dto.request.UpdateHeadcountRequestRequest;
import com.hrsaas.organization.domain.dto.response.HeadcountPlanResponse;
import com.hrsaas.organization.domain.dto.response.HeadcountRequestResponse;
import com.hrsaas.organization.domain.dto.response.HeadcountSummaryResponse;
import com.hrsaas.organization.domain.entity.HeadcountRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface HeadcountService {

    // Plan operations
    HeadcountPlanResponse createPlan(CreateHeadcountPlanRequest request);

    HeadcountPlanResponse getPlanById(UUID id);

    List<HeadcountPlanResponse> getPlansByYear(Integer year);

    HeadcountPlanResponse updatePlan(UUID id, UpdateHeadcountPlanRequest request);

    void deletePlan(UUID id);

    // Request operations
    HeadcountRequestResponse createRequest(CreateHeadcountRequestRequest request);

    HeadcountRequestResponse getRequestById(UUID id);

    Page<HeadcountRequestResponse> getAllRequests(Pageable pageable);

    List<HeadcountRequestResponse> getRequestsByStatus(HeadcountRequestStatus status);

    List<HeadcountRequestResponse> getRequestsByDepartment(UUID departmentId);

    HeadcountRequestResponse updateRequest(UUID id, UpdateHeadcountRequestRequest request);

    void deleteRequest(UUID id);

    void submitRequest(UUID id);

    void cancelRequest(UUID id);

    // Approval operations
    HeadcountPlanResponse approvePlan(UUID id);

    HeadcountRequestResponse approveRequest(UUID id);

    HeadcountRequestResponse rejectRequest(UUID id, String reason);

    // Summary
    HeadcountSummaryResponse getSummary(Integer year);
}
