package com.hrsaas.mdm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.hrsaas")
@EnableFeignClients
@EnableScheduling
public class MdmServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(MdmServiceApplication.class, args);
    }
}
