package com.hrsaas.appointment.repository;

import com.hrsaas.appointment.domain.entity.AppointmentDetail;
import com.hrsaas.appointment.domain.entity.AppointmentType;
import com.hrsaas.appointment.domain.entity.DetailStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AppointmentDetailRepository extends JpaRepository<AppointmentDetail, UUID> {

    List<AppointmentDetail> findByDraftId(UUID draftId);

    @Query("SELECT d FROM AppointmentDetail d WHERE d.draft.id = :draftId " +
           "AND d.status = :status")
    List<AppointmentDetail> findByDraftIdAndStatus(
        @Param("draftId") UUID draftId,
        @Param("status") DetailStatus status);

    @Query("SELECT d FROM AppointmentDetail d WHERE d.employeeId = :employeeId " +
           "ORDER BY d.createdAt DESC")
    List<AppointmentDetail> findByEmployeeId(@Param("employeeId") UUID employeeId);

    @Query("SELECT d FROM AppointmentDetail d WHERE d.employeeId = :employeeId " +
           "AND d.appointmentType = :appointmentType ORDER BY d.createdAt DESC")
    List<AppointmentDetail> findByEmployeeIdAndAppointmentType(
        @Param("employeeId") UUID employeeId,
        @Param("appointmentType") AppointmentType appointmentType);

    @Query("SELECT COUNT(d) FROM AppointmentDetail d WHERE d.draft.id = :draftId")
    long countByDraftId(@Param("draftId") UUID draftId);

    boolean existsByDraftIdAndEmployeeIdAndAppointmentType(
        UUID draftId, UUID employeeId, AppointmentType appointmentType);

    void deleteByDraftId(UUID draftId);
}
