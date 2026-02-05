package com.hrsaas.organization.domain.dto.request;

import com.hrsaas.organization.domain.entity.CommitteeMemberRole;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddCommitteeMemberRequest {

    @NotNull(message = "직원 ID는 필수입니다.")
    private UUID employeeId;

    private String employeeName;

    private String departmentName;

    private String positionName;

    private CommitteeMemberRole role;

    private LocalDate joinDate;
}
