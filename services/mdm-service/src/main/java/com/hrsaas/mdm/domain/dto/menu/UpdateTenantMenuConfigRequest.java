package com.hrsaas.mdm.domain.dto.menu;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request DTO for updating tenant-specific menu configuration.
 */
@Data
public class UpdateTenantMenuConfigRequest {

    private Boolean isEnabled;

    @Size(max = 100, message = "사용자 정의 이름은 100자 이내여야 합니다")
    private String customName;

    private Integer customSortOrder;

    private Boolean showInMobile;

    private Integer mobileSortOrder;
}
