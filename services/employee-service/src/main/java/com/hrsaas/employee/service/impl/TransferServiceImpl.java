package com.hrsaas.employee.service.impl;

import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.core.exception.ValidationException;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.client.OrganizationServiceClient;
import com.hrsaas.employee.client.TenantServiceClient;
import com.hrsaas.employee.client.dto.DepartmentClientResponse;
import com.hrsaas.employee.client.dto.GradeClientResponse;
import com.hrsaas.employee.client.dto.PositionClientResponse;
import com.hrsaas.employee.client.dto.TenantClientResponse;
import com.hrsaas.employee.domain.dto.request.CreateTransferRequest;
import com.hrsaas.employee.domain.dto.request.UpdateTransferRequest;
import com.hrsaas.employee.domain.dto.response.DepartmentSimpleResponse;
import com.hrsaas.employee.domain.dto.response.GradeSimpleResponse;
import com.hrsaas.employee.domain.dto.response.PositionSimpleResponse;
import com.hrsaas.employee.domain.dto.response.TenantSimpleResponse;
import com.hrsaas.employee.domain.dto.response.TransferRequestResponse;
import com.hrsaas.employee.domain.entity.Employee;
import com.hrsaas.employee.domain.entity.TransferRequest;
import com.hrsaas.employee.domain.entity.TransferStatus;
import com.hrsaas.employee.domain.event.TransferCompletedEvent;
import com.hrsaas.employee.repository.EmployeeRepository;
import com.hrsaas.employee.repository.TransferRequestRepository;
import com.hrsaas.employee.service.EmployeeHistoryRecorder;
import com.hrsaas.employee.service.EmployeeNumberGenerator;
import com.hrsaas.employee.service.TransferService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TransferServiceImpl implements TransferService {

    private final TransferRequestRepository transferRequestRepository;
    private final TenantServiceClient tenantServiceClient;
    private final OrganizationServiceClient organizationServiceClient;
    private final EmployeeRepository employeeRepository;
    private final EmployeeNumberGenerator employeeNumberGenerator;
    private final EmployeeHistoryRecorder historyRecorder;
    private final EventPublisher eventPublisher;

    @Override
    @Transactional
    public TransferRequestResponse create(CreateTransferRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();

        TransferRequest transferRequest = TransferRequest.builder()
            .employeeId(request.getEmployeeId())
            .sourceTenantId(tenantId)
            .targetTenantId(request.getTargetTenantId())
            .targetDepartmentId(request.getTargetDepartmentId())
            .targetPositionId(request.getTargetPositionId())
            .targetGradeId(request.getTargetGradeId())
            .transferDate(request.getTransferDate())
            .reason(request.getReason())
            .build();

        TransferRequest saved = transferRequestRepository.save(transferRequest);
        log.info("Transfer request created: id={}, employeeId={}", saved.getId(), saved.getEmployeeId());

        return TransferRequestResponse.from(saved);
    }

    @Override
    public TransferRequestResponse getById(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        TransferRequest request = findByIdAndTenantId(id, tenantId);
        return TransferRequestResponse.from(request);
    }

    @Override
    public Page<TransferRequestResponse> getAll(Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<TransferRequest> requests = transferRequestRepository.findAllByRelatedTenantId(tenantId, pageable);
        return requests.map(TransferRequestResponse::from);
    }

    @Override
    @Transactional
    public TransferRequestResponse update(UUID id, UpdateTransferRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        TransferRequest transferRequest = findByIdAndTenantId(id, tenantId);

        if (!transferRequest.canBeModified()) {
            throw new ValidationException("EMP_020", "수정할 수 없는 상태입니다.");
        }

        transferRequest.update(
            request.getTargetDepartmentId(),
            null, // Department name would be fetched from service
            request.getTargetPositionId(),
            null, // Position name would be fetched from service
            request.getTargetGradeId(),
            null, // Grade name would be fetched from service
            request.getTransferDate(),
            request.getReason()
        );

        TransferRequest saved = transferRequestRepository.save(transferRequest);
        log.info("Transfer request updated: id={}", id);

        return TransferRequestResponse.from(saved);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        TransferRequest request = findByIdAndTenantId(id, tenantId);

        if (!request.canBeDeleted()) {
            throw new ValidationException("EMP_021", "삭제할 수 없는 상태입니다. 임시저장 상태만 삭제 가능합니다.");
        }

        transferRequestRepository.delete(request);
        log.info("Transfer request deleted: id={}", id);
    }

    @Override
    @Transactional
    public TransferRequestResponse submit(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        TransferRequest request = findByIdAndTenantId(id, tenantId);

        if (!request.canBeSubmitted()) {
            throw new ValidationException("EMP_022", "제출할 수 없는 상태입니다.");
        }

        request.submit();
        TransferRequest saved = transferRequestRepository.save(request);
        log.info("Transfer request submitted: id={}", id);

        return TransferRequestResponse.from(saved);
    }

    @Override
    @Transactional
    public TransferRequestResponse approveSource(UUID id, UUID approverId, String approverName) {
        UUID tenantId = TenantContext.getCurrentTenant();
        TransferRequest request = findByIdAndTenantId(id, tenantId);

        if (!request.isPending()) {
            throw new ValidationException("EMP_023", "대기 상태의 요청만 승인할 수 있습니다.");
        }

        request.approveSource(approverId, approverName);
        TransferRequest saved = transferRequestRepository.save(request);
        log.info("Transfer request source approved: id={}, approverId={}", id, approverId);

        return TransferRequestResponse.from(saved);
    }

    @Override
    @Transactional
    public TransferRequestResponse approveTarget(UUID id, UUID approverId, String approverName) {
        UUID tenantId = TenantContext.getCurrentTenant();
        TransferRequest request = findByIdAndTenantId(id, tenantId);

        if (!request.isSourceApproved()) {
            throw new ValidationException("EMP_024", "전출 승인 후에만 전입 승인이 가능합니다.");
        }

        request.approveTarget(approverId, approverName);
        TransferRequest saved = transferRequestRepository.save(request);
        log.info("Transfer request target approved: id={}, approverId={}", id, approverId);

        return TransferRequestResponse.from(saved);
    }

    @Override
    @Transactional
    public TransferRequestResponse reject(UUID id, String reason) {
        UUID tenantId = TenantContext.getCurrentTenant();
        TransferRequest request = findByIdAndTenantId(id, tenantId);

        if (request.getStatus() == TransferStatus.COMPLETED ||
            request.getStatus() == TransferStatus.REJECTED ||
            request.getStatus() == TransferStatus.CANCELLED) {
            throw new ValidationException("EMP_025", "거부할 수 없는 상태입니다.");
        }

        request.reject(reason);
        TransferRequest saved = transferRequestRepository.save(request);
        log.info("Transfer request rejected: id={}, reason={}", id, reason);

        return TransferRequestResponse.from(saved);
    }

    @Override
    @Transactional
    public TransferRequestResponse complete(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        TransferRequest request = findByIdAndTenantId(id, tenantId);

        if (request.getStatus() != TransferStatus.APPROVED) {
            throw new ValidationException("EMP_026", "승인 상태의 요청만 완료 처리할 수 있습니다.");
        }

        // 1. Find source employee
        Employee sourceEmployee = employeeRepository.findById(request.getEmployeeId())
            .orElseThrow(() -> new NotFoundException("EMP_001", "전출 대상 직원을 찾을 수 없습니다: " + request.getEmployeeId()));

        // 2. Switch to target tenant and create new employee
        TenantContext.setCurrentTenant(request.getTargetTenantId());

        String newEmployeeNumber = employeeNumberGenerator.generate(request.getTransferDate());

        Employee targetEmployee = Employee.builder()
            .employeeNumber(newEmployeeNumber)
            .name(sourceEmployee.getName())
            .nameEn(sourceEmployee.getNameEn())
            .email(sourceEmployee.getEmail())
            .phone(sourceEmployee.getPhone())
            .mobile(sourceEmployee.getMobile())
            .departmentId(request.getTargetDepartmentId())
            .positionCode(request.getTargetPositionId() != null ? request.getTargetPositionId().toString() : sourceEmployee.getPositionCode())
            .jobTitleCode(request.getTargetGradeId() != null ? request.getTargetGradeId().toString() : sourceEmployee.getJobTitleCode())
            .hireDate(request.getTransferDate())
            .employmentType(sourceEmployee.getEmploymentType())
            .build();

        Employee savedTarget = employeeRepository.save(targetEmployee);

        // Record hire history in target tenant
        String sourceTenantName = request.getSourceTenantName() != null ? request.getSourceTenantName() : "원 소속";
        historyRecorder.recordHire(savedTarget, "계열사 전입 - " + sourceTenantName);

        // 3. Switch back to source tenant
        TenantContext.setCurrentTenant(request.getSourceTenantId());

        // Resign source employee
        sourceEmployee.resign(request.getTransferDate());
        employeeRepository.save(sourceEmployee);

        // Record resign history in source tenant
        String targetTenantName = request.getTargetTenantName() != null ? request.getTargetTenantName() : "대상 소속";
        historyRecorder.recordResign(sourceEmployee, "계열사 전출 - " + targetTenantName);

        // 4. Complete the transfer request
        request.complete();
        TransferRequest saved = transferRequestRepository.save(request);

        // 5. Publish event
        eventPublisher.publish(TransferCompletedEvent.builder()
            .transferRequestId(saved.getId())
            .sourceEmployeeId(sourceEmployee.getId())
            .targetEmployeeId(savedTarget.getId())
            .sourceTenantId(request.getSourceTenantId())
            .targetTenantId(request.getTargetTenantId())
            .build());

        // Restore original tenant context
        TenantContext.setCurrentTenant(tenantId);

        log.info("Transfer completed: id={}, sourceEmpId={}, targetEmpId={}",
            id, sourceEmployee.getId(), savedTarget.getId());

        return TransferRequestResponse.from(saved);
    }

    @Override
    @Transactional
    public TransferRequestResponse cancel(UUID id, String reason) {
        UUID tenantId = TenantContext.getCurrentTenant();
        TransferRequest request = findByIdAndTenantId(id, tenantId);

        if (request.getStatus() == TransferStatus.COMPLETED) {
            throw new ValidationException("EMP_027", "완료된 요청은 취소할 수 없습니다.");
        }

        request.cancel();
        TransferRequest saved = transferRequestRepository.save(request);
        log.info("Transfer request cancelled: id={}", id);

        return TransferRequestResponse.from(saved);
    }

    @Override
    public TransferSummary getSummary() {
        UUID tenantId = TenantContext.getCurrentTenant();

        long pendingOutgoing = transferRequestRepository.countPendingOutgoingByTenantId(tenantId, TransferStatus.PENDING);
        long pendingIncoming = transferRequestRepository.countPendingIncomingByTenantId(tenantId, TransferStatus.PENDING);
        long sourceApproved = transferRequestRepository.countPendingIncomingByTenantId(tenantId, TransferStatus.SOURCE_APPROVED);
        long completed = transferRequestRepository.findByRelatedTenantIdAndStatus(tenantId, TransferStatus.COMPLETED).size();

        return new TransferSummary(pendingOutgoing, pendingIncoming, sourceApproved, completed);
    }

    private TransferRequest findByIdAndTenantId(UUID id, UUID tenantId) {
        return transferRequestRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new NotFoundException("EMP_028", "전출/전입 요청을 찾을 수 없습니다: " + id));
    }

    @Override
    public List<TenantSimpleResponse> getAvailableTenants() {
        UUID currentTenantId = TenantContext.getCurrentTenant();
        String currentTenantIdStr = currentTenantId != null ? currentTenantId.toString() : "";

        try {
            ApiResponse<PageResponse<TenantClientResponse>> response = tenantServiceClient.getAllTenants();

            if (response == null || response.getData() == null || response.getData().getContent() == null) {
                log.warn("Tenant service returned empty response, using fallback data");
                return getFallbackTenants(currentTenantIdStr);
            }

            return response.getData().getContent().stream()
                .filter(t -> "ACTIVE".equals(t.getStatus()))
                .filter(t -> !t.getId().toString().equals(currentTenantIdStr))
                .map(t -> TenantSimpleResponse.builder()
                    .id(t.getId().toString())
                    .name(t.getName())
                    .code(t.getCode())
                    .build())
                .toList();

        } catch (Exception e) {
            log.error("Failed to fetch tenants from tenant-service, using fallback data", e);
            return getFallbackTenants(currentTenantIdStr);
        }
    }

    private List<TenantSimpleResponse> getFallbackTenants(String excludeTenantId) {
        List<TenantSimpleResponse> fallback = new ArrayList<>();
        fallback.add(TenantSimpleResponse.builder().id("tenant-001").name("그룹 본사").code("HQ").build());
        fallback.add(TenantSimpleResponse.builder().id("tenant-002").name("전자사업부").code("EL").build());
        fallback.add(TenantSimpleResponse.builder().id("tenant-003").name("물산사업부").code("TR").build());
        fallback.add(TenantSimpleResponse.builder().id("tenant-004").name("건설사업부").code("CS").build());
        return fallback.stream()
            .filter(t -> !t.getId().equals(excludeTenantId))
            .toList();
    }

    @Override
    public List<DepartmentSimpleResponse> getTenantDepartments(UUID tenantId) {
        try {
            ApiResponse<List<DepartmentClientResponse>> response =
                organizationServiceClient.getDepartments(tenantId.toString());

            if (response == null || response.getData() == null) {
                log.warn("Organization service returned empty departments, using fallback data for tenant: {}", tenantId);
                return getFallbackDepartments();
            }

            return response.getData().stream()
                .filter(d -> "ACTIVE".equals(d.getStatus()))
                .map(d -> DepartmentSimpleResponse.builder()
                    .id(d.getId().toString())
                    .name(d.getName())
                    .code(d.getCode())
                    .build())
                .toList();

        } catch (Exception e) {
            log.error("Failed to fetch departments from organization-service for tenant: {}", tenantId, e);
            return getFallbackDepartments();
        }
    }

    private List<DepartmentSimpleResponse> getFallbackDepartments() {
        return List.of(
            DepartmentSimpleResponse.builder().id("dept-001").name("개발팀").code("DEV").build(),
            DepartmentSimpleResponse.builder().id("dept-002").name("인사팀").code("HR").build(),
            DepartmentSimpleResponse.builder().id("dept-003").name("재무팀").code("FIN").build(),
            DepartmentSimpleResponse.builder().id("dept-004").name("마케팅팀").code("MKT").build(),
            DepartmentSimpleResponse.builder().id("dept-005").name("영업팀").code("SAL").build()
        );
    }

    @Override
    public List<PositionSimpleResponse> getTenantPositions(UUID tenantId) {
        try {
            ApiResponse<List<PositionClientResponse>> response =
                organizationServiceClient.getPositions(tenantId.toString());

            if (response == null || response.getData() == null) {
                log.warn("Organization service returned empty positions, using fallback data for tenant: {}", tenantId);
                return getFallbackPositions();
            }

            return response.getData().stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .map(p -> PositionSimpleResponse.builder()
                    .id(p.getId().toString())
                    .name(p.getName())
                    .code(p.getCode())
                    .build())
                .toList();

        } catch (Exception e) {
            log.error("Failed to fetch positions from organization-service for tenant: {}", tenantId, e);
            return getFallbackPositions();
        }
    }

    private List<PositionSimpleResponse> getFallbackPositions() {
        return List.of(
            PositionSimpleResponse.builder().id("pos-001").name("팀장").code("TL").build(),
            PositionSimpleResponse.builder().id("pos-002").name("파트장").code("PL").build(),
            PositionSimpleResponse.builder().id("pos-003").name("선임").code("SR").build(),
            PositionSimpleResponse.builder().id("pos-004").name("주임").code("JR").build(),
            PositionSimpleResponse.builder().id("pos-005").name("사원").code("ST").build()
        );
    }

    @Override
    public List<GradeSimpleResponse> getTenantGrades(UUID tenantId) {
        try {
            ApiResponse<List<GradeClientResponse>> response =
                organizationServiceClient.getGrades(tenantId.toString());

            if (response == null || response.getData() == null) {
                log.warn("Organization service returned empty grades, using fallback data for tenant: {}", tenantId);
                return getFallbackGrades();
            }

            return response.getData().stream()
                .filter(g -> Boolean.TRUE.equals(g.getIsActive()))
                .map(g -> GradeSimpleResponse.builder()
                    .id(g.getId().toString())
                    .name(g.getName())
                    .code(g.getCode())
                    .build())
                .toList();

        } catch (Exception e) {
            log.error("Failed to fetch grades from organization-service for tenant: {}", tenantId, e);
            return getFallbackGrades();
        }
    }

    private List<GradeSimpleResponse> getFallbackGrades() {
        return List.of(
            GradeSimpleResponse.builder().id("grade-001").name("부장").code("G1").build(),
            GradeSimpleResponse.builder().id("grade-002").name("차장").code("G2").build(),
            GradeSimpleResponse.builder().id("grade-003").name("과장").code("G3").build(),
            GradeSimpleResponse.builder().id("grade-004").name("대리").code("G4").build(),
            GradeSimpleResponse.builder().id("grade-005").name("사원").code("G5").build()
        );
    }
}
