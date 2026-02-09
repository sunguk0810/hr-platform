package com.hrsaas.employee.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "employee_card", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmployeeCard extends TenantAwareEntity {

    @Column(name = "card_number", nullable = false, length = 50)
    private String cardNumber;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CardStatus status = CardStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "issue_type", nullable = false, length = 20)
    private CardIssueType issueType = CardIssueType.NEW;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "access_level", length = 20)
    private String accessLevel = "LEVEL_1";

    @Column(name = "rfid_enabled")
    private Boolean rfidEnabled = false;

    @Column(name = "rfid_tag", length = 100)
    private String rfidTag;

    @Column(name = "qr_code", length = 100)
    private String qrCode;

    @Column(name = "photo_file_id")
    private UUID photoFileId;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "revoked_by")
    private UUID revokedBy;

    @Column(name = "revoke_reason", columnDefinition = "TEXT")
    private String revokeReason;

    @Column(name = "lost_at")
    private Instant lostAt;

    @Column(name = "lost_location", length = 200)
    private String lostLocation;

    @Column(name = "lost_description", columnDefinition = "TEXT")
    private String lostDescription;

    @Builder
    public EmployeeCard(String cardNumber, UUID employeeId, CardStatus status,
                        CardIssueType issueType, LocalDate issueDate, LocalDate expiryDate,
                        String accessLevel) {
        this.cardNumber = cardNumber;
        this.employeeId = employeeId;
        this.status = status != null ? status : CardStatus.ACTIVE;
        this.issueType = issueType != null ? issueType : CardIssueType.NEW;
        this.issueDate = issueDate;
        this.expiryDate = expiryDate;
        this.accessLevel = accessLevel != null ? accessLevel : "LEVEL_1";
    }

    public void markLost(String location, String description) {
        this.status = CardStatus.LOST;
        this.lostAt = Instant.now();
        this.lostLocation = location;
        this.lostDescription = description;
    }

    public void revoke(UUID revokedBy, String reason) {
        this.status = CardStatus.REVOKED;
        this.revokedAt = Instant.now();
        this.revokedBy = revokedBy;
        this.revokeReason = reason;
    }

    public void expire() {
        this.status = CardStatus.EXPIRED;
    }

    public boolean isActive() {
        return this.status == CardStatus.ACTIVE;
    }
}
