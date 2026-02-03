package com.hrsaas.common.cache;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Redis cache configuration.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(30))
            .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()))
            .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // Configure specific cache TTLs
        cacheConfigurations.put(CacheNames.TENANT, defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put(CacheNames.TENANT_POLICY, defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put(CacheNames.COMMON_CODE, defaultConfig.entryTtl(Duration.ofHours(24)));
        cacheConfigurations.put(CacheNames.CODE_GROUP, defaultConfig.entryTtl(Duration.ofHours(24)));
        cacheConfigurations.put(CacheNames.EMPLOYEE, defaultConfig.entryTtl(Duration.ofMinutes(15)));
        cacheConfigurations.put(CacheNames.DEPARTMENT, defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put(CacheNames.ORGANIZATION_TREE, defaultConfig.entryTtl(Duration.ofHours(1)));

        return RedisCacheManager.builder(redisConnectionFactory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(cacheConfigurations)
            .transactionAware()
            .build();
    }
}
