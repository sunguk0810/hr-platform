package com.hrsaas.mdm.domain.entity.menu;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Permission requirement for a menu item.
 * Can be either a role-based or action-based permission.
 */
@Entity
@Table(
    name = "menu_permission",
    schema = "tenant_common",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_menu_permission",
            columnNames = {"menu_item_id", "permission_type", "permission_value"}
        )
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @ColumnDefault("gen_random_uuid()")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id", nullable = false)
    @JsonIgnore
    private MenuItem menuItem;

    @Enumerated(EnumType.STRING)
    @Column(name = "permission_type", nullable = false, length = 20)
    private PermissionType permissionType;

    @Column(name = "permission_value", nullable = false, length = 50)
    private String permissionValue;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @ColumnDefault("CURRENT_TIMESTAMP")
    private OffsetDateTime createdAt;

    /**
     * Create a role-based permission requirement.
     */
    public static MenuPermission ofRole(String role) {
        return MenuPermission.builder()
            .permissionType(PermissionType.ROLE)
            .permissionValue(role)
            .build();
    }

    /**
     * Create an action-based permission requirement.
     */
    public static MenuPermission ofPermission(String permission) {
        return MenuPermission.builder()
            .permissionType(PermissionType.PERMISSION)
            .permissionValue(permission)
            .build();
    }

    /**
     * Check if this is a role-based permission.
     */
    public boolean isRole() {
        return PermissionType.ROLE.equals(permissionType);
    }

    /**
     * Check if this is an action-based permission.
     */
    public boolean isPermission() {
        return PermissionType.PERMISSION.equals(permissionType);
    }
}
