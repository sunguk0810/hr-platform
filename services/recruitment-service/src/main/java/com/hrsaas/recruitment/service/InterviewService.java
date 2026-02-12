package com.hrsaas.recruitment.service;

import com.hrsaas.recruitment.domain.dto.request.*;
import com.hrsaas.recruitment.domain.dto.response.InterviewResponse;
import com.hrsaas.recruitment.domain.dto.response.InterviewScoreResponse;
import com.hrsaas.recruitment.domain.dto.response.InterviewSummaryResponse;
import com.hrsaas.recruitment.domain.entity.InterviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * 면접 서비스 인터페이스
 */
public interface InterviewService {

    InterviewResponse create(CreateInterviewRequest request);

    InterviewResponse getById(UUID id);

    List<InterviewResponse> getByApplicationId(UUID applicationId);

    Page<InterviewResponse> getByStatus(InterviewStatus status, Pageable pageable);

    List<InterviewResponse> getByDate(LocalDate date);

    List<InterviewResponse> getTodayInterviews();

    InterviewResponse schedule(UUID id, ScheduleInterviewRequest request);

    InterviewResponse start(UUID id);

    InterviewResponse complete(UUID id, CompleteInterviewRequest request);

    InterviewResponse cancel(UUID id);

    InterviewResponse postpone(UUID id);

    InterviewResponse markNoShow(UUID id);

    void delete(UUID id);

    // 면접 평가 관련
    InterviewScoreResponse addScore(UUID interviewId, CreateInterviewScoreRequest request);

    List<InterviewScoreResponse> getScores(UUID interviewId);

    Double getAverageScore(UUID interviewId);

    InterviewSummaryResponse getSummary();

    Page<InterviewResponse> getMyInterviews(UUID interviewerId, Pageable pageable);

    List<InterviewScoreResponse> getMyScore(UUID interviewId, UUID interviewerId);

    InterviewResponse confirm(UUID id, ScheduleInterviewRequest request);

    void sendFeedbackReminders();
}
