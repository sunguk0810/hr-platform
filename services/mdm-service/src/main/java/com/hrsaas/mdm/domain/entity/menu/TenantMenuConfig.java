package com.hrsaas.mdm.domain.entity.menu;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Per-tenant menu configuration allowing customization of menu items.
 */
@Entity
@Table(
    name = "tenant_menu_config",
    schema = "tenant_common",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_tenant_menu_config",
            columnNames = {"tenant_id", "menu_item_id"}
        )
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantMenuConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @Column(name = "is_enabled", nullable = false)
    @Builder.Default
    private Boolean isEnabled = true;

    @Column(name = "custom_name", length = 100)
    private String customName;

    @Column(name = "custom_sort_order")
    private Integer customSortOrder;

    @Column(name = "show_in_mobile")
    private Boolean showInMobile;

    @Column(name = "mobile_sort_order")
    private Integer mobileSortOrder;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    /**
     * Check if this menu is enabled for the tenant.
     */
    public boolean isMenuEnabled() {
        return Boolean.TRUE.equals(isEnabled);
    }

    /**
     * Get the effective name (custom or default).
     */
    public String getEffectiveName(String defaultName) {
        return customName != null && !customName.isBlank() ? customName : defaultName;
    }

    /**
     * Get the effective sort order (custom or default).
     */
    public Integer getEffectiveSortOrder(Integer defaultSortOrder) {
        return customSortOrder != null ? customSortOrder : defaultSortOrder;
    }

    /**
     * Get the effective mobile visibility.
     */
    public Boolean getEffectiveShowInMobile(Boolean defaultShowInMobile) {
        return showInMobile != null ? showInMobile : defaultShowInMobile;
    }

    /**
     * Get the effective mobile sort order.
     */
    public Integer getEffectiveMobileSortOrder(Integer defaultMobileSortOrder) {
        return mobileSortOrder != null ? mobileSortOrder : defaultMobileSortOrder;
    }
}
