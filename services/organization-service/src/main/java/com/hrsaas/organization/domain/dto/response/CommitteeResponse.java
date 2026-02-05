package com.hrsaas.organization.domain.dto.response;

import com.hrsaas.organization.domain.entity.Committee;
import com.hrsaas.organization.domain.entity.CommitteeMember;
import com.hrsaas.organization.domain.entity.CommitteeMemberRole;
import com.hrsaas.organization.domain.entity.CommitteeStatus;
import com.hrsaas.organization.domain.entity.CommitteeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommitteeResponse {

    private UUID id;
    private String code;
    private String name;
    private String nameEn;
    private CommitteeType type;
    private String purpose;
    private LocalDate startDate;
    private LocalDate endDate;
    private String meetingSchedule;
    private CommitteeStatus status;
    private Integer memberCount;
    private List<MemberResponse> members;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberResponse {
        private UUID id;
        private UUID employeeId;
        private String employeeName;
        private String departmentName;
        private String positionName;
        private CommitteeMemberRole role;
        private LocalDate joinDate;
        private LocalDate leaveDate;
        private Boolean isActive;

        public static MemberResponse from(CommitteeMember member) {
            return MemberResponse.builder()
                .id(member.getId())
                .employeeId(member.getEmployeeId())
                .employeeName(member.getEmployeeName())
                .departmentName(member.getDepartmentName())
                .positionName(member.getPositionName())
                .role(member.getRole())
                .joinDate(member.getJoinDate())
                .leaveDate(member.getLeaveDate())
                .isActive(member.getIsActive())
                .build();
        }
    }

    public static CommitteeResponse from(Committee committee) {
        return CommitteeResponse.builder()
            .id(committee.getId())
            .code(committee.getCode())
            .name(committee.getName())
            .nameEn(committee.getNameEn())
            .type(committee.getType())
            .purpose(committee.getPurpose())
            .startDate(committee.getStartDate())
            .endDate(committee.getEndDate())
            .meetingSchedule(committee.getMeetingSchedule())
            .status(committee.getStatus())
            .memberCount(committee.getMembers() != null
                ? (int) committee.getMembers().stream().filter(CommitteeMember::getIsActive).count()
                : 0)
            .createdAt(committee.getCreatedAt())
            .updatedAt(committee.getUpdatedAt())
            .build();
    }

    public static CommitteeResponse fromWithMembers(Committee committee) {
        CommitteeResponse response = from(committee);
        if (committee.getMembers() != null) {
            response.setMembers(committee.getMembers().stream()
                .filter(CommitteeMember::getIsActive)
                .map(MemberResponse::from)
                .toList());
        }
        return response;
    }
}
