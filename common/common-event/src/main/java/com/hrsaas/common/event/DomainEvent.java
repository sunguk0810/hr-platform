package com.hrsaas.common.event;

import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.UUID;

/**
 * Base class for all domain events.
 */
@Getter
@SuperBuilder
public abstract class DomainEvent {

    private final String eventId;
    private final String eventType;
    private final Instant timestamp;
    private final UUID tenantId;
    private final UUID actorId;
    private final String correlationId;

    protected DomainEvent() {
        this.eventId = UUID.randomUUID().toString();
        this.eventType = this.getClass().getSimpleName();
        this.timestamp = Instant.now();
        this.tenantId = null;
        this.actorId = null;
        this.correlationId = null;
    }

    protected DomainEvent(UUID tenantId, UUID actorId) {
        this.eventId = UUID.randomUUID().toString();
        this.eventType = this.getClass().getSimpleName();
        this.timestamp = Instant.now();
        this.tenantId = tenantId;
        this.actorId = actorId;
        this.correlationId = null;
    }

    protected DomainEvent(UUID tenantId, UUID actorId, String correlationId) {
        this.eventId = UUID.randomUUID().toString();
        this.eventType = this.getClass().getSimpleName();
        this.timestamp = Instant.now();
        this.tenantId = tenantId;
        this.actorId = actorId;
        this.correlationId = correlationId;
    }

    /**
     * Get the SNS topic name for this event.
     */
    public abstract String getTopic();
}
