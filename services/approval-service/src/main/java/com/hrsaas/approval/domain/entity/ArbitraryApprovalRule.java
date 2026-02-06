package com.hrsaas.approval.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "arbitrary_approval_rule", schema = "hr_approval")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ArbitraryApprovalRule extends TenantAwareEntity {

    @Column(name = "document_type", length = 50)
    private String documentType;

    @Column(name = "condition_type", nullable = false, length = 20)
    private String conditionType; // AMOUNT, DAYS, GRADE

    @Column(name = "condition_operator", nullable = false, length = 10)
    private String conditionOperator; // LT, LTE, GT, GTE, EQ

    @Column(name = "condition_value", nullable = false, length = 100)
    private String conditionValue;

    @Column(name = "skip_to_sequence")
    private Integer skipToSequence;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "description", length = 500)
    private String description;

    public boolean evaluate(String actualValue) {
        if (actualValue == null) return false;

        try {
            double actual = Double.parseDouble(actualValue);
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
            return conditionOperator.equals("EQ") && conditionValue.equals(actualValue);
        }
    }

    public void activate() { this.isActive = true; }
    public void deactivate() { this.isActive = false; }
}
