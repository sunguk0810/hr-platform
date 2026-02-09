package com.hrsaas.approval;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication(scanBasePackages = {
    "com.hrsaas.approval",
    "com.hrsaas.common"
})
@EnableCaching
@EnableFeignClients(basePackages = "com.hrsaas.approval.client")
public class ApprovalServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApprovalServiceApplication.class, args);
    }
}
