package com.hrsaas.appointment.repository;

import com.hrsaas.appointment.domain.entity.AppointmentSchedule;
import com.hrsaas.appointment.domain.entity.ScheduleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppointmentScheduleRepository extends JpaRepository<AppointmentSchedule, UUID> {

    Optional<AppointmentSchedule> findByDraftId(UUID draftId);

    @Query("SELECT s FROM AppointmentSchedule s WHERE s.scheduledDate = :date " +
           "AND s.status = :status ORDER BY s.scheduledTime ASC")
    List<AppointmentSchedule> findByScheduledDateAndStatus(
        @Param("date") LocalDate date,
        @Param("status") ScheduleStatus status);

    @Query("SELECT s FROM AppointmentSchedule s WHERE s.scheduledDate <= :date " +
           "AND s.status = 'SCHEDULED' ORDER BY s.scheduledDate ASC, s.scheduledTime ASC")
    List<AppointmentSchedule> findPendingSchedules(@Param("date") LocalDate date);

    @Query("SELECT s FROM AppointmentSchedule s WHERE s.status = 'FAILED' " +
           "AND s.retryCount < 3 ORDER BY s.scheduledDate ASC")
    List<AppointmentSchedule> findRetryableSchedules();

    @Query("SELECT s FROM AppointmentSchedule s WHERE s.tenantId = :tenantId " +
           "AND s.status IN :statuses ORDER BY s.scheduledDate ASC")
    List<AppointmentSchedule> findByTenantIdAndStatusIn(
        @Param("tenantId") UUID tenantId,
        @Param("statuses") List<ScheduleStatus> statuses);

    boolean existsByDraftIdAndStatusIn(UUID draftId, List<ScheduleStatus> statuses);
}
