package com.hrsaas.recruitment.service.impl;

import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.ErrorCode;
import com.hrsaas.recruitment.domain.dto.request.CreateOfferRequest;
import com.hrsaas.recruitment.domain.dto.response.OfferResponse;
import com.hrsaas.recruitment.domain.dto.response.OfferSummaryResponse;
import com.hrsaas.recruitment.domain.entity.Application;
import com.hrsaas.recruitment.domain.entity.Offer;
import com.hrsaas.recruitment.domain.entity.OfferStatus;
import com.hrsaas.recruitment.repository.ApplicationRepository;
import com.hrsaas.recruitment.repository.OfferRepository;
import com.hrsaas.recruitment.service.OfferService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OfferServiceImpl implements OfferService {

    private final OfferRepository offerRepository;
    private final ApplicationRepository applicationRepository;

    private static final AtomicLong offerSequence = new AtomicLong(1);

    @Override
    @Transactional
    public OfferResponse create(CreateOfferRequest request) {
        log.info("Creating offer for application: {}", request.getApplicationId());

        Application application = applicationRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "지원서를 찾을 수 없습니다"));

        if (offerRepository.findByApplicationId(request.getApplicationId()).isPresent()) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "이미 제안이 존재합니다");
        }

        String offerNumber = generateOfferNumber();

        Offer offer = Offer.builder()
                .application(application)
                .offerNumber(offerNumber)
                .positionTitle(request.getPositionTitle())
                .departmentId(request.getDepartmentId())
                .departmentName(request.getDepartmentName())
                .gradeCode(request.getGradeCode())
                .gradeName(request.getGradeName())
                .baseSalary(request.getBaseSalary())
                .signingBonus(request.getSigningBonus())
                .benefits(request.getBenefits())
                .startDate(request.getStartDate())
                .employmentType(request.getEmploymentType())
                .probationMonths(request.getProbationMonths())
                .workLocation(request.getWorkLocation())
                .reportToId(request.getReportToId())
                .reportToName(request.getReportToName())
                .specialTerms(request.getSpecialTerms())
                .expiresAt(request.getExpiresAt())
                .build();

        Offer saved = offerRepository.save(offer);

        // 지원서 상태 업데이트
        application.makeOffer();
        applicationRepository.save(application);

        log.info("Offer created: {}", saved.getOfferNumber());
        return OfferResponse.from(saved);
    }

    @Override
    public OfferResponse getById(UUID id) {
        Offer offer = offerRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "제안을 찾을 수 없습니다: " + id));
        return OfferResponse.from(offer);
    }

    @Override
    public OfferResponse getByOfferNumber(String offerNumber) {
        Offer offer = offerRepository.findByOfferNumber(offerNumber)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "제안을 찾을 수 없습니다: " + offerNumber));
        return OfferResponse.from(offer);
    }

    @Override
    public OfferResponse getByApplicationId(UUID applicationId) {
        Offer offer = offerRepository.findByApplicationId(applicationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "제안을 찾을 수 없습니다"));
        return OfferResponse.from(offer);
    }

    @Override
    public Page<OfferResponse> getByStatus(OfferStatus status, Pageable pageable) {
        return offerRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                .map(OfferResponse::from);
    }

    @Override
    public List<OfferResponse> getPendingApproval() {
        return offerRepository.findByStatusOrderByCreatedAtAsc(OfferStatus.PENDING_APPROVAL).stream()
                .map(OfferResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OfferResponse submitForApproval(UUID id) {
        log.info("Submitting offer for approval: {}", id);

        Offer offer = offerRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "제안을 찾을 수 없습니다"));

        offer.submitForApproval();
        return OfferResponse.from(offerRepository.save(offer));
    }

    @Override
    @Transactional
    public OfferResponse approve(UUID id, UUID approvedBy) {
        log.info("Approving offer: {}", id);

        Offer offer = offerRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "제안을 찾을 수 없습니다"));

        offer.approve(approvedBy);
        return OfferResponse.from(offerRepository.save(offer));
    }

    @Override
    @Transactional
    public OfferResponse send(UUID id) {
        log.info("Sending offer: {}", id);

        Offer offer = offerRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "제안을 찾을 수 없습니다"));

        if (offer.getStatus() != OfferStatus.APPROVED) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "승인된 제안만 발송할 수 있습니다");
        }

        offer.send();
        return OfferResponse.from(offerRepository.save(offer));
    }

    @Override
    @Transactional
    public OfferResponse accept(UUID id) {
        log.info("Accepting offer: {}", id);

        Offer offer = offerRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "제안을 찾을 수 없습니다"));

        offer.accept();

        // 지원서 채용 처리
        Application application = offer.getApplication();
        application.hire();
        applicationRepository.save(application);

        return OfferResponse.from(offerRepository.save(offer));
    }

    @Override
    @Transactional
    public OfferResponse decline(UUID id, String reason) {
        log.info("Declining offer: {}", id);

        Offer offer = offerRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "제안을 찾을 수 없습니다"));

        offer.decline(reason);
        return OfferResponse.from(offerRepository.save(offer));
    }

    @Override
    @Transactional
    public OfferResponse negotiate(UUID id, String notes) {
        log.info("Negotiating offer: {}", id);

        Offer offer = offerRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "제안을 찾을 수 없습니다"));

        offer.negotiate(notes);
        return OfferResponse.from(offerRepository.save(offer));
    }

    @Override
    @Transactional
    public OfferResponse cancel(UUID id) {
        log.info("Cancelling offer: {}", id);

        Offer offer = offerRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "제안을 찾을 수 없습니다"));

        offer.cancel();
        return OfferResponse.from(offerRepository.save(offer));
    }

    @Override
    @Transactional
    public void checkExpiredOffers() {
        log.info("Checking expired offers");

        List<Offer> expiredOffers = offerRepository.findExpired(Instant.now());
        for (Offer offer : expiredOffers) {
            offer.expire();
            offerRepository.save(offer);
            log.info("Offer expired: {}", offer.getOfferNumber());
        }
    }

    @Override
    public OfferSummaryResponse getSummary() {
        return OfferSummaryResponse.builder()
                .total(offerRepository.count())
                .draft(offerRepository.countByStatus(OfferStatus.DRAFT))
                .pendingApproval(offerRepository.countByStatus(OfferStatus.PENDING_APPROVAL))
                .approved(offerRepository.countByStatus(OfferStatus.APPROVED))
                .sent(offerRepository.countByStatus(OfferStatus.SENT))
                .accepted(offerRepository.countByStatus(OfferStatus.ACCEPTED))
                .declined(offerRepository.countByStatus(OfferStatus.DECLINED))
                .negotiating(offerRepository.countByStatus(OfferStatus.NEGOTIATING))
                .expired(offerRepository.countByStatus(OfferStatus.EXPIRED))
                .cancelled(offerRepository.countByStatus(OfferStatus.CANCELLED))
                .build();
    }

    @Override
    @Transactional
    public OfferResponse respond(UUID id, String action, String reason) {
        log.info("Responding to offer: {} with action: {}", id, action);

        if ("ACCEPT".equalsIgnoreCase(action)) {
            return accept(id);
        } else if ("DECLINE".equalsIgnoreCase(action)) {
            return decline(id, reason);
        } else {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "유효하지 않은 응답 유형입니다: " + action);
        }
    }

    private String generateOfferNumber() {
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long sequence = offerSequence.getAndIncrement();
        return String.format("OFR-%s-%06d", datePrefix, sequence);
    }
}
