package com.hrsaas.attendance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication(scanBasePackages = {
    "com.hrsaas.attendance",
    "com.hrsaas.common"
})
@EnableCaching
public class AttendanceServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AttendanceServiceApplication.class, args);
    }
}
