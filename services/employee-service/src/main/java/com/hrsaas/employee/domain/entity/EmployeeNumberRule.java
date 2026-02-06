package com.hrsaas.employee.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * Configuration entity defining the pattern for auto-generating employee numbers per tenant.
 * Supports prefix, year inclusion, sequence digits, separator, and reset policies.
 */
@Entity
@Table(name = "employee_number_rule", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class EmployeeNumberRule extends TenantAwareEntity {

    @Column(name = "prefix", length = 10)
    @Builder.Default
    private String prefix = "";

    @Column(name = "include_year", nullable = false)
    @Builder.Default
    private Boolean includeYear = true;

    @Column(name = "year_format", length = 4)
    @Builder.Default
    private String yearFormat = "YYYY"; // YY or YYYY

    @Column(name = "sequence_digits", nullable = false)
    @Builder.Default
    private Integer sequenceDigits = 4;

    @Column(name = "sequence_reset_policy", length = 10)
    @Builder.Default
    private String sequenceResetPolicy = "YEARLY"; // YEARLY, NEVER

    @Column(name = "current_sequence", nullable = false)
    @Builder.Default
    private Integer currentSequence = 0;

    @Column(name = "current_year")
    private Integer currentYear;

    @Column(name = "separator", length = 5)
    @Builder.Default
    private String separator = "-";

    @Column(name = "allow_reuse", nullable = false)
    @Builder.Default
    private Boolean allowReuse = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * Get the next sequence number, resetting if the year has changed (when YEARLY policy is used).
     *
     * @param year the year to use for sequence generation
     * @return the next sequence number
     */
    public int getNextSequence(int year) {
        if ("YEARLY".equals(sequenceResetPolicy) && (currentYear == null || currentYear != year)) {
            this.currentYear = year;
            this.currentSequence = 1;
        } else {
            this.currentSequence++;
        }
        return this.currentSequence;
    }
}
