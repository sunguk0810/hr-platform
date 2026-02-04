package com.hrsaas.appointment.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentStatisticsResponse {

    private String period;
    private long total;
    private List<TypeCount> byType;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TypeCount {
        private String type;
        private String typeName;
        private long count;
    }
}
