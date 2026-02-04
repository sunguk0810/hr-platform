package com.hrsaas.organization.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "grade", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Grade extends TenantAwareEntity {

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "name_en", length = 100)
    private String nameEn;

    @Column(name = "level", nullable = false)
    private Integer level;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Builder
    public Grade(String code, String name, String nameEn, Integer level, Integer sortOrder) {
        this.code = code;
        this.name = name;
        this.nameEn = nameEn;
        this.level = level;
        this.sortOrder = sortOrder;
        this.isActive = true;
    }

    public void activate() {
        this.isActive = true;
    }

    public void deactivate() {
        this.isActive = false;
    }

    public void update(String name, String nameEn, Integer level, Integer sortOrder) {
        if (name != null) {
            this.name = name;
        }
        if (nameEn != null) {
            this.nameEn = nameEn;
        }
        if (level != null) {
            this.level = level;
        }
        if (sortOrder != null) {
            this.sortOrder = sortOrder;
        }
    }
}
