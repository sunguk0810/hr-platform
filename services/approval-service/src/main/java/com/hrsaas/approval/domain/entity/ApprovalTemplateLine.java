package com.hrsaas.approval.domain.entity;

import com.hrsaas.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "approval_template_line", schema = "hr_approval")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ApprovalTemplateLine extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private ApprovalTemplate template;

    @Column(name = "sequence", nullable = false)
    private Integer sequence;

    @Enumerated(EnumType.STRING)
    @Column(name = "line_type", nullable = false, length = 20)
    private ApprovalLineType lineType = ApprovalLineType.SEQUENTIAL;

    @Column(name = "approver_type", nullable = false, length = 30)
    private String approverType; // SPECIFIC_USER, DEPARTMENT_HEAD, POSITION_HOLDER, DRAFTER_MANAGER

    @Column(name = "approver_id")
    private UUID approverId;

    @Column(name = "approver_name", length = 100)
    private String approverName;

    @Column(name = "position_code", length = 50)
    private String positionCode;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "description", length = 200)
    private String description;

    @Builder
    public ApprovalTemplateLine(ApprovalLineType lineType, String approverType,
                                UUID approverId, String approverName,
                                String positionCode, UUID departmentId, String description) {
        this.lineType = lineType != null ? lineType : ApprovalLineType.SEQUENTIAL;
        this.approverType = approverType;
        this.approverId = approverId;
        this.approverName = approverName;
        this.positionCode = positionCode;
        this.departmentId = departmentId;
        this.description = description;
    }
}
