package com.hrsaas.organization.domain.entity;

import com.hrsaas.common.entity.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * 위원회 멤버 엔티티
 */
@Entity
@Table(name = "committee_member", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CommitteeMember extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "committee_id", nullable = false)
    private Committee committee;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name", length = 100)
    private String employeeName;

    @Column(name = "department_name", length = 200)
    private String departmentName;

    @Column(name = "position_name", length = 100)
    private String positionName;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private CommitteeMemberRole role = CommitteeMemberRole.MEMBER;

    @Column(name = "join_date")
    private LocalDate joinDate;

    @Column(name = "leave_date")
    private LocalDate leaveDate;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Builder
    public CommitteeMember(Committee committee, UUID employeeId, String employeeName,
                           String departmentName, String positionName,
                           CommitteeMemberRole role, LocalDate joinDate) {
        this.committee = committee;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.departmentName = departmentName;
        this.positionName = positionName;
        this.role = role != null ? role : CommitteeMemberRole.MEMBER;
        this.joinDate = joinDate != null ? joinDate : LocalDate.now();
        this.isActive = true;
    }

    public void update(CommitteeMemberRole role, LocalDate joinDate, LocalDate leaveDate) {
        if (role != null) {
            this.role = role;
        }
        if (joinDate != null) {
            this.joinDate = joinDate;
        }
        if (leaveDate != null) {
            this.leaveDate = leaveDate;
        }
    }

    public void leave() {
        this.isActive = false;
        this.leaveDate = LocalDate.now();
    }

    public void reactivate() {
        this.isActive = true;
        this.leaveDate = null;
    }
}
