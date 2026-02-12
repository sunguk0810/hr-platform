package com.hrsaas.recruitment.service.impl;

import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.ErrorCode;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.recruitment.client.NotificationServiceClient;
import com.hrsaas.recruitment.client.dto.NotificationChannel;
import com.hrsaas.recruitment.client.dto.NotificationType;
import com.hrsaas.recruitment.client.dto.SendNotificationRequest;
import com.hrsaas.recruitment.domain.dto.request.*;
import com.hrsaas.recruitment.domain.dto.response.InterviewResponse;
import com.hrsaas.recruitment.domain.dto.response.InterviewScoreResponse;
import com.hrsaas.recruitment.domain.dto.response.InterviewSummaryResponse;
import com.hrsaas.recruitment.domain.entity.*;
import com.hrsaas.recruitment.domain.event.InterviewScheduledEvent;
import com.hrsaas.recruitment.repository.ApplicationRepository;
import com.hrsaas.recruitment.repository.InterviewRepository;
import com.hrsaas.recruitment.repository.InterviewScoreRepository;
import com.hrsaas.recruitment.service.InterviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InterviewServiceImpl implements InterviewService {

    private final InterviewRepository interviewRepository;
    private final InterviewScoreRepository interviewScoreRepository;
    private final ApplicationRepository applicationRepository;
    private final EventPublisher eventPublisher;
    private final NotificationServiceClient notificationServiceClient;

    @Override
    @Transactional
    public InterviewResponse create(CreateInterviewRequest request) {
        log.info("Creating interview for application: {}", request.getApplicationId());

        Application application = applicationRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "지원서를 찾을 수 없습니다"));

        Interview interview = Interview.builder()
                .application(application)
                .interviewType(request.getInterviewType())
                .round(request.getRound())
                .scheduledDate(request.getScheduledDate())
                .scheduledTime(request.getScheduledTime())
                .durationMinutes(request.getDurationMinutes())
                .location(request.getLocation())
                .meetingUrl(request.getMeetingUrl())
                .interviewers(request.getInterviewers())
                .notes(request.getNotes())
                .feedbackDeadline(request.getFeedbackDeadline())
                .build();

        Interview saved = interviewRepository.save(interview);

        // 지원서 상태 업데이트
        application.startInterview();
        applicationRepository.save(application);

        log.info("Interview created: {}", saved.getId());
        return InterviewResponse.from(saved);
    }

    @Override
    public InterviewResponse getById(UUID id) {
        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "면접을 찾을 수 없습니다: " + id));
        return InterviewResponse.from(interview);
    }

    @Override
    public List<InterviewResponse> getByApplicationId(UUID applicationId) {
        return interviewRepository.findByApplicationIdOrderByRoundAsc(applicationId).stream()
                .map(InterviewResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public Page<InterviewResponse> getByStatus(InterviewStatus status, Pageable pageable) {
        return interviewRepository.findByStatusOrderByScheduledDateAscScheduledTimeAsc(status, pageable)
                .map(InterviewResponse::from);
    }

    @Override
    public List<InterviewResponse> getByDate(LocalDate date) {
        return interviewRepository.findByScheduledDateOrderByScheduledTimeAsc(date).stream()
                .map(InterviewResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public List<InterviewResponse> getTodayInterviews() {
        return interviewRepository.findTodayScheduledInterviews(LocalDate.now()).stream()
                .map(InterviewResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InterviewResponse schedule(UUID id, ScheduleInterviewRequest request) {
        log.info("Scheduling interview: {}", id);

        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "면접을 찾을 수 없습니다"));

        interview.schedule(request.getScheduledDate(), request.getScheduledTime());
        if (request.getLocation() != null) interview.setLocation(request.getLocation());
        if (request.getMeetingUrl() != null) interview.setMeetingUrl(request.getMeetingUrl());

        Interview saved = interviewRepository.save(interview);

        // 면접 일정 확정 이벤트 발행
        try {
            Application application = interview.getApplication();
            Applicant applicant = application.getApplicant();
            InterviewScheduledEvent event = InterviewScheduledEvent.builder()
                    .tenantId(TenantContext.getCurrentTenant())
                    .interviewId(saved.getId())
                    .applicationId(application.getId())
                    .applicantName(applicant.getName())
                    .applicantEmail(applicant.getEmail())
                    .interviewType(interview.getInterviewType().name())
                    .round(interview.getRound())
                    .scheduledDate(saved.getScheduledDate())
                    .scheduledTime(saved.getScheduledTime())
                    .durationMinutes(saved.getDurationMinutes())
                    .location(saved.getLocation())
                    .meetingUrl(saved.getMeetingUrl())
                    .interviewers(saved.getInterviewers())
                    .build();
            eventPublisher.publish(event);
        } catch (Exception e) {
            log.error("Failed to publish InterviewScheduledEvent", e);
        }

        return InterviewResponse.from(saved);
    }

    @Override
    @Transactional
    public InterviewResponse start(UUID id) {
        log.info("Starting interview: {}", id);

        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "면접을 찾을 수 없습니다"));

        interview.start();
        return InterviewResponse.from(interviewRepository.save(interview));
    }

    @Override
    @Transactional
    public InterviewResponse complete(UUID id, CompleteInterviewRequest request) {
        log.info("Completing interview: {}", id);

        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "면접을 찾을 수 없습니다"));

        interview.complete(request.getResult(), request.getOverallScore(), request.getResultNotes());

        // 지원서 상태 업데이트
        Application application = interview.getApplication();
        if ("PASS".equalsIgnoreCase(request.getResult())) {
            application.passInterview();
        } else if ("FAIL".equalsIgnoreCase(request.getResult())) {
            application.failInterview();
        }
        applicationRepository.save(application);

        return InterviewResponse.from(interviewRepository.save(interview));
    }

    @Override
    @Transactional
    public InterviewResponse cancel(UUID id) {
        log.info("Cancelling interview: {}", id);

        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "면접을 찾을 수 없습니다"));

        interview.cancel();
        return InterviewResponse.from(interviewRepository.save(interview));
    }

    @Override
    @Transactional
    public InterviewResponse postpone(UUID id) {
        log.info("Postponing interview: {}", id);

        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "면접을 찾을 수 없습니다"));

        interview.postpone();
        return InterviewResponse.from(interviewRepository.save(interview));
    }

    @Override
    @Transactional
    public InterviewResponse markNoShow(UUID id) {
        log.info("Marking interview as no-show: {}", id);

        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "면접을 찾을 수 없습니다"));

        interview.markNoShow();
        return InterviewResponse.from(interviewRepository.save(interview));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        log.info("Deleting interview: {}", id);
        if (!interviewRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "면접을 찾을 수 없습니다: " + id);
        }
        interviewRepository.deleteById(id);
    }

    @Override
    @Transactional
    public InterviewScoreResponse addScore(UUID interviewId, CreateInterviewScoreRequest request) {
        log.info("Adding score to interview: {}", interviewId);

        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "면접을 찾을 수 없습니다"));

        InterviewScore score = InterviewScore.builder()
                .interview(interview)
                .interviewerId(request.getInterviewerId())
                .interviewerName(request.getInterviewerName())
                .criterion(request.getCriterion())
                .score(request.getScore())
                .maxScore(request.getMaxScore())
                .weight(request.getWeight())
                .comment(request.getComment())
                .build();

        InterviewScore saved = interviewScoreRepository.save(score);
        return InterviewScoreResponse.from(saved);
    }

    @Override
    public List<InterviewScoreResponse> getScores(UUID interviewId) {
        return interviewScoreRepository.findByInterviewIdOrderByCriterionAsc(interviewId).stream()
                .map(InterviewScoreResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public Double getAverageScore(UUID interviewId) {
        return interviewScoreRepository.calculateAverageScore(interviewId);
    }

    @Override
    public InterviewSummaryResponse getSummary() {
        // 8개 개별 COUNT 쿼리를 1개 GROUP BY 쿼리로 통합
        Map<InterviewStatus, Long> statusCounts = new EnumMap<>(InterviewStatus.class);
        long total = 0;
        for (Object[] row : interviewRepository.countGroupByStatus()) {
            InterviewStatus status = (InterviewStatus) row[0];
            Long count = (Long) row[1];
            statusCounts.put(status, count);
            total += count;
        }

        return InterviewSummaryResponse.builder()
                .total(total)
                .scheduling(statusCounts.getOrDefault(InterviewStatus.SCHEDULING, 0L))
                .scheduled(statusCounts.getOrDefault(InterviewStatus.SCHEDULED, 0L))
                .inProgress(statusCounts.getOrDefault(InterviewStatus.IN_PROGRESS, 0L))
                .completed(statusCounts.getOrDefault(InterviewStatus.COMPLETED, 0L))
                .noShow(statusCounts.getOrDefault(InterviewStatus.NO_SHOW, 0L))
                .cancelled(statusCounts.getOrDefault(InterviewStatus.CANCELLED, 0L))
                .postponed(statusCounts.getOrDefault(InterviewStatus.POSTPONED, 0L))
                .build();
    }

    @Override
    public Page<InterviewResponse> getMyInterviews(UUID interviewerId, Pageable pageable) {
        return interviewRepository.findByInterviewerId(interviewerId.toString(), pageable)
                .map(InterviewResponse::from);
    }

    @Override
    public List<InterviewScoreResponse> getMyScore(UUID interviewId, UUID interviewerId) {
        return interviewScoreRepository.findByInterviewIdAndInterviewerIdOrderByCriterionAsc(interviewId, interviewerId)
                .stream()
                .map(InterviewScoreResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InterviewResponse confirm(UUID id, ScheduleInterviewRequest request) {
        log.info("Confirming interview: {}", id);
        return schedule(id, request);
    }

    @Override
    @Transactional
    public void sendFeedbackReminders() {
        LocalDate today = LocalDate.now();
        List<Interview> dueInterviews = interviewRepository.findByFeedbackDeadlineAndStatusIn(
                today,
                List.of(InterviewStatus.SCHEDULED, InterviewStatus.IN_PROGRESS)
        );

        log.info("Found {} interviews with feedback deadline today", dueInterviews.size());

        for (Interview interview : dueInterviews) {
            try {
                processFeedbackReminder(interview);
            } catch (Exception e) {
                log.error("Failed to send feedback reminder for interview: {}", interview.getId(), e);
            }
        }
    }

    private void processFeedbackReminder(Interview interview) {
        // 1. Identify all required interviewers
        List<Map<String, Object>> interviewers = interview.getInterviewers();
        if (interviewers == null || interviewers.isEmpty()) {
            return;
        }

        // 2. Identify interviewers who have already submitted scores
        List<InterviewScore> scores = interview.getScores();
        java.util.Set<String> submittedInterviewerIds = scores.stream()
                .map(score -> score.getInterviewerId().toString())
                .collect(Collectors.toSet());

        // 3. Find pending interviewers
        for (Map<String, Object> interviewer : interviewers) {
            String idStr = (String) interviewer.get("id");
            if (idStr == null || submittedInterviewerIds.contains(idStr)) {
                continue;
            }

            // 4. Send notification
            String name = (String) interviewer.get("name");
            String email = (String) interviewer.get("email");

            UUID recipientId;
            try {
                recipientId = UUID.fromString(idStr);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid interviewer ID format: {}", idStr);
                continue;
            }

            String applicantName = interview.getApplication().getApplicant().getName();
            String jobTitle = interview.getApplication().getJobPosting().getTitle();

            SendNotificationRequest request = SendNotificationRequest.builder()
                    .recipientId(recipientId)
                    .recipientEmail(email)
                    .notificationType(NotificationType.INTERVIEW_FEEDBACK_REMINDER)
                    .channels(List.of(NotificationChannel.WEB_PUSH, NotificationChannel.EMAIL))
                    .title("면접 결과 피드백 요청")
                    .content(String.format("[%s] %s 지원자에 대한 면접 결과 피드백을 오늘까지 제출해주세요.",
                            jobTitle, applicantName))
                    .linkUrl("/recruitment/interviews/" + interview.getId()) // Adjust link as needed
                    .referenceType("INTERVIEW")
                    .referenceId(interview.getId())
                    .build();

            try {
                notificationServiceClient.send(request);
                log.info("Sent feedback reminder to interviewer: {} ({}) for interview: {}",
                        name, recipientId, interview.getId());
            } catch (Exception e) {
                log.error("Failed to send feedback reminder to interviewer: {} ({}) for interview: {}",
                        name, recipientId, interview.getId(), e);
            }
        }
    }
}
