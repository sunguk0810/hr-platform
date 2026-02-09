package com.hrsaas.employee.service;

import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.core.exception.ValidationException;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.domain.dto.request.CreateCardIssueRequest;
import com.hrsaas.employee.domain.dto.request.ReportLostRequest;
import com.hrsaas.employee.domain.dto.request.RevokeCardRequest;
import com.hrsaas.employee.domain.entity.*;
import com.hrsaas.employee.repository.CardIssueRequestRepository;
import com.hrsaas.employee.repository.EmployeeCardRepository;
import com.hrsaas.employee.service.impl.EmployeeCardServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeCardServiceImplTest {

    @Mock
    private EmployeeCardRepository employeeCardRepository;

    @Mock
    private CardIssueRequestRepository cardIssueRequestRepository;

    @InjectMocks
    private EmployeeCardServiceImpl employeeCardService;

    private UUID tenantId;
    private UUID employeeId;
    private UUID cardId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        employeeId = UUID.randomUUID();
        cardId = UUID.randomUUID();
        TenantContext.setCurrentTenant(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clear();
    }

    @Test
    void autoIssueForNewEmployee_createsActiveCard() {
        when(employeeCardRepository.findTopByTenantIdOrderByCardNumberDesc(tenantId))
            .thenReturn(Optional.empty());
        when(employeeCardRepository.save(any(EmployeeCard.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        employeeCardService.autoIssueForNewEmployee(employeeId);

        ArgumentCaptor<EmployeeCard> captor = ArgumentCaptor.forClass(EmployeeCard.class);
        verify(employeeCardRepository).save(captor.capture());

        EmployeeCard saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(CardStatus.ACTIVE);
        assertThat(saved.getEmployeeId()).isEqualTo(employeeId);
        assertThat(saved.getIssueType()).isEqualTo(CardIssueType.NEW);
        assertThat(saved.getIssueDate()).isEqualTo(LocalDate.now());
        assertThat(saved.getExpiryDate()).isEqualTo(LocalDate.now().plusYears(3));
    }

    @Test
    void autoIssueForNewEmployee_generatesCardNumber() {
        when(employeeCardRepository.findTopByTenantIdOrderByCardNumberDesc(tenantId))
            .thenReturn(Optional.empty());
        when(employeeCardRepository.save(any(EmployeeCard.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        employeeCardService.autoIssueForNewEmployee(employeeId);

        ArgumentCaptor<EmployeeCard> captor = ArgumentCaptor.forClass(EmployeeCard.class);
        verify(employeeCardRepository).save(captor.capture());

        EmployeeCard saved = captor.getValue();
        assertThat(saved.getCardNumber()).startsWith("CARD-");
        assertThat(saved.getCardNumber()).matches("CARD-\\d{4}-\\d{4}");
    }

    @Test
    void reportLost_activeCard_setsStatusLost() {
        // Setup authenticated user
        com.hrsaas.common.security.UserContext userContext = com.hrsaas.common.security.UserContext.builder()
            .userId(employeeId)
            .username("testuser")
            .build();
        SecurityContextHolder.setContext(userContext);

        EmployeeCard card = EmployeeCard.builder()
            .cardNumber("CARD-2026-0001")
            .employeeId(employeeId)
            .status(CardStatus.ACTIVE)
            .issueType(CardIssueType.NEW)
            .issueDate(LocalDate.now())
            .expiryDate(LocalDate.now().plusYears(3))
            .build();
        setEntityId(card, cardId);

        ReportLostRequest request = new ReportLostRequest();
        request.setLocation("사무실 복도");
        request.setDescription("점심시간 분실");

        when(employeeCardRepository.findByEmployeeIdAndStatus(employeeId, CardStatus.ACTIVE))
            .thenReturn(Optional.of(card));
        when(employeeCardRepository.save(any(EmployeeCard.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        employeeCardService.reportLost(request);

        assertThat(card.getStatus()).isEqualTo(CardStatus.LOST);
        assertThat(card.getLostLocation()).isEqualTo("사무실 복도");
        assertThat(card.getLostDescription()).isEqualTo("점심시간 분실");
        assertThat(card.getLostAt()).isNotNull();
        verify(employeeCardRepository).save(card);
    }

    @Test
    void revokeCard_activeCard_setsStatusRevoked() {
        EmployeeCard card = EmployeeCard.builder()
            .cardNumber("CARD-2026-0001")
            .employeeId(employeeId)
            .status(CardStatus.ACTIVE)
            .issueType(CardIssueType.NEW)
            .issueDate(LocalDate.now())
            .expiryDate(LocalDate.now().plusYears(3))
            .build();
        setEntityId(card, cardId);

        RevokeCardRequest request = new RevokeCardRequest();
        request.setReason("퇴사");

        when(employeeCardRepository.findById(cardId)).thenReturn(Optional.of(card));
        when(employeeCardRepository.save(any(EmployeeCard.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        employeeCardService.revokeCard(cardId, request);

        assertThat(card.getStatus()).isEqualTo(CardStatus.REVOKED);
        assertThat(card.getRevokeReason()).isEqualTo("퇴사");
        assertThat(card.getRevokedAt()).isNotNull();
        verify(employeeCardRepository).save(card);
    }

    @Test
    void revokeCard_notActive_throwsValidation() {
        EmployeeCard card = EmployeeCard.builder()
            .cardNumber("CARD-2026-0001")
            .employeeId(employeeId)
            .status(CardStatus.EXPIRED)
            .issueType(CardIssueType.NEW)
            .issueDate(LocalDate.now().minusYears(4))
            .expiryDate(LocalDate.now().minusYears(1))
            .build();
        setEntityId(card, cardId);

        RevokeCardRequest request = new RevokeCardRequest();
        request.setReason("퇴사");

        when(employeeCardRepository.findById(cardId)).thenReturn(Optional.of(card));

        assertThatThrownBy(() -> employeeCardService.revokeCard(cardId, request))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("활성 상태의 사원증만 회수할 수 있습니다");

        verify(employeeCardRepository, never()).save(any(EmployeeCard.class));
    }

    @Test
    void createIssueRequest_createsPending() {
        CreateCardIssueRequest request = new CreateCardIssueRequest();
        request.setIssueType(CardIssueType.REISSUE);
        request.setReason("분실로 인한 재발급");

        when(cardIssueRequestRepository.save(any(CardIssueRequest.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        employeeCardService.createIssueRequest(request);

        ArgumentCaptor<CardIssueRequest> captor = ArgumentCaptor.forClass(CardIssueRequest.class);
        verify(cardIssueRequestRepository).save(captor.capture());

        CardIssueRequest saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(CardIssueRequestStatus.PENDING);
        assertThat(saved.getIssueType()).isEqualTo(CardIssueType.REISSUE);
        assertThat(saved.getReason()).isEqualTo("분실로 인한 재발급");
        assertThat(saved.getRequestNumber()).startsWith("REQ-");
    }

    @Test
    void approveIssueRequest_notPending_throwsException() {
        UUID requestId = UUID.randomUUID();
        CardIssueRequest request = CardIssueRequest.builder()
            .requestNumber("REQ-2026-12345678")
            .employeeId(employeeId)
            .issueType(CardIssueType.NEW)
            .reason("신규 발급")
            .build();
        setEntityId(request, requestId);

        // Manually set status to APPROVED (not pending)
        request.approve(UUID.randomUUID());

        when(cardIssueRequestRepository.findById(requestId)).thenReturn(Optional.of(request));

        assertThatThrownBy(() -> employeeCardService.approveIssueRequest(requestId))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("대기 상태의 요청만 승인할 수 있습니다");

        verify(employeeCardRepository, never()).save(any(EmployeeCard.class));
    }

    @Test
    void getById_notFound_throwsNotFound() {
        UUID nonExistentId = UUID.randomUUID();

        when(employeeCardRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> employeeCardService.getById(nonExistentId))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("사원증을 찾을 수 없습니다");
    }

    // --- Helper Methods ---

    private void setEntityId(Object entity, UUID id) {
        try {
            var field = findField(entity.getClass(), "id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set entity ID", e);
        }
    }

    private java.lang.reflect.Field findField(Class<?> clazz, String fieldName) {
        Class<?> current = clazz;
        while (current != null) {
            try {
                return current.getDeclaredField(fieldName);
            } catch (NoSuchFieldException e) {
                current = current.getSuperclass();
            }
        }
        throw new RuntimeException("Field not found: " + fieldName);
    }
}
