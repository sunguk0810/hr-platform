package com.hrsaas.recruitment.service.impl;

import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.ErrorCode;
import com.hrsaas.recruitment.domain.dto.request.*;
import com.hrsaas.recruitment.domain.dto.response.InterviewResponse;
import com.hrsaas.recruitment.domain.dto.response.InterviewScoreResponse;
import com.hrsaas.recruitment.domain.entity.*;
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
import java.util.List;
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

        return InterviewResponse.from(interviewRepository.save(interview));
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
}
