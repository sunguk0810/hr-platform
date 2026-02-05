package com.hrsaas.mdm.domain.dto.menu;

import com.hrsaas.mdm.domain.entity.menu.MenuType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Request DTO for creating a new menu item.
 */
@Data
public class CreateMenuItemRequest {

    private UUID parentId;

    @NotBlank(message = "코드는 필수입니다")
    @Size(max = 50, message = "코드는 50자 이내여야 합니다")
    private String code;

    @NotBlank(message = "이름은 필수입니다")
    @Size(max = 100, message = "이름은 100자 이내여야 합니다")
    private String name;

    @Size(max = 100, message = "영문 이름은 100자 이내여야 합니다")
    private String nameEn;

    @Size(max = 200, message = "경로는 200자 이내여야 합니다")
    private String path;

    @Size(max = 50, message = "아이콘은 50자 이내여야 합니다")
    private String icon;

    private MenuType menuType = MenuType.INTERNAL;

    @Size(max = 500, message = "외부 URL은 500자 이내여야 합니다")
    private String externalUrl;

    private Integer sortOrder = 0;

    @Size(max = 50, message = "기능 코드는 50자 이내여야 합니다")
    private String featureCode;

    private Boolean isSystem = false;

    private Boolean showInNav = true;

    private Boolean showInMobile = false;

    private Integer mobileSortOrder;

    /**
     * Required roles (e.g., ["HR_MANAGER", "TENANT_ADMIN"])
     */
    private List<String> roles;

    /**
     * Required permissions (e.g., ["employee:read", "attendance:write"])
     */
    private List<String> permissions;
}
