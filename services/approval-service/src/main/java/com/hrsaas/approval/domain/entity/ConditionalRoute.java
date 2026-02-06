package com.hrsaas.approval.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Entity
@Table(name = "conditional_route", schema = "hr_approval")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ConditionalRoute extends TenantAwareEntity {

    @Column(name = "template_id", nullable = false)
    private UUID templateId;

    @Column(name = "condition_field", nullable = false, length = 50)
    private String conditionField; // amount, days, leave_type

    @Column(name = "condition_operator", nullable = false, length = 10)
    private String conditionOperator; // LT, LTE, GT, GTE, EQ

    @Column(name = "condition_value", nullable = false, length = 100)
    private String conditionValue;

    @Column(name = "target_template_id", nullable = false)
    private UUID targetTemplateId;

    @Column(name = "priority")
    @Builder.Default
    private Integer priority = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    public boolean evaluate(String fieldValue) {
        if (fieldValue == null) return false;

        try {
            double actual = Double.parseDouble(fieldValue);
            double condition = Double.parseDouble(conditionValue);

            return switch (conditionOperator) {
                case "LT" -> actual < condition;
                case "LTE" -> actual <= condition;
                case "GT" -> actual > condition;
                case "GTE" -> actual >= condition;
                case "EQ" -> actual == condition;
                default -> false;
            };
        } catch (NumberFormatException e) {
            return conditionOperator.equals("EQ") && conditionValue.equals(fieldValue);
        }
    }
}
