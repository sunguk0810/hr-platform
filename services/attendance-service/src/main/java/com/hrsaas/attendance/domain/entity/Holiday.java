package com.hrsaas.attendance.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "holiday", schema = "hr_attendance",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "holiday_date"}))
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Holiday extends TenantAwareEntity {

    @Column(name = "holiday_date", nullable = false)
    private LocalDate holidayDate;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "name_en", length = 100)
    private String nameEn;

    @Enumerated(EnumType.STRING)
    @Column(name = "holiday_type", nullable = false, length = 20)
    private HolidayType holidayType;

    @Column(name = "is_paid", nullable = false)
    private Boolean isPaid = true;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Builder
    public Holiday(LocalDate holidayDate, String name, String nameEn,
                   HolidayType holidayType, Boolean isPaid, String description) {
        this.holidayDate = holidayDate;
        this.name = name;
        this.nameEn = nameEn;
        this.holidayType = holidayType;
        this.isPaid = isPaid != null ? isPaid : true;
        this.description = description;
        this.year = holidayDate.getYear();
    }
}
