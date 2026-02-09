package com.hrsaas.mdm.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * 코드 그룹별 사용처 매핑 엔티티.
 * 영향도 분석 시 참조 테이블/서비스를 DB에서 관리합니다.
 */
@Entity
@Table(name = "code_usage_mapping", schema = "tenant_common")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CodeUsageMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "UUID DEFAULT gen_random_uuid()")
    private UUID id;

    @Column(name = "group_code", nullable = false, length = 50)
    private String groupCode;

    @Column(name = "resource_type", nullable = false, length = 20)
    private String resourceType;

    @Column(name = "resource_name", nullable = false, length = 100)
    private String resourceName;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "estimated_impact", length = 20)
    @Builder.Default
    private String estimatedImpact = "MEDIUM";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
