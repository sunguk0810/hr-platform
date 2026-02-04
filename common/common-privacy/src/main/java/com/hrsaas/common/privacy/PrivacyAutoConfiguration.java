package com.hrsaas.common.privacy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.hrsaas.common.privacy.serializer.MaskedFieldSerializer;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;

/**
 * Auto-configuration for privacy module.
 * Automatically registers the MaskingService and configures Jackson for @Masked annotation support.
 */
@AutoConfiguration
@ComponentScan(basePackages = "com.hrsaas.common.privacy")
public class PrivacyAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public MaskingService maskingService() {
        return new MaskingService();
    }

    @Bean
    @ConditionalOnClass(ObjectMapper.class)
    public SimpleModule maskedFieldModule() {
        SimpleModule module = new SimpleModule("MaskedFieldModule");
        module.addSerializer(String.class, new MaskedFieldSerializer());
        return module;
    }
}
