package com.hrsaas.employee.service;

import com.hrsaas.employee.domain.dto.request.CreateTransferRequest;
import com.hrsaas.employee.domain.dto.request.UpdateTransferRequest;
import com.hrsaas.employee.domain.dto.response.DepartmentSimpleResponse;
import com.hrsaas.employee.domain.dto.response.GradeSimpleResponse;
import com.hrsaas.employee.domain.dto.response.PositionSimpleResponse;
import com.hrsaas.employee.domain.dto.response.TenantSimpleResponse;
import com.hrsaas.employee.domain.dto.response.TransferRequestResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface TransferService {

    TransferRequestResponse create(CreateTransferRequest request);

    TransferRequestResponse getById(UUID id);

    Page<TransferRequestResponse> getAll(Pageable pageable);

    TransferRequestResponse update(UUID id, UpdateTransferRequest request);

    void delete(UUID id);

    TransferRequestResponse submit(UUID id);

    TransferRequestResponse approveSource(UUID id, UUID approverId, String approverName);

    TransferRequestResponse approveTarget(UUID id, UUID approverId, String approverName);

    TransferRequestResponse reject(UUID id, String reason);

    TransferRequestResponse complete(UUID id);

    TransferRequestResponse cancel(UUID id, String reason);

    TransferSummary getSummary();

    record TransferSummary(
        long pendingOutgoing,
        long pendingIncoming,
        long sourceApproved,
        long completed
    ) {}

    /**
     * 전출 가능한 테넌트 목록 조회
     */
    List<TenantSimpleResponse> getAvailableTenants();

    /**
     * 특정 테넌트의 부서 목록 조회
     */
    List<DepartmentSimpleResponse> getTenantDepartments(String tenantId);

    /**
     * 특정 테넌트의 직위 목록 조회
     */
    List<PositionSimpleResponse> getTenantPositions(String tenantId);

    /**
     * 특정 테넌트의 직급 목록 조회
     */
    List<GradeSimpleResponse> getTenantGrades(String tenantId);
}
