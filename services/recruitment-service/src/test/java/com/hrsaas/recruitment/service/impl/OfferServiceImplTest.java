package com.hrsaas.recruitment.service.impl;

import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.recruitment.domain.dto.request.CreateOfferRequest;
import com.hrsaas.recruitment.domain.dto.response.OfferResponse;
import com.hrsaas.recruitment.domain.entity.*;
import com.hrsaas.recruitment.domain.event.CandidateHiredEvent;
import com.hrsaas.recruitment.repository.ApplicationRepository;
import com.hrsaas.recruitment.repository.OfferRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OfferServiceImplTest {

    @Mock
    private OfferRepository offerRepository;

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private OfferServiceImpl offerService;

    private UUID tenantId;
    private UUID applicationId;
    private Application application;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        TenantContext.setCurrentTenant(tenantId);

        applicationId = UUID.randomUUID();
        application = createOfferReadyApplication();
        setEntityId(application, applicationId);
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
        CreateOfferRequest request = CreateOfferRequest.builder()
                .applicationId(applicationId)
                .positionTitle("Senior Backend Developer")
                .departmentId(UUID.randomUUID())
                .departmentName("Engineering")
                .gradeCode("G4")
                .gradeName("Senior")
                .baseSalary(BigDecimal.valueOf(70000000))
                .signingBonus(BigDecimal.valueOf(5000000))
                .startDate(LocalDate.of(2026, 4, 1))
                .employmentType(EmploymentType.FULL_TIME)
                .probationMonths(3)
                .workLocation("Seoul")
                .reportToId(UUID.randomUUID())
                .reportToName("Manager Lee")
                .specialTerms("Remote work allowed 2 days/week")
                .expiresAt(Instant.now().plus(14, ChronoUnit.DAYS))
                .build();

        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(application));
        when(offerRepository.findByApplicationId(applicationId)).thenReturn(Optional.empty());
        when(offerRepository.save(any(Offer.class))).thenAnswer(invocation -> {
            Offer offer = invocation.getArgument(0);
            setEntityId(offer, UUID.randomUUID());
            return offer;
        });
        when(applicationRepository.save(any(Application.class))).thenReturn(application);

        // when
        OfferResponse response = offerService.create(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(OfferStatus.DRAFT);
        assertThat(response.getPositionTitle()).isEqualTo("Senior Backend Developer");
        assertThat(response.getBaseSalary()).isEqualByComparingTo(BigDecimal.valueOf(70000000));
        assertThat(response.getOfferNumber()).startsWith("OFR-");

        verify(applicationRepository).findById(applicationId);
        verify(offerRepository).findByApplicationId(applicationId);
        verify(offerRepository).save(any(Offer.class));
        verify(applicationRepository).save(any(Application.class));
    }

    @Test
    @DisplayName("create: duplicateOffer - throwsException")
    void create_duplicateOffer_throwsException() {
        // given
        CreateOfferRequest request = CreateOfferRequest.builder()
                .applicationId(applicationId)
                .positionTitle("Senior Backend Developer")
                .baseSalary(BigDecimal.valueOf(70000000))
                .startDate(LocalDate.of(2026, 4, 1))
                .build();

        Offer existingOffer = createDraftOffer(application);
        setEntityId(existingOffer, UUID.randomUUID());

        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(application));
        when(offerRepository.findByApplicationId(applicationId)).thenReturn(Optional.of(existingOffer));

        // when & then
        assertThatThrownBy(() -> offerService.create(request))
                .isInstanceOf(BusinessException.class);

        verify(offerRepository).findByApplicationId(applicationId);
        verify(offerRepository, never()).save(any());
    }

    // ===== submitForApproval =====

    @Test
    @DisplayName("submitForApproval: draftOffer - success")
    void submitForApproval_draftOffer_success() {
        // given
        UUID offerId = UUID.randomUUID();
        Offer offer = createDraftOffer(application);
        setEntityId(offer, offerId);

        when(offerRepository.findById(offerId)).thenReturn(Optional.of(offer));
        when(offerRepository.save(any(Offer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        OfferResponse response = offerService.submitForApproval(offerId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(OfferStatus.PENDING_APPROVAL);

        verify(offerRepository).findById(offerId);
        verify(offerRepository).save(any(Offer.class));
    }

    // ===== send =====

    @Test
    @DisplayName("send: approvedOffer - success")
    void send_approvedOffer_success() {
        // given
        UUID offerId = UUID.randomUUID();
        Offer offer = createApprovedOffer(application);
        setEntityId(offer, offerId);

        when(offerRepository.findById(offerId)).thenReturn(Optional.of(offer));
        when(offerRepository.save(any(Offer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        OfferResponse response = offerService.send(offerId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(OfferStatus.SENT);
        assertThat(response.getSentAt()).isNotNull();

        verify(offerRepository).findById(offerId);
        verify(offerRepository).save(any(Offer.class));
    }

    // ===== accept =====

    @Test
    @DisplayName("accept: sentOffer - publishesEvent")
    void accept_sentOffer_publishesEvent() {
        // given - application must be in OFFER_PENDING state for hire() to work
        Application offerPendingApp = createOfferReadyApplication();
        offerPendingApp.makeOffer(); // INTERVIEW_PASSED -> OFFER_PENDING
        setEntityId(offerPendingApp, UUID.randomUUID());

        UUID offerId = UUID.randomUUID();
        Offer offer = createSentOffer(offerPendingApp);
        setEntityId(offer, offerId);

        when(offerRepository.findById(offerId)).thenReturn(Optional.of(offer));
        when(offerRepository.save(any(Offer.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(eventPublisher).publish(any(CandidateHiredEvent.class));

        // when
        OfferResponse response = offerService.accept(offerId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(OfferStatus.ACCEPTED);
        assertThat(response.getRespondedAt()).isNotNull();

        verify(offerRepository).findById(offerId);
        verify(offerRepository).save(any(Offer.class));
        verify(applicationRepository).save(any(Application.class));
        verify(eventPublisher).publish(any(CandidateHiredEvent.class));
    }

    // ===== decline =====

    @Test
    @DisplayName("decline: sentOffer - success")
    void decline_sentOffer_success() {
        // given
        UUID offerId = UUID.randomUUID();
        Offer offer = createSentOffer(application);
        setEntityId(offer, offerId);

        String reason = "Accepted another offer";

        when(offerRepository.findById(offerId)).thenReturn(Optional.of(offer));
        when(offerRepository.save(any(Offer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        OfferResponse response = offerService.decline(offerId, reason);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(OfferStatus.DECLINED);
        assertThat(response.getDeclineReason()).isEqualTo(reason);
        assertThat(response.getRespondedAt()).isNotNull();

        verify(offerRepository).findById(offerId);
        verify(offerRepository).save(any(Offer.class));
    }

    // ===== checkExpiredOffers =====

    @Test
    @DisplayName("checkExpiredOffers: expiredOffers - marksExpired")
    void checkExpiredOffers_expiredOffers_marksExpired() {
        // given
        Offer expiredOffer1 = createSentOffer(application);
        setEntityId(expiredOffer1, UUID.randomUUID());

        Application application2 = createOfferReadyApplication();
        setEntityId(application2, UUID.randomUUID());
        Offer expiredOffer2 = createSentOffer(application2);
        setEntityId(expiredOffer2, UUID.randomUUID());

        List<Offer> expiredOffers = List.of(expiredOffer1, expiredOffer2);

        when(offerRepository.findExpired(any(Instant.class))).thenReturn(expiredOffers);
        when(offerRepository.save(any(Offer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        offerService.checkExpiredOffers();

        // then
        assertThat(expiredOffer1.getStatus()).isEqualTo(OfferStatus.EXPIRED);
        assertThat(expiredOffer2.getStatus()).isEqualTo(OfferStatus.EXPIRED);

        verify(offerRepository).findExpired(any(Instant.class));
        verify(offerRepository, times(2)).save(any(Offer.class));
    }

    // ===== Helper methods =====

    private Application createOfferReadyApplication() {
        JobPosting posting = JobPosting.builder()
                .jobCode("JOB-2026-001")
                .title("Backend Developer")
                .departmentId(UUID.randomUUID())
                .departmentName("Engineering")
                .employmentType(EmploymentType.FULL_TIME)
                .workLocation("Seoul")
                .build();
        posting.publish();
        setEntityId(posting, UUID.randomUUID());

        Applicant applicant = Applicant.builder()
                .name("John Doe")
                .email("john.doe@example.com")
                .phone("010-1234-5678")
                .birthDate(LocalDate.of(1990, 1, 15))
                .gender("MALE")
                .address("Seoul, Korea")
                .build();
        setEntityId(applicant, UUID.randomUUID());

        Application app = Application.builder()
                .jobPosting(posting)
                .applicant(applicant)
                .applicationNumber("APP-20260210-000001")
                .coverLetter("Cover letter")
                .expectedSalary(60000000L)
                .build();
        setEntityId(app, UUID.randomUUID());

        // Transition through states: SUBMITTED -> SCREENED -> INTERVIEWING -> INTERVIEW_PASSED
        app.screen(UUID.randomUUID(), 90, "Strong candidate", true);
        app.startInterview();
        app.passInterview();

        return app;
    }

    private Offer createDraftOffer(Application application) {
        return Offer.builder()
                .application(application)
                .offerNumber("OFR-20260210-000001")
                .positionTitle("Senior Backend Developer")
                .departmentId(UUID.randomUUID())
                .departmentName("Engineering")
                .gradeCode("G4")
                .gradeName("Senior")
                .baseSalary(BigDecimal.valueOf(70000000))
                .startDate(LocalDate.of(2026, 4, 1))
                .employmentType(EmploymentType.FULL_TIME)
                .probationMonths(3)
                .workLocation("Seoul")
                .expiresAt(Instant.now().plus(14, ChronoUnit.DAYS))
                .build();
    }

    private Offer createApprovedOffer(Application application) {
        Offer offer = createDraftOffer(application);
        offer.submitForApproval();
        offer.approve(UUID.randomUUID());
        return offer;
    }

    private Offer createSentOffer(Application application) {
        Offer offer = createApprovedOffer(application);
        offer.send();
        return offer;
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
