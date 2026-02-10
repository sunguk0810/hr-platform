package com.hrsaas.recruitment.domain.entity;

import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Offer Entity State Transition Tests")
class OfferTest {

    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID APPROVER_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private Offer createDraftOffer() {
        JobPosting jobPosting = JobPosting.builder()
                .jobCode("JOB-2026-001")
                .title("Backend Developer")
                .employmentType(EmploymentType.FULL_TIME)
                .build();

        Applicant applicant = Applicant.builder()
                .name("Hong Gildong")
                .email("hong@example.com")
                .build();

        Application application = Application.builder()
                .jobPosting(jobPosting)
                .applicant(applicant)
                .applicationNumber("APP-2026-0001")
                .build();

        return Offer.builder()
                .application(application)
                .offerNumber("OFR-2026-0001")
                .positionTitle("Senior Backend Developer")
                .baseSalary(new BigDecimal("60000000"))
                .startDate(LocalDate.now().plusMonths(1))
                .employmentType(EmploymentType.FULL_TIME)
                .build();
    }

    @Test
    @DisplayName("submitForApproval: DRAFT -> PENDING_APPROVAL 전환 성공")
    void submitForApproval_fromDraft_success() {
        // given
        Offer offer = createDraftOffer();
        assertThat(offer.getStatus()).isEqualTo(OfferStatus.DRAFT);

        // when
        offer.submitForApproval();

        // then
        assertThat(offer.getStatus()).isEqualTo(OfferStatus.PENDING_APPROVAL);
    }

    @Test
    @DisplayName("submitForApproval: SENT 상태에서 submitForApproval 호출 시 예외 발생")
    void submitForApproval_fromSent_throwsException() {
        // given
        Offer offer = createDraftOffer();
        offer.submitForApproval();
        offer.approve(APPROVER_ID);
        offer.send();
        assertThat(offer.getStatus()).isEqualTo(OfferStatus.SENT);

        // when & then
        assertThatThrownBy(offer::submitForApproval)
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("승인 요청");
    }

    @Test
    @DisplayName("approve: PENDING_APPROVAL -> APPROVED 전환 성공")
    void approve_fromPendingApproval_success() {
        // given
        Offer offer = createDraftOffer();
        offer.submitForApproval();
        assertThat(offer.getStatus()).isEqualTo(OfferStatus.PENDING_APPROVAL);

        // when
        offer.approve(APPROVER_ID);

        // then
        assertThat(offer.getStatus()).isEqualTo(OfferStatus.APPROVED);
        assertThat(offer.getApprovedBy()).isEqualTo(APPROVER_ID);
        assertThat(offer.getApprovedAt()).isNotNull();
    }

    @Test
    @DisplayName("approve: DRAFT 상태에서 approve 호출 시 예외 발생")
    void approve_fromDraft_throwsException() {
        // given
        Offer offer = createDraftOffer();
        assertThat(offer.getStatus()).isEqualTo(OfferStatus.DRAFT);

        // when & then
        assertThatThrownBy(() -> offer.approve(APPROVER_ID))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("승인");
    }

    @Test
    @DisplayName("send: APPROVED -> SENT 전환 성공")
    void send_fromApproved_success() {
        // given
        Offer offer = createDraftOffer();
        offer.submitForApproval();
        offer.approve(APPROVER_ID);
        assertThat(offer.getStatus()).isEqualTo(OfferStatus.APPROVED);

        // when
        offer.send();

        // then
        assertThat(offer.getStatus()).isEqualTo(OfferStatus.SENT);
        assertThat(offer.getSentAt()).isNotNull();
    }

    @Test
    @DisplayName("send: DRAFT 상태에서 send 호출 시 예외 발생")
    void send_fromDraft_throwsException() {
        // given
        Offer offer = createDraftOffer();
        assertThat(offer.getStatus()).isEqualTo(OfferStatus.DRAFT);

        // when & then
        assertThatThrownBy(offer::send)
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("발송");
    }

    @Test
    @DisplayName("accept: SENT -> ACCEPTED 전환 성공")
    void accept_fromSent_success() {
        // given
        Offer offer = createDraftOffer();
        offer.submitForApproval();
        offer.approve(APPROVER_ID);
        offer.send();
        assertThat(offer.getStatus()).isEqualTo(OfferStatus.SENT);

        // when
        offer.accept();

        // then
        assertThat(offer.getStatus()).isEqualTo(OfferStatus.ACCEPTED);
        assertThat(offer.getRespondedAt()).isNotNull();
    }

    @Test
    @DisplayName("accept: DRAFT 상태에서 accept 호출 시 예외 발생")
    void accept_fromDraft_throwsException() {
        // given
        Offer offer = createDraftOffer();
        assertThat(offer.getStatus()).isEqualTo(OfferStatus.DRAFT);

        // when & then
        assertThatThrownBy(offer::accept)
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("수락");
    }

    @Test
    @DisplayName("decline: SENT -> DECLINED 전환 성공")
    void decline_fromSent_success() {
        // given
        Offer offer = createDraftOffer();
        offer.submitForApproval();
        offer.approve(APPROVER_ID);
        offer.send();
        assertThat(offer.getStatus()).isEqualTo(OfferStatus.SENT);

        // when
        offer.decline("Received better offer");

        // then
        assertThat(offer.getStatus()).isEqualTo(OfferStatus.DECLINED);
        assertThat(offer.getDeclineReason()).isEqualTo("Received better offer");
        assertThat(offer.getRespondedAt()).isNotNull();
    }

    @Test
    @DisplayName("negotiate: SENT -> NEGOTIATING 전환 성공")
    void negotiate_fromSent_success() {
        // given
        Offer offer = createDraftOffer();
        offer.submitForApproval();
        offer.approve(APPROVER_ID);
        offer.send();
        assertThat(offer.getStatus()).isEqualTo(OfferStatus.SENT);

        // when
        offer.negotiate("Requesting higher salary");

        // then
        assertThat(offer.getStatus()).isEqualTo(OfferStatus.NEGOTIATING);
        assertThat(offer.getNegotiationNotes()).isEqualTo("Requesting higher salary");
    }

    @Test
    @DisplayName("cancel: DRAFT -> CANCELLED 전환 성공")
    void cancel_fromDraft_success() {
        // given
        Offer offer = createDraftOffer();
        assertThat(offer.getStatus()).isEqualTo(OfferStatus.DRAFT);

        // when
        offer.cancel();

        // then
        assertThat(offer.getStatus()).isEqualTo(OfferStatus.CANCELLED);
    }

    @Test
    @DisplayName("cancel: ACCEPTED 상태에서 cancel 호출 시 예외 발생")
    void cancel_fromAccepted_throwsException() {
        // given
        Offer offer = createDraftOffer();
        offer.submitForApproval();
        offer.approve(APPROVER_ID);
        offer.send();
        offer.accept();
        assertThat(offer.getStatus()).isEqualTo(OfferStatus.ACCEPTED);

        // when & then
        assertThatThrownBy(offer::cancel)
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("취소");
    }
}
