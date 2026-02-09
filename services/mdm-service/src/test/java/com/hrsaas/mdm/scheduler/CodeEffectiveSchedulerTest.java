package com.hrsaas.mdm.scheduler;

import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.mdm.domain.entity.CodeAction;
import com.hrsaas.mdm.domain.entity.CodeGroup;
import com.hrsaas.mdm.domain.entity.CodeStatus;
import com.hrsaas.mdm.domain.entity.CommonCode;
import com.hrsaas.mdm.domain.event.CommonCodeUpdatedEvent;
import com.hrsaas.mdm.repository.CommonCodeRepository;
import com.hrsaas.mdm.service.CodeHistoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CodeEffectiveSchedulerTest {

    @Mock
    private CommonCodeRepository commonCodeRepository;

    @Mock
    private CodeHistoryService codeHistoryService;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private CodeEffectiveScheduler scheduler;

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
    void activateCodesBecomingEffective_inactiveCodeWithEffectiveFrom_activates() {
        // Given
        CommonCode code = CommonCode.builder()
            .codeGroup(codeGroup)
            .code("L01")
            .codeName("연차")
            .level(1)
            .effectiveFrom(LocalDate.now().minusDays(1))
            .build();
        setEntityId(code, UUID.randomUUID());
        code.deactivate(); // make inactive

        when(commonCodeRepository.findCodesBecomingEffective(any(LocalDate.class)))
            .thenReturn(List.of(code));
        when(commonCodeRepository.save(any())).thenReturn(code);

        // When
        scheduler.activateCodesBecomingEffective();

        // Then
        assertThat(code.isActive()).isTrue();
        assertThat(code.getStatus()).isEqualTo(CodeStatus.ACTIVE);
        verify(commonCodeRepository).save(code);
        verify(codeHistoryService).recordStatusChanged(eq(code), eq(CodeAction.ACTIVATED),
            eq(CodeStatus.INACTIVE), eq(CodeStatus.ACTIVE));
        verify(eventPublisher).publish(any(CommonCodeUpdatedEvent.class));
    }

    @Test
    void activateCodesBecomingEffective_noCodes_noAction() {
        when(commonCodeRepository.findCodesBecomingEffective(any(LocalDate.class)))
            .thenReturn(Collections.emptyList());

        scheduler.activateCodesBecomingEffective();

        verify(commonCodeRepository, never()).save(any());
        verify(eventPublisher, never()).publish(any());
    }

    @Test
    void deactivateExpiredCodes_activeCodeWithExpiredEffectiveTo_deactivates() {
        // Given
        CommonCode code = CommonCode.builder()
            .codeGroup(codeGroup)
            .code("L02")
            .codeName("병가")
            .level(1)
            .effectiveTo(LocalDate.now().minusDays(1))
            .build();
        setEntityId(code, UUID.randomUUID());

        when(commonCodeRepository.findExpiredCodes(any(LocalDate.class)))
            .thenReturn(List.of(code));
        when(commonCodeRepository.save(any())).thenReturn(code);

        // When
        scheduler.deactivateExpiredCodes();

        // Then
        assertThat(code.isActive()).isFalse();
        assertThat(code.getStatus()).isEqualTo(CodeStatus.INACTIVE);
        verify(commonCodeRepository).save(code);
        verify(codeHistoryService).recordStatusChanged(eq(code), eq(CodeAction.DEACTIVATED),
            eq(CodeStatus.ACTIVE), eq(CodeStatus.INACTIVE));
        verify(eventPublisher).publish(any(CommonCodeUpdatedEvent.class));
    }

    @Test
    void deactivateExpiredCodes_noCodes_noAction() {
        when(commonCodeRepository.findExpiredCodes(any(LocalDate.class)))
            .thenReturn(Collections.emptyList());

        scheduler.deactivateExpiredCodes();

        verify(commonCodeRepository, never()).save(any());
        verify(eventPublisher, never()).publish(any());
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
