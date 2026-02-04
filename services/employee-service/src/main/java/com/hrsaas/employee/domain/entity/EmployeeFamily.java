package com.hrsaas.employee.domain.entity;

import com.hrsaas.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "employee_family", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmployeeFamily extends BaseEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "relation", nullable = false, length = 20)
    private FamilyRelationType relation;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "occupation", length = 100)
    private String occupation;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "is_cohabiting")
    private Boolean isCohabiting = false;

    @Column(name = "is_dependent")
    private Boolean isDependent = false;

    @Column(name = "remarks", length = 500)
    private String remarks;

    @Builder
    public EmployeeFamily(UUID employeeId, FamilyRelationType relation, String name,
                          LocalDate birthDate, String occupation, String phone,
                          Boolean isCohabiting, Boolean isDependent, String remarks) {
        this.employeeId = employeeId;
        this.relation = relation;
        this.name = name;
        this.birthDate = birthDate;
        this.occupation = occupation;
        this.phone = phone;
        this.isCohabiting = isCohabiting != null ? isCohabiting : false;
        this.isDependent = isDependent != null ? isDependent : false;
        this.remarks = remarks;
    }

    public void update(String name, LocalDate birthDate, String occupation,
                       String phone, Boolean isCohabiting, Boolean isDependent, String remarks) {
        if (name != null) this.name = name;
        if (birthDate != null) this.birthDate = birthDate;
        if (occupation != null) this.occupation = occupation;
        if (phone != null) this.phone = phone;
        if (isCohabiting != null) this.isCohabiting = isCohabiting;
        if (isDependent != null) this.isDependent = isDependent;
        if (remarks != null) this.remarks = remarks;
    }
}
