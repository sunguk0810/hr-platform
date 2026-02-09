package com.hrsaas.employee.domain.dto.response;

import com.hrsaas.employee.domain.entity.Employee;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardBirthdayResponse {

    private List<BirthdayItem> today;
    private List<BirthdayItem> upcoming;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BirthdayItem {
        private UUID id;
        private String name;
        private String nameEn;
        private String departmentId;
        private String positionCode;
        private LocalDate birthDate;

        public static BirthdayItem from(Employee employee) {
            return BirthdayItem.builder()
                .id(employee.getId())
                .name(employee.getName())
                .nameEn(employee.getNameEn())
                .departmentId(employee.getDepartmentId() != null ? employee.getDepartmentId().toString() : null)
                .positionCode(employee.getPositionCode())
                .birthDate(employee.getBirthDate())
                .build();
        }
    }
}
