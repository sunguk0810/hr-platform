package com.hrsaas.recruitment.domain.event;

import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * 채용 확정 이벤트 — Employee Service가 구독하여 신규 직원 등록
 */
@Getter
@SuperBuilder
public class CandidateHiredEvent extends DomainEvent {

    private final UUID applicationId;
    private final UUID offerId;
    private final String applicantName;
    private final String applicantEmail;
    private final String applicantPhone;
    private final LocalDate birthDate;
    private final String gender;
    private final String address;
    private final UUID departmentId;
    private final String departmentName;
    private final String positionTitle;
    private final String gradeCode;
    private final String gradeName;
    private final LocalDate startDate;
    private final String employmentType;
    private final BigDecimal baseSalary;
    private final Integer probationMonths;

    @Override
    public String getTopic() {
        return EventTopics.RECRUITMENT_HIRED;
    }
}
