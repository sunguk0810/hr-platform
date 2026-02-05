package com.hrsaas.employee.service;

import com.hrsaas.employee.domain.dto.request.CreateCondolencePolicyRequest;
import com.hrsaas.employee.domain.dto.request.CreateCondolenceRequest;
import com.hrsaas.employee.domain.dto.request.UpdateCondolencePolicyRequest;
import com.hrsaas.employee.domain.dto.request.UpdateCondolenceRequest;
import com.hrsaas.employee.domain.dto.response.CondolencePolicyResponse;
import com.hrsaas.employee.domain.dto.response.CondolenceRequestResponse;
import com.hrsaas.employee.domain.entity.CondolenceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface CondolenceService {

    // Request operations
    CondolenceRequestResponse createRequest(CreateCondolenceRequest request);

    CondolenceRequestResponse getRequestById(UUID id);

    Page<CondolenceRequestResponse> getAllRequests(Pageable pageable);

    List<CondolenceRequestResponse> getMyRequests();

    List<CondolenceRequestResponse> getRequestsByStatus(CondolenceStatus status);

    CondolenceRequestResponse updateRequest(UUID id, UpdateCondolenceRequest request);

    void deleteRequest(UUID id);

    void cancelRequest(UUID id);

    CondolenceRequestResponse approveRequest(UUID id);

    CondolenceRequestResponse rejectRequest(UUID id, String reason);

    // Policy operations
    CondolencePolicyResponse createPolicy(CreateCondolencePolicyRequest request);

    CondolencePolicyResponse getPolicyById(UUID id);

    List<CondolencePolicyResponse> getAllPolicies();

    List<CondolencePolicyResponse> getActivePolicies();

    CondolencePolicyResponse updatePolicy(UUID id, UpdateCondolencePolicyRequest request);

    void deletePolicy(UUID id);
}
