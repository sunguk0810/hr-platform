package com.hrsaas.gateway.config;

import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.timelimiter.TimeLimiterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.circuitbreaker.resilience4j.ReactiveResilience4JCircuitBreakerFactory;
import org.springframework.cloud.circuitbreaker.resilience4j.Resilience4JConfigBuilder;
import org.springframework.cloud.client.circuitbreaker.Customizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Circuit breaker configuration for downstream services.
 */
@Slf4j
@Configuration
public class CircuitBreakerConfig {

    @Bean
    public Customizer<ReactiveResilience4JCircuitBreakerFactory> defaultCustomizer(
            CircuitBreakerRegistry circuitBreakerRegistry,
            TimeLimiterRegistry timeLimiterRegistry) {

        return factory -> {
            factory.configureDefault(id -> new Resilience4JConfigBuilder(id)
                .circuitBreakerConfig(circuitBreakerRegistry.getConfiguration("default")
                    .orElse(io.github.resilience4j.circuitbreaker.CircuitBreakerConfig.ofDefaults()))
                .timeLimiterConfig(timeLimiterRegistry.getConfiguration("default")
                    .orElse(io.github.resilience4j.timelimiter.TimeLimiterConfig.custom()
                        .timeoutDuration(Duration.ofSeconds(30))
                        .build()))
                .build());

            // Register event consumers for monitoring
            circuitBreakerRegistry.getAllCircuitBreakers().forEach(cb -> {
                cb.getEventPublisher()
                    .onStateTransition(event ->
                        log.info("CircuitBreaker {} state changed: {} -> {}",
                            event.getCircuitBreakerName(),
                            event.getStateTransition().getFromState(),
                            event.getStateTransition().getToState()))
                    .onFailureRateExceeded(event ->
                        log.warn("CircuitBreaker {} failure rate exceeded: {}%",
                            event.getCircuitBreakerName(),
                            event.getFailureRate()))
                    .onSlowCallRateExceeded(event ->
                        log.warn("CircuitBreaker {} slow call rate exceeded: {}%",
                            event.getCircuitBreakerName(),
                            event.getSlowCallRate()));
            });
        };
    }
}
