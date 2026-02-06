package com.hrsaas.common.event;

import com.hrsaas.common.core.util.JsonUtils;
import io.awspring.cloud.sns.core.SnsTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * AWS SNS implementation of EventPublisher.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SnsEventPublisher implements EventPublisher {

    private final SnsTemplate snsTemplate;

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

        log.debug("Publishing event to SNS topic={}, key={}, eventType={}",
                  topic, key, event.getEventType());

        try {
            snsTemplate.sendNotification(topic, payload, null);
            log.debug("Event published successfully to SNS: topic={}, eventId={}", topic, event.getEventId());
        } catch (Exception ex) {
            log.error("Failed to publish event to SNS: topic={}, eventId={}, error={}",
                      topic, event.getEventId(), ex.getMessage(), ex);
        }
    }
}
