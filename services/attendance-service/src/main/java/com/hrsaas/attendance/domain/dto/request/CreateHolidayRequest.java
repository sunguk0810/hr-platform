package com.hrsaas.attendance.domain.dto.request;

import com.hrsaas.attendance.domain.entity.HolidayType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateHolidayRequest {

    @NotNull(message = "휴일 날짜는 필수입니다")
    private LocalDate holidayDate;

    @NotBlank(message = "휴일명은 필수입니다")
    @Size(max = 100)
    private String name;

    @Size(max = 100)
    private String nameEn;

    @NotNull(message = "휴일 유형은 필수입니다")
    private HolidayType holidayType;

    private Boolean isPaid;

    @Size(max = 500)
    private String description;
}
