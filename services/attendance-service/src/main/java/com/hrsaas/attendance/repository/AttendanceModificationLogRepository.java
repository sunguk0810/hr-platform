package com.hrsaas.attendance.repository;

import com.hrsaas.attendance.domain.entity.AttendanceModificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AttendanceModificationLogRepository extends JpaRepository<AttendanceModificationLog, UUID> {
}
