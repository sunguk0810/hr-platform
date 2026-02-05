package com.hrsaas.mdm.domain.entity.menu;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Menu item entity representing a navigation menu entry.
 */
@Entity
@Table(name = "menu_item", schema = "tenant_common")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @ColumnDefault("gen_random_uuid()")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private MenuItem parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<MenuItem> children = new ArrayList<>();

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "name_en", length = 100)
    private String nameEn;

    @Column(length = 200)
    private String path;

    @Column(length = 50)
    private String icon;

    @Enumerated(EnumType.STRING)
    @Column(name = "menu_type", nullable = false, length = 20)
    @ColumnDefault("'INTERNAL'")
    @Builder.Default
    private MenuType menuType = MenuType.INTERNAL;

    @Column(name = "external_url", length = 500)
    private String externalUrl;

    @Column(nullable = false)
    @ColumnDefault("1")
    @Builder.Default
    private Integer level = 1;

    @Column(name = "sort_order", nullable = false)
    @ColumnDefault("0")
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "feature_code", length = 50)
    private String featureCode;

    @Column(name = "is_system", nullable = false)
    @ColumnDefault("true")
    @Builder.Default
    private Boolean isSystem = true;

    @Column(name = "is_active", nullable = false)
    @ColumnDefault("true")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "show_in_nav", nullable = false)
    @ColumnDefault("true")
    @Builder.Default
    private Boolean showInNav = true;

    @Column(name = "show_in_mobile", nullable = false)
    @ColumnDefault("false")
    @Builder.Default
    private Boolean showInMobile = false;

    @Column(name = "mobile_sort_order")
    private Integer mobileSortOrder;

    @OneToMany(mappedBy = "menuItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MenuPermission> permissions = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @ColumnDefault("CURRENT_TIMESTAMP")
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    @ColumnDefault("CURRENT_TIMESTAMP")
    private OffsetDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    // Helper methods

    public void addChild(MenuItem child) {
        children.add(child);
        child.setParent(this);
        child.setLevel(this.level + 1);
    }

    public void removeChild(MenuItem child) {
        children.remove(child);
        child.setParent(null);
    }

    public void addPermission(MenuPermission permission) {
        permissions.add(permission);
        permission.setMenuItem(this);
    }

    public void removePermission(MenuPermission permission) {
        permissions.remove(permission);
        permission.setMenuItem(null);
    }

    public boolean hasParent() {
        return parent != null;
    }

    public boolean hasChildren() {
        return children != null && !children.isEmpty();
    }

    public boolean isTopLevel() {
        return level == 1;
    }
}
