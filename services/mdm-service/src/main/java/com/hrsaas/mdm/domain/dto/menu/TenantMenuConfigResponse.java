package com.hrsaas.mdm.domain.dto.menu;

import com.hrsaas.mdm.domain.entity.menu.TenantMenuConfig;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/**
 * Response DTO for tenant menu configuration.
 */
@Data
@Builder
public class TenantMenuConfigResponse {

    private UUID id;
    private UUID tenantId;
    private UUID menuItemId;
    private String menuCode;
    private String menuName;
    private Boolean isEnabled;
    private String customName;
    private Integer customSortOrder;
    private Boolean showInMobile;
    private Integer mobileSortOrder;

    /**
     * Convert entity to response DTO.
     */
    public static TenantMenuConfigResponse from(TenantMenuConfig entity) {
        if (entity == null) {
            return null;
        }

        return TenantMenuConfigResponse.builder()
            .id(entity.getId())
            .tenantId(entity.getTenantId())
            .menuItemId(entity.getMenuItem().getId())
            .menuCode(entity.getMenuItem().getCode())
            .menuName(entity.getMenuItem().getName())
            .isEnabled(entity.getIsEnabled())
            .customName(entity.getCustomName())
            .customSortOrder(entity.getCustomSortOrder())
            .showInMobile(entity.getShowInMobile())
            .mobileSortOrder(entity.getMobileSortOrder())
            .build();
    }
}
