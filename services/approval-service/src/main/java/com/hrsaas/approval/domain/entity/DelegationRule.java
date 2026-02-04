package com.hrsaas.approval.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "delegation_rule", schema = "hr_approval")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DelegationRule extends TenantAwareEntity {

    @Column(name = "delegator_id", nullable = false)
    private UUID delegatorId;

    @Column(name = "delegator_name", nullable = false, length = 100)
    private String delegatorName;

    @Column(name = "delegate_id", nullable = false)
    private UUID delegateId;

    @Column(name = "delegate_name", nullable = false, length = 100)
    private String delegateName;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "document_types", length = 500)
    private String documentTypes; // comma-separated or JSON

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Builder
    public DelegationRule(UUID delegatorId, String delegatorName,
                         UUID delegateId, String delegateName,
                         LocalDate startDate, LocalDate endDate,
                         String documentTypes, String reason) {
        this.delegatorId = delegatorId;
        this.delegatorName = delegatorName;
        this.delegateId = delegateId;
        this.delegateName = delegateName;
        this.startDate = startDate;
        this.endDate = endDate;
        this.documentTypes = documentTypes;
        this.reason = reason;
        this.isActive = true;
    }

    public void activate() {
        this.isActive = true;
    }

    public void deactivate() {
        this.isActive = false;
    }

    public boolean isEffective() {
        LocalDate today = LocalDate.now();
        return isActive && !today.isBefore(startDate) && !today.isAfter(endDate);
    }

    public boolean isEffectiveForDocumentType(String documentType) {
        if (!isEffective()) {
            return false;
        }
        if (documentTypes == null || documentTypes.isBlank()) {
            return true; // all document types
        }
        return documentTypes.contains(documentType);
    }
}
