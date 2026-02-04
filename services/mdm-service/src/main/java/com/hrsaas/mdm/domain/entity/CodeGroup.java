package com.hrsaas.mdm.domain.entity;

import com.hrsaas.common.entity.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "code_group", schema = "tenant_common")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CodeGroup extends AuditableEntity {

    @Column(name = "tenant_id")
    private UUID tenantId; // null for system codes

    @Column(name = "group_code", nullable = false, length = 50)
    private String groupCode;

    @Column(name = "group_name", nullable = false, length = 100)
    private String groupName;

    @Column(name = "group_name_en", length = 100)
    private String groupNameEn;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "is_system", nullable = false)
    private boolean system = false;

    @Column(name = "is_hierarchical", nullable = false)
    private boolean hierarchical = false;

    @Column(name = "max_level")
    private Integer maxLevel = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CodeStatus status = CodeStatus.ACTIVE;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @OneToMany(mappedBy = "codeGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<CommonCode> codes = new ArrayList<>();

    @Builder
    public CodeGroup(UUID tenantId, String groupCode, String groupName, String groupNameEn,
                     String description, boolean system, boolean hierarchical,
                     Integer maxLevel, Integer sortOrder) {
        this.tenantId = tenantId;
        this.groupCode = groupCode;
        this.groupName = groupName;
        this.groupNameEn = groupNameEn;
        this.description = description;
        this.system = system;
        this.hierarchical = hierarchical;
        this.maxLevel = maxLevel != null ? maxLevel : 1;
        this.sortOrder = sortOrder;
        this.status = CodeStatus.ACTIVE;
        this.active = true;
    }

    public void addCode(CommonCode code) {
        codes.add(code);
        code.setCodeGroup(this);
    }

    public void removeCode(CommonCode code) {
        codes.remove(code);
        code.setCodeGroup(null);
    }

    public boolean isSystemCode() {
        return system || tenantId == null;
    }

    public void activate() {
        this.status = CodeStatus.ACTIVE;
        this.active = true;
    }

    public void deactivate() {
        this.status = CodeStatus.INACTIVE;
        this.active = false;
    }

    public void deprecate() {
        this.status = CodeStatus.DEPRECATED;
        this.active = false;
    }

    public void update(String groupName, String groupNameEn, String description,
                       Boolean hierarchical, Integer maxLevel, Integer sortOrder) {
        if (groupName != null) {
            this.groupName = groupName;
        }
        if (groupNameEn != null) {
            this.groupNameEn = groupNameEn;
        }
        if (description != null) {
            this.description = description;
        }
        if (hierarchical != null) {
            this.hierarchical = hierarchical;
        }
        if (maxLevel != null) {
            this.maxLevel = maxLevel;
        }
        if (sortOrder != null) {
            this.sortOrder = sortOrder;
        }
    }
}
