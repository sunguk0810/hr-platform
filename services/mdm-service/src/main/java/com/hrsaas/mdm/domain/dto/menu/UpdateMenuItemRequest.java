package com.hrsaas.mdm.domain.dto.menu;

import com.hrsaas.mdm.domain.entity.menu.MenuType;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Request DTO for updating an existing menu item.
 */
@Data
public class UpdateMenuItemRequest {

    private UUID parentId;

    @Size(max = 100, message = "이름은 100자 이내여야 합니다")
    private String name;

    @Size(max = 100, message = "영문 이름은 100자 이내여야 합니다")
    private String nameEn;

    @Size(max = 200, message = "경로는 200자 이내여야 합니다")
    private String path;

    @Size(max = 50, message = "아이콘은 50자 이내여야 합니다")
    private String icon;

    private MenuType menuType;

    @Size(max = 500, message = "외부 URL은 500자 이내여야 합니다")
    private String externalUrl;

    private Integer sortOrder;

    @Size(max = 50, message = "기능 코드는 50자 이내여야 합니다")
    private String featureCode;

    private Boolean isActive;

    private Boolean showInNav;

    private Boolean showInMobile;

    private Integer mobileSortOrder;

    /**
     * Required roles (replaces existing roles if provided)
     */
    private List<String> roles;

    /**
     * Required permissions (replaces existing permissions if provided)
     */
    private List<String> permissions;
}
