package com.hrsaas.employee.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * 개인정보 열람 감사 로그 엔티티
 */
@Entity
@Table(name = "privacy_access_log", schema = "hr_core")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PrivacyAccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "actor_id", nullable = false)
    private UUID actorId;

    @Column(name = "actor_name", length = 100)
    private String actorName;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "field_name", nullable = false, length = 50)
    private String fieldName;

    @Column(name = "reason", nullable = false, length = 500)
    private String reason;

    @Column(name = "accessed_at", nullable = false)
    private Instant accessedAt;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Builder
    public PrivacyAccessLog(UUID tenantId, UUID actorId, String actorName,
                            UUID employeeId, String fieldName, String reason,
                            String ipAddress) {
        this.tenantId = tenantId;
        this.actorId = actorId;
        this.actorName = actorName;
        this.employeeId = employeeId;
        this.fieldName = fieldName;
        this.reason = reason;
        this.ipAddress = ipAddress;
        this.accessedAt = Instant.now();
        this.createdAt = Instant.now();
    }
}
