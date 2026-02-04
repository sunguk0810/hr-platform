package com.hrsaas.appointment.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/**
 * 발령 이력 Entity
 */
@Entity
@Table(name = "appointment_history", schema = "hr_appointment")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AppointmentHistory extends TenantAwareEntity {

    @Column(name = "detail_id")
    private UUID detailId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name", length = 100)
    private String employeeName;

    @Column(name = "employee_number", length = 50)
    private String employeeNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "appointment_type", nullable = false, length = 30)
    private AppointmentType appointmentType;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "from_values", columnDefinition = "jsonb")
    private Map<String, Object> fromValues;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "to_values", columnDefinition = "jsonb")
    private Map<String, Object> toValues;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "draft_number", length = 50)
    private String draftNumber;

    @Builder
    public AppointmentHistory(UUID detailId, UUID employeeId, String employeeName,
                              String employeeNumber, AppointmentType appointmentType,
                              LocalDate effectiveDate, Map<String, Object> fromValues,
                              Map<String, Object> toValues, String reason, String draftNumber) {
        this.detailId = detailId;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.employeeNumber = employeeNumber;
        this.appointmentType = appointmentType;
        this.effectiveDate = effectiveDate;
        this.fromValues = fromValues;
        this.toValues = toValues;
        this.reason = reason;
        this.draftNumber = draftNumber;
    }
}
