package com.hrsaas.attendance.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.time.LocalTime;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "attendance")
public class AttendanceProperties {
    private LocalTime standardStartTime = LocalTime.of(9, 0);
    private LocalTime standardEndTime = LocalTime.of(18, 0);
}
