package com.hrsaas.mdm.domain.dto.menu;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Request DTO for reordering menu items.
 */
@Data
public class MenuReorderRequest {

    @NotEmpty(message = "순서 정보는 필수입니다")
    private List<MenuOrderItem> items;

    @Data
    public static class MenuOrderItem {
        @NotNull(message = "메뉴 ID는 필수입니다")
        private UUID id;

        @NotNull(message = "정렬 순서는 필수입니다")
        private Integer sortOrder;

        /**
         * Optional parent ID for moving to a different parent
         */
        private UUID parentId;
    }
}
