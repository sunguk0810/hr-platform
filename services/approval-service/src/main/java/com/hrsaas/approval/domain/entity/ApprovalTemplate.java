package com.hrsaas.approval.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "approval_template", schema = "hr_approval")
@NamedEntityGraph(
    name = "ApprovalTemplate.withLines",
    attributeNodes = @NamedAttributeNode("templateLines")
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ApprovalTemplate extends TenantAwareEntity {

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "document_type", nullable = false, length = 50)
    private String documentType;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequence ASC")
    private List<ApprovalTemplateLine> templateLines = new ArrayList<>();

    @Builder
    public ApprovalTemplate(String code, String name, String documentType,
                           String description, Integer sortOrder) {
        this.code = code;
        this.name = name;
        this.documentType = documentType;
        this.description = description;
        this.sortOrder = sortOrder;
        this.isActive = true;
    }

    public void addTemplateLine(ApprovalTemplateLine line) {
        templateLines.add(line);
        line.setTemplate(this);
        line.setSequence(templateLines.size());
    }

    public void clearTemplateLines() {
        templateLines.clear();
    }

    public void activate() {
        this.isActive = true;
    }

    public void deactivate() {
        this.isActive = false;
    }

    public void update(String name, String description, Integer sortOrder) {
        if (name != null) {
            this.name = name;
        }
        if (description != null) {
            this.description = description;
        }
        if (sortOrder != null) {
            this.sortOrder = sortOrder;
        }
    }
}
