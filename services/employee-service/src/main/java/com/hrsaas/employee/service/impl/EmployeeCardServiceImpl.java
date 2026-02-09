package com.hrsaas.employee.service.impl;

import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.core.exception.ValidationException;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.domain.dto.request.CreateCardIssueRequest;
import com.hrsaas.employee.domain.dto.request.ReportLostRequest;
import com.hrsaas.employee.domain.dto.request.RevokeCardRequest;
import com.hrsaas.employee.domain.dto.response.CardIssueRequestResponse;
import com.hrsaas.employee.domain.dto.response.EmployeeCardResponse;
import com.hrsaas.employee.domain.entity.*;
import com.hrsaas.employee.repository.CardIssueRequestRepository;
import com.hrsaas.employee.repository.EmployeeCardRepository;
import com.hrsaas.employee.service.EmployeeCardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Year;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeCardServiceImpl implements EmployeeCardService {

    private final EmployeeCardRepository employeeCardRepository;
    private final CardIssueRequestRepository cardIssueRequestRepository;

    @Override
    public Page<EmployeeCardResponse> getCards(Pageable pageable, CardStatus status) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<EmployeeCard> cards;
        if (status != null) {
            cards = employeeCardRepository.findByTenantIdAndStatus(tenantId, status, pageable);
        } else {
            cards = employeeCardRepository.findByTenantId(tenantId, pageable);
        }
        return cards.map(EmployeeCardResponse::from);
    }

    @Override
    public EmployeeCardResponse getMyCard() {
        var currentUser = SecurityContextHolder.getCurrentUser();
        if (currentUser == null || currentUser.getUserId() == null) {
            throw new ValidationException("EMP_050", "인증 정보가 없습니다.");
        }

        EmployeeCard card = employeeCardRepository.findByEmployeeIdAndStatus(
                currentUser.getUserId(), CardStatus.ACTIVE)
            .orElseThrow(() -> new NotFoundException("EMP_051", "활성 사원증을 찾을 수 없습니다."));

        return EmployeeCardResponse.from(card);
    }

    @Override
    public EmployeeCardResponse getById(UUID id) {
        EmployeeCard card = employeeCardRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("EMP_051", "사원증을 찾을 수 없습니다: " + id));
        return EmployeeCardResponse.from(card);
    }

    @Override
    public Page<CardIssueRequestResponse> getIssueRequests(Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return cardIssueRequestRepository.findByTenantId(tenantId, pageable)
            .map(CardIssueRequestResponse::from);
    }

    @Override
    @Transactional
    public CardIssueRequestResponse createIssueRequest(CreateCardIssueRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        var currentUser = SecurityContextHolder.getCurrentUser();

        String requestNumber = generateRequestNumber(tenantId);

        CardIssueRequest issueRequest = CardIssueRequest.builder()
            .requestNumber(requestNumber)
            .employeeId(currentUser != null ? currentUser.getUserId() : null)
            .issueType(request.getIssueType())
            .reason(request.getReason())
            .build();

        CardIssueRequest saved = cardIssueRequestRepository.save(issueRequest);
        log.info("Card issue request created: id={}, type={}", saved.getId(), saved.getIssueType());

        return CardIssueRequestResponse.from(saved);
    }

    @Override
    @Transactional
    public CardIssueRequestResponse approveIssueRequest(UUID requestId) {
        CardIssueRequest issueRequest = cardIssueRequestRepository.findById(requestId)
            .orElseThrow(() -> new NotFoundException("EMP_052", "발급 요청을 찾을 수 없습니다: " + requestId));

        if (!issueRequest.isPending()) {
            throw new ValidationException("EMP_053", "대기 상태의 요청만 승인할 수 있습니다.");
        }

        var currentUser = SecurityContextHolder.getCurrentUser();
        UUID approverId = currentUser != null ? currentUser.getUserId() : null;

        // Revoke existing active card for reissue/renewal
        if (issueRequest.getIssueType() != CardIssueType.NEW) {
            employeeCardRepository.findByEmployeeIdAndStatus(issueRequest.getEmployeeId(), CardStatus.ACTIVE)
                .ifPresent(existingCard -> {
                    existingCard.revoke(approverId, "재발급으로 인한 기존 카드 회수");
                    employeeCardRepository.save(existingCard);
                });
        }

        // Create new card
        UUID tenantId = TenantContext.getCurrentTenant();
        String cardNumber = generateCardNumber(tenantId);
        EmployeeCard newCard = EmployeeCard.builder()
            .cardNumber(cardNumber)
            .employeeId(issueRequest.getEmployeeId())
            .status(CardStatus.ACTIVE)
            .issueType(issueRequest.getIssueType())
            .issueDate(LocalDate.now())
            .expiryDate(LocalDate.now().plusYears(3))
            .build();

        EmployeeCard savedCard = employeeCardRepository.save(newCard);

        // Update request
        issueRequest.approve(approverId);
        issueRequest.markIssued(savedCard.getId());
        CardIssueRequest savedRequest = cardIssueRequestRepository.save(issueRequest);

        log.info("Card issue request approved: requestId={}, cardId={}", requestId, savedCard.getId());

        return CardIssueRequestResponse.from(savedRequest);
    }

    @Override
    @Transactional
    public EmployeeCardResponse reportLost(ReportLostRequest request) {
        var currentUser = SecurityContextHolder.getCurrentUser();
        if (currentUser == null || currentUser.getUserId() == null) {
            throw new ValidationException("EMP_050", "인증 정보가 없습니다.");
        }

        EmployeeCard card = employeeCardRepository.findByEmployeeIdAndStatus(
                currentUser.getUserId(), CardStatus.ACTIVE)
            .orElseThrow(() -> new NotFoundException("EMP_051", "활성 사원증을 찾을 수 없습니다."));

        card.markLost(request.getLocation(), request.getDescription());
        EmployeeCard saved = employeeCardRepository.save(card);

        log.info("Card reported lost: cardId={}, employeeId={}", card.getId(), card.getEmployeeId());

        return EmployeeCardResponse.from(saved);
    }

    @Override
    @Transactional
    public EmployeeCardResponse revokeCard(UUID cardId, RevokeCardRequest request) {
        EmployeeCard card = employeeCardRepository.findById(cardId)
            .orElseThrow(() -> new NotFoundException("EMP_051", "사원증을 찾을 수 없습니다: " + cardId));

        if (!card.isActive()) {
            throw new ValidationException("EMP_054", "활성 상태의 사원증만 회수할 수 있습니다.");
        }

        var currentUser = SecurityContextHolder.getCurrentUser();
        UUID revokedBy = currentUser != null ? currentUser.getUserId() : null;
        card.revoke(revokedBy, request.getReason());
        EmployeeCard saved = employeeCardRepository.save(card);

        log.info("Card revoked: cardId={}", cardId);

        return EmployeeCardResponse.from(saved);
    }

    @Override
    @Transactional
    public void autoIssueForNewEmployee(UUID employeeId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        String cardNumber = generateCardNumber(tenantId);

        EmployeeCard card = EmployeeCard.builder()
            .cardNumber(cardNumber)
            .employeeId(employeeId)
            .status(CardStatus.ACTIVE)
            .issueType(CardIssueType.NEW)
            .issueDate(LocalDate.now())
            .expiryDate(LocalDate.now().plusYears(3))
            .build();

        employeeCardRepository.save(card);
        log.info("Auto-issued card for new employee: employeeId={}, cardNumber={}", employeeId, cardNumber);
    }

    private String generateCardNumber(UUID tenantId) {
        int year = Year.now().getValue();
        var lastCard = employeeCardRepository.findTopByTenantIdOrderByCardNumberDesc(tenantId);

        int sequence = 1;
        if (lastCard.isPresent()) {
            String lastNumber = lastCard.get().getCardNumber();
            // Format: CARD-YYYY-SSSS
            String[] parts = lastNumber.split("-");
            if (parts.length == 3) {
                try {
                    int lastYear = Integer.parseInt(parts[1]);
                    if (lastYear == year) {
                        sequence = Integer.parseInt(parts[2]) + 1;
                    }
                } catch (NumberFormatException e) {
                    // ignore, start from 1
                }
            }
        }

        return String.format("CARD-%d-%04d", year, sequence);
    }

    private String generateRequestNumber(UUID tenantId) {
        return "REQ-" + Year.now().getValue() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
