package com.hrsaas.auth.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_mfa", schema = "tenant_common",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "mfa_type"}))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserMfa {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "mfa_type", nullable = false, length = 20)
    @Builder.Default
    private String mfaType = "TOTP";

    @Column(name = "secret_key", nullable = false, length = 255)
    private String secretKey;

    @Column(name = "is_enabled")
    @Builder.Default
    private boolean enabled = false;

    @Column(name = "verified_at")
    private OffsetDateTime verifiedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}
