package com.hrsaas.certificate.repository;

import com.hrsaas.certificate.domain.entity.CertificateRequest;
import com.hrsaas.certificate.domain.entity.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 증명서 신청 Repository
 */
@Repository
public interface CertificateRequestRepository extends JpaRepository<CertificateRequest, UUID> {

    /**
     * 신청번호로 조회
     */
    Optional<CertificateRequest> findByRequestNumber(String requestNumber);

    /**
     * 직원별 신청 목록 조회
     */
    Page<CertificateRequest> findByEmployeeIdOrderByCreatedAtDesc(UUID employeeId, Pageable pageable);

    /**
     * 직원별 상태별 신청 목록 조회
     */
    Page<CertificateRequest> findByEmployeeIdAndStatusOrderByCreatedAtDesc(
            UUID employeeId, RequestStatus status, Pageable pageable);

    /**
     * 상태별 신청 목록 조회
     */
    Page<CertificateRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status, Pageable pageable);

    /**
     * 결재 대기중인 신청 목록
     */
    List<CertificateRequest> findByStatusAndApprovalIdIsNotNull(RequestStatus status);

    /**
     * 결재 ID로 신청 조회
     */
    Optional<CertificateRequest> findByApprovalId(UUID approvalId);

    /**
     * 증명서 유형별 신청 목록
     */
    Page<CertificateRequest> findByCertificateTypeIdOrderByCreatedAtDesc(UUID certificateTypeId, Pageable pageable);

    /**
     * 기간별 신청 목록
     */
    @Query("SELECT cr FROM CertificateRequest cr WHERE " +
           "cr.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY cr.createdAt DESC")
    Page<CertificateRequest> findByDateRange(
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate,
            Pageable pageable);

    /**
     * 직원별 기간별 신청 건수
     */
    @Query("SELECT COUNT(cr) FROM CertificateRequest cr WHERE " +
           "cr.employeeId = :employeeId AND " +
           "cr.createdAt BETWEEN :startDate AND :endDate")
    long countByEmployeeIdAndDateRange(
            @Param("employeeId") UUID employeeId,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate);

    /**
     * 상태별 신청 건수
     */
    long countByStatus(RequestStatus status);

    /**
     * 신청번호 존재 여부
     */
    boolean existsByRequestNumber(String requestNumber);

    /**
     * 직원 검색
     */
    @Query("SELECT cr FROM CertificateRequest cr WHERE " +
           "(LOWER(cr.employeeName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "cr.employeeNumber LIKE CONCAT('%', :keyword, '%')) " +
           "ORDER BY cr.createdAt DESC")
    Page<CertificateRequest> searchByEmployee(@Param("keyword") String keyword, Pageable pageable);

    /**
     * 대기중인 오래된 신청 목록 (리마인드용)
     */
    @Query("SELECT cr FROM CertificateRequest cr WHERE " +
           "cr.status = :status AND " +
           "cr.createdAt < :beforeDate")
    List<CertificateRequest> findPendingRequestsBefore(
            @Param("status") RequestStatus status,
            @Param("beforeDate") Instant beforeDate);
}
