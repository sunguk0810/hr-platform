package com.hrsaas.recruitment.repository;

import com.hrsaas.recruitment.domain.entity.Offer;
import com.hrsaas.recruitment.domain.entity.OfferStatus;
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
 * 채용 제안 Repository
 */
@Repository
public interface OfferRepository extends JpaRepository<Offer, UUID> {

    /**
     * 제안 번호로 조회
     */
    Optional<Offer> findByOfferNumber(String offerNumber);

    /**
     * 지원서별 제안 조회
     */
    Optional<Offer> findByApplicationId(UUID applicationId);

    /**
     * 상태별 제안 목록
     */
    Page<Offer> findByStatusOrderByCreatedAtDesc(OfferStatus status, Pageable pageable);

    /**
     * 만료 예정 제안 목록
     */
    @Query("SELECT o FROM Offer o WHERE " +
           "o.status = 'SENT' AND o.expiresAt IS NOT NULL " +
           "AND o.expiresAt <= :expiresAt")
    List<Offer> findExpiringSoon(@Param("expiresAt") Instant expiresAt);

    /**
     * 만료된 제안 목록
     */
    @Query("SELECT o FROM Offer o WHERE " +
           "o.status = 'SENT' AND o.expiresAt IS NOT NULL " +
           "AND o.expiresAt < :now")
    List<Offer> findExpired(@Param("now") Instant now);

    /**
     * 기간별 수락된 제안 목록
     */
    @Query("SELECT o FROM Offer o WHERE " +
           "o.status = 'ACCEPTED' AND o.respondedAt BETWEEN :startDate AND :endDate")
    List<Offer> findAcceptedOffersByDateRange(@Param("startDate") Instant startDate,
                                               @Param("endDate") Instant endDate);

    /**
     * 승인 대기중인 제안 목록
     */
    List<Offer> findByStatusOrderByCreatedAtAsc(OfferStatus status);

    /**
     * 상태별 제안 수
     */
    long countByStatus(OfferStatus status);

    /**
     * 제안 번호 존재 여부
     */
    boolean existsByOfferNumber(String offerNumber);

    /**
     * 부서별 제안 목록
     */
    Page<Offer> findByDepartmentIdOrderByCreatedAtDesc(UUID departmentId, Pageable pageable);

    /**
     * 기간별 제안 통계
     */
    @Query("SELECT o.status, COUNT(o) FROM Offer o " +
           "WHERE o.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY o.status")
    List<Object[]> countByStatusAndDateRange(@Param("startDate") Instant startDate,
                                              @Param("endDate") Instant endDate);
}
