package com.hrsaas.appointment.service.impl;

import com.hrsaas.appointment.client.EmployeeClient;
import com.hrsaas.appointment.domain.dto.request.*;
import com.hrsaas.appointment.domain.dto.response.AppointmentDraftResponse;
import com.hrsaas.appointment.domain.entity.*;
import com.hrsaas.appointment.domain.event.AppointmentExecutedEvent;
import com.hrsaas.appointment.repository.*;
import com.hrsaas.appointment.service.AppointmentDraftService;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.hrsaas.common.event.EventPublisher;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Year;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AppointmentDraftServiceImpl implements AppointmentDraftService {

    private final AppointmentDraftRepository draftRepository;
    private final AppointmentDetailRepository detailRepository;
    private final AppointmentHistoryRepository historyRepository;
    private final AppointmentScheduleRepository scheduleRepository;
    private final EventPublisher eventPublisher;
    private final Optional<EmployeeClient> employeeClient;

    @Override
    @Transactional
    @CacheEvict(value = "appointment:draft", allEntries = true)
    public AppointmentDraftResponse create(CreateAppointmentDraftRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();

        String draftNumber = generateDraftNumber(tenantId);

        AppointmentDraft draft = AppointmentDraft.builder()
            .draftNumber(draftNumber)
            .title(request.getTitle())
            .effectiveDate(request.getEffectiveDate())
            .description(request.getDescription())
            .build();

        for (CreateAppointmentDetailRequest detailRequest : request.getDetails()) {
            AppointmentDetail detail = createDetail(detailRequest);
            draft.addDetail(detail);
        }

        AppointmentDraft saved = draftRepository.save(draft);
        log.info("Appointment draft created: draftNumber={}, detailCount={}",
                 draftNumber, saved.getDetails().size());

        return AppointmentDraftResponse.fromWithDetails(saved);
    }

    @Override
    public AppointmentDraftResponse getById(UUID id) {
        AppointmentDraft draft = findById(id);
        return AppointmentDraftResponse.fromWithDetails(draft);
    }

    @Override
    public AppointmentDraftResponse getByDraftNumber(String draftNumber) {
        UUID tenantId = TenantContext.getCurrentTenant();
        AppointmentDraft draft = draftRepository.findByTenantIdAndDraftNumber(tenantId, draftNumber)
            .orElseThrow(() -> new NotFoundException("APT_001", "발령안을 찾을 수 없습니다: " + draftNumber));
        return AppointmentDraftResponse.fromWithDetails(draft);
    }

    @Override
    public Page<AppointmentDraftResponse> search(DraftStatus status, LocalDate startDate,
                                                  LocalDate endDate, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();

        Page<AppointmentDraft> page;
        if (status != null) {
            page = draftRepository.findByTenantIdAndStatus(tenantId, status, pageable);
        } else if (startDate != null && endDate != null) {
            page = draftRepository.findByTenantIdAndEffectiveDateBetween(tenantId, startDate, endDate, pageable);
        } else {
            page = draftRepository.findByTenantId(tenantId, pageable);
        }

        return page.map(AppointmentDraftResponse::from);
    }

    @Override
    @Transactional
    @CacheEvict(value = "appointment:draft", allEntries = true)
    public AppointmentDraftResponse update(UUID id, UpdateAppointmentDraftRequest request) {
        AppointmentDraft draft = findById(id);

        if (!draft.isEditable()) {
            throw new BusinessException("APT_002", "수정할 수 없는 상태입니다: " + draft.getStatus());
        }

        if (request.getTitle() != null) {
            draft.setTitle(request.getTitle());
        }
        if (request.getEffectiveDate() != null) {
            draft.setEffectiveDate(request.getEffectiveDate());
        }
        if (request.getDescription() != null) {
            draft.setDescription(request.getDescription());
        }

        AppointmentDraft saved = draftRepository.save(draft);
        log.info("Appointment draft updated: id={}", id);

        return AppointmentDraftResponse.fromWithDetails(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "appointment:draft", allEntries = true)
    public void delete(UUID id) {
        AppointmentDraft draft = findById(id);

        if (!draft.isEditable()) {
            throw new BusinessException("APT_002", "삭제할 수 없는 상태입니다: " + draft.getStatus());
        }

        draftRepository.delete(draft);
        log.info("Appointment draft deleted: id={}", id);
    }

    @Override
    @Transactional
    @CacheEvict(value = "appointment:draft", allEntries = true)
    public AppointmentDraftResponse addDetail(UUID draftId, CreateAppointmentDetailRequest request) {
        AppointmentDraft draft = findById(draftId);

        if (!draft.isEditable()) {
            throw new BusinessException("APT_002", "수정할 수 없는 상태입니다");
        }

        if (detailRepository.existsByDraftIdAndEmployeeIdAndAppointmentType(
                draftId, request.getEmployeeId(), request.getAppointmentType())) {
            throw new BusinessException("APT_003", "이미 동일한 발령 유형이 존재합니다");
        }

        AppointmentDetail detail = createDetail(request);
        draft.addDetail(detail);

        AppointmentDraft saved = draftRepository.save(draft);
        log.info("Appointment detail added: draftId={}, employeeId={}", draftId, request.getEmployeeId());

        return AppointmentDraftResponse.fromWithDetails(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "appointment:draft", allEntries = true)
    public void removeDetail(UUID draftId, UUID detailId) {
        AppointmentDraft draft = findById(draftId);

        if (!draft.isEditable()) {
            throw new BusinessException("APT_002", "수정할 수 없는 상태입니다");
        }

        AppointmentDetail detail = detailRepository.findById(detailId)
            .orElseThrow(() -> new NotFoundException("APT_004", "발령 상세를 찾을 수 없습니다"));

        draft.removeDetail(detail);
        detailRepository.delete(detail);

        log.info("Appointment detail removed: draftId={}, detailId={}", draftId, detailId);
    }

    @Override
    @Transactional
    @CacheEvict(value = "appointment:draft", allEntries = true)
    public AppointmentDraftResponse submit(UUID id) {
        AppointmentDraft draft = findById(id);

        if (draft.getStatus() != DraftStatus.DRAFT && draft.getStatus() != DraftStatus.REJECTED) {
            throw new BusinessException("APT_005", "결재 요청할 수 없는 상태입니다");
        }

        if (draft.getDetails().isEmpty()) {
            throw new BusinessException("APT_006", "발령 상세가 없습니다");
        }

        // TODO: Approval Service 연동하여 결재 생성
        UUID approvalId = UUID.randomUUID(); // 임시
        draft.submit(approvalId);

        AppointmentDraft saved = draftRepository.save(draft);
        log.info("Appointment draft submitted for approval: id={}, approvalId={}", id, approvalId);

        return AppointmentDraftResponse.fromWithDetails(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "appointment:draft", allEntries = true)
    public AppointmentDraftResponse execute(UUID id) {
        AppointmentDraft draft = findById(id);

        if (!draft.isExecutable()) {
            throw new BusinessException("APT_007", "시행할 수 없는 상태입니다: " + draft.getStatus());
        }

        if (draft.getEffectiveDate().isAfter(LocalDate.now())) {
            throw new BusinessException("APT_008", "시행일이 도래하지 않았습니다. 예약 발령을 사용하세요.");
        }

        executeAppointment(draft);

        AppointmentDraft saved = draftRepository.save(draft);
        log.info("Appointment draft executed: id={}", id);

        return AppointmentDraftResponse.fromWithDetails(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "appointment:draft", allEntries = true)
    public AppointmentDraftResponse schedule(UUID id, ScheduleAppointmentRequest request) {
        AppointmentDraft draft = findById(id);

        if (!draft.isExecutable()) {
            throw new BusinessException("APT_007", "예약할 수 없는 상태입니다");
        }

        if (request.getScheduledDate().isBefore(LocalDate.now())) {
            throw new BusinessException("APT_009", "예약일은 오늘 이후여야 합니다");
        }

        if (scheduleRepository.existsByDraftIdAndStatusIn(id,
                List.of(ScheduleStatus.SCHEDULED, ScheduleStatus.PROCESSING))) {
            throw new BusinessException("APT_010", "이미 예약된 발령입니다");
        }

        AppointmentSchedule schedule = AppointmentSchedule.builder()
            .draftId(id)
            .scheduledDate(request.getScheduledDate())
            .scheduledTime(request.getScheduledTime())
            .build();

        scheduleRepository.save(schedule);
        log.info("Appointment scheduled: draftId={}, date={}", id, request.getScheduledDate());

        return AppointmentDraftResponse.fromWithDetails(draft);
    }

    @Override
    @Transactional
    @CacheEvict(value = "appointment:draft", allEntries = true)
    public AppointmentDraftResponse cancel(UUID id, CancelAppointmentRequest request) {
        AppointmentDraft draft = findById(id);

        if (draft.getStatus() == DraftStatus.EXECUTED || draft.getStatus() == DraftStatus.CANCELLED) {
            throw new BusinessException("APT_011", "취소할 수 없는 상태입니다");
        }

        // 예약 취소
        scheduleRepository.findByDraftId(id).ifPresent(schedule -> {
            if (schedule.getStatus() == ScheduleStatus.SCHEDULED) {
                schedule.cancel();
                scheduleRepository.save(schedule);
            }
        });

        draft.cancel(TenantContext.getCurrentTenant(), request.getReason());

        AppointmentDraft saved = draftRepository.save(draft);
        log.info("Appointment draft cancelled: id={}", id);

        return AppointmentDraftResponse.fromWithDetails(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "appointment:draft", allEntries = true)
    public AppointmentDraftResponse rollback(UUID id) {
        AppointmentDraft draft = findById(id);

        if (draft.getStatus() != DraftStatus.EXECUTED) {
            throw new BusinessException("APT_012", "롤백할 수 없는 상태입니다");
        }

        // TODO: Employee Service 연동하여 롤백 처리
        for (AppointmentDetail detail : draft.getDetails()) {
            if (detail.getStatus() == DetailStatus.EXECUTED) {
                detail.rollback();
            }
        }

        log.info("Appointment draft rolled back: id={}", id);

        return AppointmentDraftResponse.fromWithDetails(draftRepository.save(draft));
    }

    private void executeAppointment(AppointmentDraft draft) {
        UUID executedBy = TenantContext.getCurrentTenant();
        List<AppointmentExecutedEvent.AppointmentDetailInfo> executedDetails = new ArrayList<>();

        for (AppointmentDetail detail : draft.getDetails()) {
            try {
                AppointmentHistory history = AppointmentHistory.builder()
                    .detailId(detail.getId())
                    .employeeId(detail.getEmployeeId())
                    .employeeName(detail.getEmployeeName())
                    .employeeNumber(detail.getEmployeeNumber())
                    .appointmentType(detail.getAppointmentType())
                    .effectiveDate(draft.getEffectiveDate())
                    .fromValues(buildFromValues(detail))
                    .toValues(buildToValues(detail))
                    .reason(detail.getReason())
                    .draftNumber(draft.getDraftNumber())
                    .build();

                historyRepository.save(history);
                detail.execute();

                executedDetails.add(AppointmentExecutedEvent.AppointmentDetailInfo.builder()
                    .detailId(detail.getId())
                    .employeeId(detail.getEmployeeId())
                    .appointmentType(detail.getAppointmentType())
                    .toDepartmentId(detail.getToDepartmentId())
                    .toPositionCode(detail.getToPositionCode())
                    .toGradeCode(detail.getToGradeCode())
                    .toJobCode(detail.getToJobCode())
                    .build());

            } catch (Exception e) {
                log.error("Failed to execute appointment detail: detailId={}", detail.getId(), e);
                detail.fail(e.getMessage());
            }
        }

        draft.execute(executedBy);

        // Publish event for Employee Service to update employee records
        if (!executedDetails.isEmpty()) {
            try {
                AppointmentExecutedEvent event = AppointmentExecutedEvent.builder()
                    .tenantId(TenantContext.getCurrentTenant())
                    .draftId(draft.getId())
                    .draftNumber(draft.getDraftNumber())
                    .effectiveDate(draft.getEffectiveDate())
                    .details(executedDetails)
                    .build();
                eventPublisher.publish(event);
                log.info("AppointmentExecutedEvent published: draftNumber={}, detailCount={}",
                    draft.getDraftNumber(), executedDetails.size());
            } catch (Exception e) {
                log.error("Failed to publish AppointmentExecutedEvent", e);
            }
        }
    }

    private Map<String, Object> buildFromValues(AppointmentDetail detail) {
        Map<String, Object> values = new HashMap<>();
        if (detail.getFromDepartmentId() != null) {
            values.put("departmentId", detail.getFromDepartmentId());
            values.put("departmentName", detail.getFromDepartmentName());
        }
        if (detail.getFromPositionCode() != null) {
            values.put("positionCode", detail.getFromPositionCode());
            values.put("positionName", detail.getFromPositionName());
        }
        if (detail.getFromGradeCode() != null) {
            values.put("gradeCode", detail.getFromGradeCode());
            values.put("gradeName", detail.getFromGradeName());
        }
        if (detail.getFromJobCode() != null) {
            values.put("jobCode", detail.getFromJobCode());
            values.put("jobName", detail.getFromJobName());
        }
        return values;
    }

    private Map<String, Object> buildToValues(AppointmentDetail detail) {
        Map<String, Object> values = new HashMap<>();
        if (detail.getToDepartmentId() != null) {
            values.put("departmentId", detail.getToDepartmentId());
            values.put("departmentName", detail.getToDepartmentName());
        }
        if (detail.getToPositionCode() != null) {
            values.put("positionCode", detail.getToPositionCode());
            values.put("positionName", detail.getToPositionName());
        }
        if (detail.getToGradeCode() != null) {
            values.put("gradeCode", detail.getToGradeCode());
            values.put("gradeName", detail.getToGradeName());
        }
        if (detail.getToJobCode() != null) {
            values.put("jobCode", detail.getToJobCode());
            values.put("jobName", detail.getToJobName());
        }
        return values;
    }

    private AppointmentDetail createDetail(CreateAppointmentDetailRequest request) {
        var builder = AppointmentDetail.builder()
            .employeeId(request.getEmployeeId())
            .appointmentType(request.getAppointmentType())
            .toDepartmentId(request.getToDepartmentId())
            .toPositionCode(request.getToPositionCode())
            .toGradeCode(request.getToGradeCode())
            .toJobCode(request.getToJobCode())
            .reason(request.getReason());

        // Auto-populate employee info and fromValues via Feign
        if (employeeClient.isPresent()) {
            try {
                var response = employeeClient.get().getEmployee(request.getEmployeeId());
                if (response != null && response.getData() != null) {
                    var emp = response.getData();
                    builder.employeeName(emp.name())
                           .employeeNumber(emp.employeeNumber())
                           .fromDepartmentId(emp.departmentId())
                           .fromDepartmentName(emp.departmentName())
                           .fromPositionCode(emp.positionCode())
                           .fromPositionName(emp.positionName())
                           .fromGradeCode(emp.gradeCode())
                           .fromGradeName(emp.gradeName())
                           .fromJobCode(emp.jobCode())
                           .fromJobName(emp.jobName());
                }
            } catch (Exception e) {
                log.warn("Failed to fetch employee info for auto-populate: employeeId={}", request.getEmployeeId(), e);
            }
        }

        return builder.build();
    }

    private AppointmentDraft findById(UUID id) {
        return draftRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("APT_001", "발령안을 찾을 수 없습니다: " + id));
    }

    private String generateDraftNumber(UUID tenantId) {
        String prefix = "APT-" + Year.now().getValue();
        Integer maxNumber = draftRepository.findMaxDraftNumberByPrefix(tenantId, prefix);
        int nextNumber = (maxNumber != null ? maxNumber : 0) + 1;
        return String.format("%s-%04d", prefix, nextNumber);
    }
}
