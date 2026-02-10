package com.hrsaas.appointment.domain.event;

import com.hrsaas.appointment.domain.entity.AppointmentType;
import com.hrsaas.common.event.DomainEvent;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * 발령 실행 이벤트 — Employee Service가 구독하여 직원 정보 갱신
 */
@Getter
@SuperBuilder
public class AppointmentExecutedEvent extends DomainEvent {

    private final UUID draftId;
    private final String draftNumber;
    private final LocalDate effectiveDate;
    private final List<AppointmentDetailInfo> details;

    @Override
    public String getTopic() {
        return "hr-saas-appointment-executed";
    }

    @Getter
    @SuperBuilder
    public static class AppointmentDetailInfo {
        private final UUID detailId;
        private final UUID employeeId;
        private final AppointmentType appointmentType;
        private final UUID toDepartmentId;
        private final String toPositionCode;
        private final String toGradeCode;
        private final String toJobCode;
    }
}
