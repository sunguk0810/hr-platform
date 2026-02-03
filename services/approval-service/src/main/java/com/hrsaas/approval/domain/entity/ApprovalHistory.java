package com.hrsaas.approval.domain.entity;

import com.hrsaas.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Entity
@Table(name = "approval_history", schema = "hr_approval")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ApprovalHistory extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private ApprovalDocument document;

    @Column(name = "actor_id", nullable = false)
    private UUID actorId;

    @Column(name = "actor_name", nullable = false)
    private String actorName;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private ApprovalActionType actionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status")
    private ApprovalStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status")
    private ApprovalStatus toStatus;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "ip_address")
    private String ipAddress;
}
