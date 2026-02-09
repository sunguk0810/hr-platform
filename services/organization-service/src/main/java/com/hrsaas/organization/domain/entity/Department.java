package com.hrsaas.organization.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "department", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Department extends TenantAwareEntity {

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "name_en", length = 200)
    private String nameEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Department parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    @OrderBy("sortOrder ASC")
    @BatchSize(size = 50)  // Fetch up to 50 children collections in one query per level
    private List<Department> children = new ArrayList<>();

    @Column(name = "level", nullable = false)
    private Integer level = 1;

    @Column(name = "path", length = 500)
    private String path;

    @Column(name = "manager_id")
    private UUID managerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private DepartmentStatus status = DepartmentStatus.ACTIVE;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Builder
    public Department(String code, String name, String nameEn, Department parent,
                      UUID managerId, Integer sortOrder) {
        this.code = code;
        this.name = name;
        this.nameEn = nameEn;
        this.parent = parent;
        this.managerId = managerId;
        this.sortOrder = sortOrder;
        this.status = DepartmentStatus.ACTIVE;
        updateHierarchy();
    }

    public void updateHierarchy() {
        if (parent != null) {
            this.level = parent.getLevel() + 1;
            this.path = parent.getPath() + "/" + this.code;
        } else {
            this.level = 1;
            this.path = "/" + this.code;
        }
    }

    public void addChild(Department child) {
        children.add(child);
        child.setParent(this);
        child.updateHierarchy();
    }

    public void activate() {
        this.status = DepartmentStatus.ACTIVE;
    }

    public void deactivate() {
        this.status = DepartmentStatus.INACTIVE;
    }

    public boolean isActive() {
        return this.status == DepartmentStatus.ACTIVE;
    }
}
