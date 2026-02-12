package com.hrsaas.attendance.repository;

import com.hrsaas.attendance.domain.entity.AttendanceConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceConfigRepository extends JpaRepository<AttendanceConfig, UUID> {
    Optional<AttendanceConfig> findByTenantId(UUID tenantId);
}
