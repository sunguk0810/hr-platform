package com.hrsaas.tenant.domain.dto.response;

import com.hrsaas.tenant.domain.entity.PlanType;
import com.hrsaas.tenant.domain.entity.TenantStatus;
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
public class TenantDetailResponse {

    private UUID id;
    private String code;
    private String name;
    private String nameEn;
    private String description;
    private String businessNumber;
    private String logoUrl;
    private TenantStatus status;
    private PlanType planType;

    private BrandingDto branding;
    private PoliciesDto policies;
    private SettingsDto settings;
    private List<FeatureDto> features;
    private HierarchyDto hierarchy;

    private Integer employeeCount;
    private Integer departmentCount;
    private String adminEmail;
    private String adminName;

    private LocalDate contractStartDate;
    private LocalDate contractEndDate;
    private UUID parentId;
    private String parentName;
    private Integer level;

    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;
}
