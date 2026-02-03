package com.hrsaas.file;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication(scanBasePackages = {
    "com.hrsaas.file",
    "com.hrsaas.common"
})
@EnableCaching
public class FileServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(FileServiceApplication.class, args);
    }
}
