package com.hrsaas.mdm.scheduler;

import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.mdm.domain.entity.CodeGroup;
import com.hrsaas.mdm.domain.entity.CodeStatus;
import com.hrsaas.mdm.domain.entity.CommonCode;
import com.hrsaas.mdm.domain.event.CodeGracePeriodExpiredEvent;
import com.hrsaas.mdm.domain.event.CodeGracePeriodExpiringEvent;
import com.hrsaas.mdm.repository.CommonCodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CodeDeprecationSchedulerTest {

    @Mock
    private CommonCodeRepository commonCodeRepository;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private CodeDeprecationScheduler scheduler;

    private CodeGroup codeGroup;

    @BeforeEach
    void setUp() {
        codeGroup = CodeGroup.builder()
            .groupCode("LEAVE_TYPE")
            .groupName("휴가유형")
            .build();
        setEntityId(codeGroup, UUID.randomUUID());
    }

    @Test
    void sendExpiryWarnings_codeExpiringWithin7Days_publishesEvent() {
        // Given: code deprecated 85 days ago with 90-day grace period → 5 days remaining
        CommonCode code = createDeprecatedCode(
            Instant.now().minus(85, ChronoUnit.DAYS), 90);

        when(commonCodeRepository.findAllDeprecatedWithTimestamp()).thenReturn(List.of(code));

        // When
        scheduler.sendExpiryWarnings();

        // Then
        ArgumentCaptor<CodeGracePeriodExpiringEvent> captor = ArgumentCaptor.forClass(CodeGracePeriodExpiringEvent.class);
        verify(eventPublisher).publish(captor.capture());
        assertThat(captor.getValue().getDaysRemaining()).isBetween(4, 6);
    }

    @Test
    void sendExpiryWarnings_noDeprecatedCodes_noEventPublished() {
        when(commonCodeRepository.findAllDeprecatedWithTimestamp()).thenReturn(Collections.emptyList());

        scheduler.sendExpiryWarnings();

        verify(eventPublisher, never()).publish(any());
    }

    @Test
    void handleExpiredGracePeriods_expiredCode_publishesEvent() {
        // Given: code deprecated 100 days ago with 90-day grace period → expired
        CommonCode code = createDeprecatedCode(
            Instant.now().minus(100, ChronoUnit.DAYS), 90);

        when(commonCodeRepository.findAllDeprecatedWithTimestamp()).thenReturn(List.of(code));

        // When
        scheduler.handleExpiredGracePeriods();

        // Then
        verify(eventPublisher).publish(any(CodeGracePeriodExpiredEvent.class));
    }

    @Test
    void handleExpiredGracePeriods_activeGracePeriod_noEventPublished() {
        // Given: code deprecated 10 days ago with 90-day grace period → not expired
        CommonCode code = createDeprecatedCode(
            Instant.now().minus(10, ChronoUnit.DAYS), 90);

        when(commonCodeRepository.findAllDeprecatedWithTimestamp()).thenReturn(List.of(code));

        // When
        scheduler.handleExpiredGracePeriods();

        // Then
        verify(eventPublisher, never()).publish(any(CodeGracePeriodExpiredEvent.class));
    }

    private CommonCode createDeprecatedCode(Instant deprecatedAt, int gracePeriodDays) {
        CommonCode code = CommonCode.builder()
            .codeGroup(codeGroup)
            .code("L01")
            .codeName("연차")
            .level(1)
            .build();
        setEntityId(code, UUID.randomUUID());
        code.setStatus(CodeStatus.DEPRECATED);
        code.setActive(false);
        code.setDeprecatedAt(deprecatedAt);
        code.setDeprecationGracePeriodDays(gracePeriodDays);
        return code;
    }

    private void setEntityId(Object entity, UUID id) {
        try {
            java.lang.reflect.Field idField;
            try {
                idField = com.hrsaas.common.entity.BaseEntity.class.getDeclaredField("id");
            } catch (NoSuchFieldException e) {
                idField = entity.getClass().getDeclaredField("id");
            }
            idField.setAccessible(true);
            idField.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
