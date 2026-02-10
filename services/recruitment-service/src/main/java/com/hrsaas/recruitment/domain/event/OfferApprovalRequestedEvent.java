package com.hrsaas.recruitment.domain.event;

import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * 오퍼 승인 요청 이벤트
 */
@Getter
@SuperBuilder
public class OfferApprovalRequestedEvent extends DomainEvent {

    private final UUID offerId;
    private final String offerNumber;
    private final UUID applicationId;
    private final String applicantName;
    private final String positionTitle;
    private final BigDecimal baseSalary;
    private final LocalDate startDate;

    @Override
    public String getTopic() {
        return EventTopics.RECRUITMENT_OFFER_APPROVAL_REQUESTED;
    }
}
