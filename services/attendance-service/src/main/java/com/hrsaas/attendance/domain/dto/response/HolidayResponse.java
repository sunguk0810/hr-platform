package com.hrsaas.attendance.domain.dto.response;

import com.hrsaas.attendance.domain.entity.Holiday;
import com.hrsaas.attendance.domain.entity.HolidayType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HolidayResponse {

    private UUID id;
    private LocalDate holidayDate;
    private String name;
    private String nameEn;
    private HolidayType holidayType;
    private Boolean isPaid;
    private String description;
    private Integer year;
    private Instant createdAt;

    public static HolidayResponse from(Holiday holiday) {
        return HolidayResponse.builder()
            .id(holiday.getId())
            .holidayDate(holiday.getHolidayDate())
            .name(holiday.getName())
            .nameEn(holiday.getNameEn())
            .holidayType(holiday.getHolidayType())
            .isPaid(holiday.getIsPaid())
            .description(holiday.getDescription())
            .year(holiday.getYear())
            .createdAt(holiday.getCreatedAt())
            .build();
    }
}
