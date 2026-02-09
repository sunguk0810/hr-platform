package com.hrsaas.mdm.scheduler;

import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.mdm.domain.entity.CommonCode;
import com.hrsaas.mdm.domain.event.CodeGracePeriodExpiredEvent;
import com.hrsaas.mdm.domain.event.CodeGracePeriodExpiringEvent;
import com.hrsaas.mdm.repository.CommonCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * 코드 폐기 유예기간 관리 스케줄러.
 * 매일 00:00에 실행하여 유예기간 만료 알림 및 만료 처리를 수행합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CodeDeprecationScheduler {

    private final CommonCodeRepository commonCodeRepository;
    private final EventPublisher eventPublisher;

    /**
     * 매일 00:00 실행: 유예기간 만료 7일 전 경고 알림 발행
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional(readOnly = true)
    public void sendExpiryWarnings() {
        log.info("Starting deprecation expiry warning check...");

        List<CommonCode> deprecatedCodes = commonCodeRepository.findAllDeprecatedWithTimestamp();
        int warningCount = 0;

        for (CommonCode code : deprecatedCodes) {
            if (code.getDeprecatedAt() == null || code.getDeprecationGracePeriodDays() == null) {
                continue;
            }

            Instant graceEnd = code.getDeprecatedAt()
                .plusSeconds((long) code.getDeprecationGracePeriodDays() * 24 * 60 * 60);
            Instant now = Instant.now();
            long daysRemaining = ChronoUnit.DAYS.between(now, graceEnd);

            // 7일 이내 만료 예정이고 아직 만료되지 않은 경우
            if (daysRemaining > 0 && daysRemaining <= 7) {
                eventPublisher.publish(CodeGracePeriodExpiringEvent.builder()
                    .codeId(code.getId())
                    .groupCode(code.getCodeGroup().getGroupCode())
                    .code(code.getCode())
                    .expiresAt(graceEnd)
                    .daysRemaining((int) daysRemaining)
                    .build());
                warningCount++;

                log.info("Grace period expiring: code={}.{}, daysRemaining={}",
                         code.getCodeGroup().getGroupCode(), code.getCode(), daysRemaining);
            }
        }

        log.info("Deprecation expiry warning check completed: {} warnings sent", warningCount);
    }

    /**
     * 매일 00:00 실행: 유예기간 만료 이벤트 발행
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional(readOnly = true)
    public void handleExpiredGracePeriods() {
        log.info("Starting expired grace period check...");

        List<CommonCode> deprecatedCodes = commonCodeRepository.findAllDeprecatedWithTimestamp();
        int expiredCount = 0;

        for (CommonCode code : deprecatedCodes) {
            if (code.isGracePeriodExpired()) {
                eventPublisher.publish(CodeGracePeriodExpiredEvent.builder()
                    .codeId(code.getId())
                    .groupCode(code.getCodeGroup().getGroupCode())
                    .code(code.getCode())
                    .build());
                expiredCount++;

                log.info("Grace period expired: code={}.{}",
                         code.getCodeGroup().getGroupCode(), code.getCode());
            }
        }

        log.info("Expired grace period check completed: {} expired", expiredCount);
    }
}
