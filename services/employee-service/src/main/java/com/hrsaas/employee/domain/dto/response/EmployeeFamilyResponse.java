package com.hrsaas.employee.domain.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.hrsaas.common.privacy.Masked;
import com.hrsaas.common.privacy.MaskType;
import com.hrsaas.common.privacy.serializer.MaskedFieldSerializer;
import com.hrsaas.employee.domain.entity.EmployeeFamily;
import com.hrsaas.employee.domain.entity.FamilyRelationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeFamilyResponse {

    private UUID id;
    private UUID employeeId;
    private FamilyRelationType relation;

    @Masked(type = MaskType.NAME)
    @JsonSerialize(using = MaskedFieldSerializer.class)
    private String name;

    private LocalDate birthDate;
    private String occupation;

    @Masked(type = MaskType.PHONE)
    @JsonSerialize(using = MaskedFieldSerializer.class)
    private String phone;
    private Boolean isCohabiting;
    private Boolean isDependent;
    private String remarks;
    private Instant createdAt;
    private Instant updatedAt;

    public static EmployeeFamilyResponse from(EmployeeFamily family) {
        return EmployeeFamilyResponse.builder()
            .id(family.getId())
            .employeeId(family.getEmployeeId())
            .relation(family.getRelation())
            .name(family.getName())
            .birthDate(family.getBirthDate())
            .occupation(family.getOccupation())
            .phone(family.getPhone())
            .isCohabiting(family.getIsCohabiting())
            .isDependent(family.getIsDependent())
            .remarks(family.getRemarks())
            .createdAt(family.getCreatedAt())
            .updatedAt(family.getUpdatedAt())
            .build();
    }
}
