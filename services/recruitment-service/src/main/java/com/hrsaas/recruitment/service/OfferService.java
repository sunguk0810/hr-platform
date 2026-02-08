package com.hrsaas.recruitment.service;

import com.hrsaas.recruitment.domain.dto.request.CreateOfferRequest;
import com.hrsaas.recruitment.domain.dto.response.OfferResponse;
import com.hrsaas.recruitment.domain.dto.response.OfferSummaryResponse;
import com.hrsaas.recruitment.domain.entity.OfferStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

/**
 * 채용 제안 서비스 인터페이스
 */
public interface OfferService {

    OfferResponse create(CreateOfferRequest request);

    OfferResponse getById(UUID id);

    OfferResponse getByOfferNumber(String offerNumber);

    OfferResponse getByApplicationId(UUID applicationId);

    Page<OfferResponse> getByStatus(OfferStatus status, Pageable pageable);

    List<OfferResponse> getPendingApproval();

    OfferResponse submitForApproval(UUID id);

    OfferResponse approve(UUID id, UUID approvedBy);

    OfferResponse send(UUID id);

    OfferResponse accept(UUID id);

    OfferResponse decline(UUID id, String reason);

    OfferResponse negotiate(UUID id, String notes);

    OfferResponse cancel(UUID id);

    void checkExpiredOffers();

    OfferSummaryResponse getSummary();

    OfferResponse respond(UUID id, String action, String reason);
}
