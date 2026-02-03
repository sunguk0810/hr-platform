package com.hrsaas.common.event;

/**
 * Interface for publishing domain events.
 */
public interface EventPublisher {

    /**
     * Publish an event asynchronously.
     */
    void publish(DomainEvent event);

    /**
     * Publish an event to a specific topic.
     */
    void publish(String topic, DomainEvent event);

    /**
     * Publish an event with a specific key.
     */
    void publish(String topic, String key, DomainEvent event);
}
