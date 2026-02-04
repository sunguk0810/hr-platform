package com.hrsaas.appointment.scheduler;

import com.hrsaas.appointment.domain.entity.AppointmentSchedule;
import com.hrsaas.appointment.domain.entity.ScheduleStatus;
import com.hrsaas.appointment.repository.AppointmentScheduleRepository;
import com.hrsaas.appointment.service.AppointmentDraftService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentScheduler {

    private final AppointmentScheduleRepository scheduleRepository;
    private final AppointmentDraftService draftService;

    /**
     * 예약 발령 처리 (매일 00:01)
     */
    @Scheduled(cron = "0 1 0 * * *")
    @Transactional
    public void processScheduledAppointments() {
        LocalDate today = LocalDate.now();

        List<AppointmentSchedule> schedules = scheduleRepository.findPendingSchedules(today);

        log.info("Processing scheduled appointments: {} schedules found for date <= {}",
                 schedules.size(), today);

        for (AppointmentSchedule schedule : schedules) {
            processSchedule(schedule);
        }
    }

    /**
     * 실패한 예약 발령 재시도 (매시간 30분)
     */
    @Scheduled(cron = "0 30 * * * *")
    @Transactional
    public void retryFailedSchedules() {
        List<AppointmentSchedule> retryable = scheduleRepository.findRetryableSchedules();

        if (retryable.isEmpty()) {
            return;
        }

        log.info("Retrying failed schedules: {} schedules", retryable.size());

        for (AppointmentSchedule schedule : retryable) {
            processSchedule(schedule);
        }
    }

    private void processSchedule(AppointmentSchedule schedule) {
        try {
            log.info("Processing schedule: id={}, draftId={}, scheduledDate={}",
                     schedule.getId(), schedule.getDraftId(), schedule.getScheduledDate());

            schedule.startProcessing();
            scheduleRepository.save(schedule);

            draftService.execute(schedule.getDraftId());

            schedule.complete();
            log.info("Schedule completed successfully: id={}", schedule.getId());

        } catch (Exception e) {
            log.error("Failed to process schedule: id={}", schedule.getId(), e);
            schedule.fail(e.getMessage());
        }

        scheduleRepository.save(schedule);
    }
}
