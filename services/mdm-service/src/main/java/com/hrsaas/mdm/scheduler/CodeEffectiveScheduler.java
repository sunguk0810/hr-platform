package com.hrsaas.mdm.scheduler;

import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.mdm.domain.entity.CommonCode;
import com.hrsaas.mdm.domain.event.CommonCodeUpdatedEvent;
import com.hrsaas.mdm.repository.CommonCodeRepository;
import com.hrsaas.mdm.service.CodeHistoryService;
import com.hrsaas.mdm.domain.entity.CodeAction;
import com.hrsaas.mdm.domain.entity.CodeStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * 코드 유효기간 기반 자동 활성화/비활성화 스케줄러.
 * 매일 01:00에 실행하여 effectiveFrom/effectiveTo에 따라 상태를 전환합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CodeEffectiveScheduler {

    private final CommonCodeRepository commonCodeRepository;
    private final CodeHistoryService codeHistoryService;
    private final EventPublisher eventPublisher;

    /**
     * 매일 01:00 실행: effectiveFrom ≤ today AND 비활성 → 활성화
     */
    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void activateCodesBecomingEffective() {
        LocalDate today = LocalDate.now();
        log.info("Starting effective date activation check for date: {}", today);

        List<CommonCode> codes = commonCodeRepository.findCodesBecomingEffective(today);
        int activatedCount = 0;

        for (CommonCode code : codes) {
            CodeStatus oldStatus = code.getStatus();
            code.activate();
            commonCodeRepository.save(code);

            codeHistoryService.recordStatusChanged(code, CodeAction.ACTIVATED, oldStatus, CodeStatus.ACTIVE);
            eventPublisher.publish(CommonCodeUpdatedEvent.of(code));

            activatedCount++;
            log.info("Code auto-activated: {}.{} (effectiveFrom={})",
                     code.getCodeGroup().getGroupCode(), code.getCode(), code.getEffectiveFrom());
        }

        log.info("Effective date activation completed: {} codes activated", activatedCount);
    }

    /**
     * 매일 01:00 실행: effectiveTo < today AND 활성 → 비활성화
     */
    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void deactivateExpiredCodes() {
        LocalDate today = LocalDate.now();
        log.info("Starting expired code deactivation check for date: {}", today);

        List<CommonCode> codes = commonCodeRepository.findExpiredCodes(today);
        int deactivatedCount = 0;

        for (CommonCode code : codes) {
            CodeStatus oldStatus = code.getStatus();
            code.deactivate();
            commonCodeRepository.save(code);

            codeHistoryService.recordStatusChanged(code, CodeAction.DEACTIVATED, oldStatus, CodeStatus.INACTIVE);
            eventPublisher.publish(CommonCodeUpdatedEvent.of(code));

            deactivatedCount++;
            log.info("Code auto-deactivated: {}.{} (effectiveTo={})",
                     code.getCodeGroup().getGroupCode(), code.getCode(), code.getEffectiveTo());
        }

        log.info("Expired code deactivation completed: {} codes deactivated", deactivatedCount);
    }
}
