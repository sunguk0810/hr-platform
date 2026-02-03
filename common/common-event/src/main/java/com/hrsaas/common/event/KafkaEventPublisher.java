package com.hrsaas.common.event;

import com.hrsaas.common.core.util.JsonUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

/**
 * Kafka implementation of EventPublisher.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class KafkaEventPublisher implements EventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;

    @Override
    public void publish(DomainEvent event) {
        publish(event.getTopic(), event);
    }

    @Override
    public void publish(String topic, DomainEvent event) {
        publish(topic, event.getEventId(), event);
    }

    @Override
    public void publish(String topic, String key, DomainEvent event) {
        String payload = JsonUtils.toJson(event);

        log.debug("Publishing event to topic={}, key={}, eventType={}",
                  topic, key, event.getEventType());

        CompletableFuture<SendResult<String, String>> future =
            kafkaTemplate.send(topic, key, payload);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish event: topic={}, eventId={}, error={}",
                          topic, event.getEventId(), ex.getMessage());
            } else {
                log.debug("Event published successfully: topic={}, partition={}, offset={}",
                          topic,
                          result.getRecordMetadata().partition(),
                          result.getRecordMetadata().offset());
            }
        });
    }
}
