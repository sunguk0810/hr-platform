package com.hrsaas.organization.repository;

import com.hrsaas.organization.domain.entity.CommitteeMember;
import com.hrsaas.organization.domain.entity.CommitteeMemberRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommitteeMemberRepository extends JpaRepository<CommitteeMember, UUID> {

    List<CommitteeMember> findByCommitteeId(UUID committeeId);

    @Query("SELECT m FROM CommitteeMember m WHERE m.committee.id = :committeeId AND m.isActive = true " +
           "ORDER BY m.role ASC, m.joinDate ASC")
    List<CommitteeMember> findActiveByCommitteeId(@Param("committeeId") UUID committeeId);

    Optional<CommitteeMember> findByCommitteeIdAndEmployeeIdAndIsActiveTrue(UUID committeeId, UUID employeeId);

    @Query("SELECT m FROM CommitteeMember m WHERE m.employeeId = :employeeId AND m.isActive = true " +
           "ORDER BY m.committee.name ASC")
    List<CommitteeMember> findActiveByEmployeeId(@Param("employeeId") UUID employeeId);

    @Query("SELECT m FROM CommitteeMember m WHERE m.committee.id = :committeeId AND m.role = :role AND m.isActive = true")
    List<CommitteeMember> findByCommitteeIdAndRole(
        @Param("committeeId") UUID committeeId,
        @Param("role") CommitteeMemberRole role);

    boolean existsByCommitteeIdAndEmployeeIdAndIsActiveTrue(UUID committeeId, UUID employeeId);

    @Query("SELECT COUNT(m) FROM CommitteeMember m WHERE m.committee.id = :committeeId AND m.isActive = true")
    long countActiveByCommitteeId(@Param("committeeId") UUID committeeId);
}
