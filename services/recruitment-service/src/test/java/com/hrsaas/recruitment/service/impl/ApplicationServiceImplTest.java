package com.hrsaas.recruitment.service.impl;

import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.recruitment.domain.dto.request.CreateApplicationRequest;
import com.hrsaas.recruitment.domain.dto.request.ScreenApplicationRequest;
import com.hrsaas.recruitment.domain.dto.response.ApplicationResponse;
import com.hrsaas.recruitment.domain.entity.*;
import com.hrsaas.recruitment.repository.ApplicantRepository;
import com.hrsaas.recruitment.repository.ApplicationRepository;
import com.hrsaas.recruitment.repository.JobPostingRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceImplTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private JobPostingRepository jobPostingRepository;

    @Mock
    private ApplicantRepository applicantRepository;

    @InjectMocks
    private ApplicationServiceImpl applicationService;

    private UUID tenantId;
    private UUID jobPostingId;
    private UUID applicantId;
    private JobPosting jobPosting;
    private Applicant applicant;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        TenantContext.setCurrentTenant(tenantId);

        jobPostingId = UUID.randomUUID();
        applicantId = UUID.randomUUID();

        jobPosting = createPublishedJobPosting();
        setEntityId(jobPosting, jobPostingId);

        applicant = createApplicant(false);
        setEntityId(applicant, applicantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ===== create =====

    @Test
    @DisplayName("create: validRequest - success")
    void create_validRequest_success() {
        // given
        CreateApplicationRequest request = CreateApplicationRequest.builder()
                .jobPostingId(jobPostingId)
                .applicantId(applicantId)
                .coverLetter("I am excited to apply for this position")
                .expectedSalary(60000000L)
                .availableDate("2026-04-01")
                .build();

        when(jobPostingRepository.findById(jobPostingId)).thenReturn(Optional.of(jobPosting));
        when(applicantRepository.findById(applicantId)).thenReturn(Optional.of(applicant));
        when(applicationRepository.existsByJobPostingIdAndApplicantId(jobPostingId, applicantId)).thenReturn(false);
        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> {
            Application app = invocation.getArgument(0);
            setEntityId(app, UUID.randomUUID());
            return app;
        });
        when(jobPostingRepository.save(any(JobPosting.class))).thenReturn(jobPosting);

        // when
        ApplicationResponse response = applicationService.create(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(ApplicationStatus.SUBMITTED);
        assertThat(response.getApplicationNumber()).startsWith("APP-");
        assertThat(response.getCoverLetter()).isEqualTo("I am excited to apply for this position");

        verify(jobPostingRepository).findById(jobPostingId);
        verify(applicantRepository).findById(applicantId);
        verify(applicationRepository).existsByJobPostingIdAndApplicantId(jobPostingId, applicantId);
        verify(applicationRepository).save(any(Application.class));
        verify(jobPostingRepository).save(any(JobPosting.class));
    }

    @Test
    @DisplayName("create: closedJobPosting - throwsException")
    void create_closedJobPosting_throwsException() {
        // given
        JobPosting closedPosting = createClosedJobPosting();
        setEntityId(closedPosting, jobPostingId);

        CreateApplicationRequest request = CreateApplicationRequest.builder()
                .jobPostingId(jobPostingId)
                .applicantId(applicantId)
                .build();

        when(jobPostingRepository.findById(jobPostingId)).thenReturn(Optional.of(closedPosting));

        // when & then
        assertThatThrownBy(() -> applicationService.create(request))
                .isInstanceOf(BusinessException.class);

        verify(jobPostingRepository).findById(jobPostingId);
        verify(applicationRepository, never()).save(any());
    }

    @Test
    @DisplayName("create: blacklistedApplicant - throwsException")
    void create_blacklistedApplicant_throwsException() {
        // given
        Applicant blacklistedApplicant = createApplicant(true);
        setEntityId(blacklistedApplicant, applicantId);

        CreateApplicationRequest request = CreateApplicationRequest.builder()
                .jobPostingId(jobPostingId)
                .applicantId(applicantId)
                .build();

        when(jobPostingRepository.findById(jobPostingId)).thenReturn(Optional.of(jobPosting));
        when(applicantRepository.findById(applicantId)).thenReturn(Optional.of(blacklistedApplicant));

        // when & then
        assertThatThrownBy(() -> applicationService.create(request))
                .isInstanceOf(BusinessException.class);

        verify(jobPostingRepository).findById(jobPostingId);
        verify(applicantRepository).findById(applicantId);
        verify(applicationRepository, never()).save(any());
    }

    @Test
    @DisplayName("create: duplicateApplication - throwsException")
    void create_duplicateApplication_throwsException() {
        // given
        CreateApplicationRequest request = CreateApplicationRequest.builder()
                .jobPostingId(jobPostingId)
                .applicantId(applicantId)
                .build();

        when(jobPostingRepository.findById(jobPostingId)).thenReturn(Optional.of(jobPosting));
        when(applicantRepository.findById(applicantId)).thenReturn(Optional.of(applicant));
        when(applicationRepository.existsByJobPostingIdAndApplicantId(jobPostingId, applicantId)).thenReturn(true);

        // when & then
        assertThatThrownBy(() -> applicationService.create(request))
                .isInstanceOf(BusinessException.class);

        verify(applicationRepository).existsByJobPostingIdAndApplicantId(jobPostingId, applicantId);
        verify(applicationRepository, never()).save(any());
    }

    // ===== screen =====

    @Test
    @DisplayName("screen: passedApplication - success")
    void screen_passedApplication_success() {
        // given
        UUID applicationId = UUID.randomUUID();
        Application application = createSubmittedApplication();
        setEntityId(application, applicationId);

        UUID screenerId = UUID.randomUUID();
        ScreenApplicationRequest request = ScreenApplicationRequest.builder()
                .screenedBy(screenerId)
                .score(85)
                .notes("Strong technical skills")
                .passed(true)
                .build();

        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(application));
        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        ApplicationResponse response = applicationService.screen(applicationId, request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(ApplicationStatus.SCREENED);
        assertThat(response.getScreeningScore()).isEqualTo(85);
        assertThat(response.getScreenedBy()).isEqualTo(screenerId);
        assertThat(response.getCurrentStage()).isEqualTo("INTERVIEW");

        verify(applicationRepository).findById(applicationId);
        verify(applicationRepository).save(any(Application.class));
    }

    // ===== reject =====

    @Test
    @DisplayName("reject: validApplication - success")
    void reject_validApplication_success() {
        // given
        UUID applicationId = UUID.randomUUID();
        Application application = createSubmittedApplication();
        setEntityId(application, applicationId);

        String reason = "Position requirements not met";

        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(application));
        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        ApplicationResponse response = applicationService.reject(applicationId, reason);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(ApplicationStatus.REJECTED);
        assertThat(response.getRejectionReason()).isEqualTo(reason);
        assertThat(response.getRejectedAt()).isNotNull();

        verify(applicationRepository).findById(applicationId);
        verify(applicationRepository).save(any(Application.class));
    }

    // ===== hire =====

    @Test
    @DisplayName("hire: validApplication - success")
    void hire_validApplication_success() {
        // given
        UUID applicationId = UUID.randomUUID();
        Application application = createOfferPendingApplication();
        setEntityId(application, applicationId);

        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(application));
        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        ApplicationResponse response = applicationService.hire(applicationId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(ApplicationStatus.HIRED);
        assertThat(response.getHiredAt()).isNotNull();

        verify(applicationRepository).findById(applicationId);
        verify(applicationRepository).save(any(Application.class));
    }

    // ===== withdraw =====

    @Test
    @DisplayName("withdraw: validApplication - success")
    void withdraw_validApplication_success() {
        // given
        UUID applicationId = UUID.randomUUID();
        Application application = createSubmittedApplication();
        setEntityId(application, applicationId);

        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(application));
        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        ApplicationResponse response = applicationService.withdraw(applicationId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(ApplicationStatus.WITHDRAWN);
        assertThat(response.getWithdrawnAt()).isNotNull();

        verify(applicationRepository).findById(applicationId);
        verify(applicationRepository).save(any(Application.class));
    }

    // ===== Helper methods =====

    private JobPosting createPublishedJobPosting() {
        JobPosting posting = JobPosting.builder()
                .jobCode("JOB-2026-001")
                .title("Backend Developer")
                .departmentId(UUID.randomUUID())
                .departmentName("Engineering")
                .employmentType(EmploymentType.FULL_TIME)
                .salaryMin(BigDecimal.valueOf(50000000))
                .salaryMax(BigDecimal.valueOf(80000000))
                .workLocation("Seoul")
                .headcount(2)
                .skills(List.of("Java", "Spring"))
                .openDate(LocalDate.now())
                .closeDate(LocalDate.now().plusMonths(1))
                .build();
        posting.publish(); // Move to PUBLISHED status
        return posting;
    }

    private JobPosting createClosedJobPosting() {
        JobPosting posting = JobPosting.builder()
                .jobCode("JOB-2026-002")
                .title("Closed Position")
                .employmentType(EmploymentType.FULL_TIME)
                .workLocation("Seoul")
                .build();
        // Status remains DRAFT, which means isOpen() returns false
        return posting;
    }

    private Applicant createApplicant(boolean blacklisted) {
        Applicant app = Applicant.builder()
                .name("John Doe")
                .email("john.doe@example.com")
                .phone("010-1234-5678")
                .birthDate(LocalDate.of(1990, 1, 15))
                .gender("MALE")
                .address("Seoul, Korea")
                .source("DIRECT")
                .build();
        if (blacklisted) {
            app.blacklist("Previous misconduct");
        }
        return app;
    }

    private Application createSubmittedApplication() {
        JobPosting posting = createPublishedJobPosting();
        setEntityId(posting, UUID.randomUUID());
        Applicant app = createApplicant(false);
        setEntityId(app, UUID.randomUUID());

        return Application.builder()
                .jobPosting(posting)
                .applicant(app)
                .applicationNumber("APP-20260210-000001")
                .coverLetter("Cover letter text")
                .expectedSalary(60000000L)
                .availableDate("2026-04-01")
                .build();
    }

    private Application createOfferPendingApplication() {
        Application application = createSubmittedApplication();
        UUID screenerId = UUID.randomUUID();
        // Transition through states: SUBMITTED -> SCREENED -> INTERVIEWING -> INTERVIEW_PASSED -> OFFER_PENDING
        application.screen(screenerId, 90, "Good candidate", true);
        application.startInterview();
        application.passInterview();
        application.makeOffer();
        return application;
    }

    private void setEntityId(Object entity, UUID id) {
        try {
            var field = findField(entity.getClass(), "id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set entity ID", e);
        }
    }

    private java.lang.reflect.Field findField(Class<?> clazz, String name) {
        while (clazz != null) {
            try {
                return clazz.getDeclaredField(name);
            } catch (NoSuchFieldException e) {
                clazz = clazz.getSuperclass();
            }
        }
        throw new RuntimeException("Field not found: " + name);
    }
}
