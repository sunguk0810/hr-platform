package com.hrsaas.tenant.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.tenant.domain.dto.request.CreateTenantRequest;
import com.hrsaas.tenant.domain.dto.request.TenantSearchRequest;
import com.hrsaas.tenant.domain.dto.request.UpdateTenantRequest;
import com.hrsaas.tenant.domain.dto.response.TenantResponse;
import com.hrsaas.tenant.domain.entity.PlanType;
import com.hrsaas.tenant.domain.entity.Tenant;
import com.hrsaas.tenant.domain.entity.TenantStatus;
import com.hrsaas.tenant.domain.event.TenantCreatedEvent;
import com.hrsaas.tenant.domain.event.TenantStatusChangedEvent;
import com.hrsaas.tenant.domain.event.TenantUpdatedEvent;
import com.hrsaas.tenant.repository.TenantPolicyRepository;
import com.hrsaas.tenant.repository.TenantRepository;
import com.hrsaas.tenant.service.PlanUpgradeService;
import com.hrsaas.tenant.service.TenantProvisioningService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TenantServiceImplTest {

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private TenantPolicyRepository tenantPolicyRepository;

    @Mock
    private EventPublisher eventPublisher;

    @Mock
    private TenantProvisioningService provisioningService;

    @Mock
    private PlanUpgradeService planUpgradeService;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private TenantServiceImpl tenantService;

    @Captor
    private ArgumentCaptor<DomainEvent> eventCaptor;

    private UUID tenantId;
    private Tenant tenant;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        tenant = createTenant();
    }

    @AfterEach
    void tearDown() {
        // Clear TenantContext if used in any test
        // TenantContext.clear();
    }

    // ===== create =====

    @Test
    @DisplayName("create: success - returns TenantResponse, provisions, and publishes event")
    void create_success_returnsTenantResponse() {
        // given
        CreateTenantRequest request = CreateTenantRequest.builder()
                .code("ACME")
                .name("Acme Corporation")
                .businessNumber("123-45-67890")
                .representativeName("John Doe")
                .address("123 Main Street")
                .phone("02-1234-5678")
                .email("admin@acme.com")
                .planType(PlanType.STANDARD)
                .contractStartDate(LocalDate.of(2026, 1, 1))
                .contractEndDate(LocalDate.of(2027, 1, 1))
                .maxEmployees(500)
                .build();

        when(tenantRepository.existsByCode("ACME")).thenReturn(false);
        when(tenantRepository.existsByBusinessNumber("123-45-67890")).thenReturn(false);
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(invocation -> {
            Tenant saved = invocation.getArgument(0);
            setId(saved, tenantId);
            return saved;
        });

        // when
        TenantResponse response = tenantService.create(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getCode()).isEqualTo("ACME");
        assertThat(response.getName()).isEqualTo("Acme Corporation");
        assertThat(response.getPlanType()).isEqualTo(PlanType.STANDARD);
        assertThat(response.getEmail()).isEqualTo("admin@acme.com");

        verify(tenantRepository).save(any(Tenant.class));
        verify(provisioningService).provision(eq(tenantId), eq(PlanType.STANDARD));
        verify(eventPublisher).publish(eventCaptor.capture());

        DomainEvent publishedEvent = eventCaptor.getValue();
        assertThat(publishedEvent).isInstanceOf(TenantCreatedEvent.class);
        TenantCreatedEvent createdEvent = (TenantCreatedEvent) publishedEvent;
        assertThat(createdEvent.getTenantCode()).isEqualTo("ACME");
        assertThat(createdEvent.getPlanType()).isEqualTo(PlanType.STANDARD);
    }

    @Test
    @DisplayName("create: duplicate code - throws DuplicateException")
    void create_duplicateCode_throwsDuplicateException() {
        // given
        CreateTenantRequest request = CreateTenantRequest.builder()
                .code("EXISTING")
                .name("Existing Tenant")
                .email("existing@test.com")
                .planType(PlanType.BASIC)
                .build();

        when(tenantRepository.existsByCode("EXISTING")).thenReturn(true);

        // when & then
        assertThatThrownBy(() -> tenantService.create(request))
                .isInstanceOf(DuplicateException.class)
                .hasMessageContaining("EXISTING");

        verify(tenantRepository, never()).save(any());
        verify(provisioningService, never()).provision(any(), any());
        verify(eventPublisher, never()).publish(any(DomainEvent.class));
    }

    @Test
    @DisplayName("create: duplicate business number - throws DuplicateException")
    void create_duplicateBusinessNumber_throwsDuplicateException() {
        // given
        CreateTenantRequest request = CreateTenantRequest.builder()
                .code("NEWCODE")
                .name("New Tenant")
                .businessNumber("999-99-99999")
                .email("new@test.com")
                .planType(PlanType.STANDARD)
                .build();

        when(tenantRepository.existsByCode("NEWCODE")).thenReturn(false);
        when(tenantRepository.existsByBusinessNumber("999-99-99999")).thenReturn(true);

        // when & then
        assertThatThrownBy(() -> tenantService.create(request))
                .isInstanceOf(DuplicateException.class)
                .hasMessageContaining("999-99-99999");

        verify(tenantRepository, never()).save(any());
        verify(provisioningService, never()).provision(any(), any());
        verify(eventPublisher, never()).publish(any(DomainEvent.class));
    }

    // ===== getById =====

    @Test
    @DisplayName("getById: exists - returns TenantResponse")
    void getById_exists_returnsTenantResponse() {
        // given
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));

        // when
        TenantResponse response = tenantService.getById(tenantId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(tenantId);
        assertThat(response.getCode()).isEqualTo("TEST");
        assertThat(response.getName()).isEqualTo("Test Tenant");
        verify(tenantRepository).findById(tenantId);
    }

    @Test
    @DisplayName("getById: not found - throws NotFoundException")
    void getById_notFound_throwsNotFoundException() {
        // given
        UUID unknownId = UUID.randomUUID();
        when(tenantRepository.findById(unknownId)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> tenantService.getById(unknownId))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining(unknownId.toString());
    }

    // ===== getByCode =====

    @Test
    @DisplayName("getByCode: exists - returns TenantResponse")
    void getByCode_exists_returnsTenantResponse() {
        // given
        when(tenantRepository.findByCode("TEST")).thenReturn(Optional.of(tenant));

        // when
        TenantResponse response = tenantService.getByCode("TEST");

        // then
        assertThat(response).isNotNull();
        assertThat(response.getCode()).isEqualTo("TEST");
        assertThat(response.getName()).isEqualTo("Test Tenant");
        verify(tenantRepository).findByCode("TEST");
    }

    @Test
    @DisplayName("getByCode: not found - throws NotFoundException")
    void getByCode_notFound_throwsNotFoundException() {
        // given
        when(tenantRepository.findByCode("UNKNOWN")).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> tenantService.getByCode("UNKNOWN"))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("UNKNOWN");
    }

    // ===== getAll =====

    @Test
    @DisplayName("getAll: returns PageResponse with tenant list")
    void getAll_returnsPageResponse() {
        // given
        Tenant tenant2 = createTenantWithCodeAndName("SECOND", "Second Tenant");
        Pageable pageable = PageRequest.of(0, 10);
        Page<Tenant> page = new PageImpl<>(List.of(tenant, tenant2), pageable, 2);

        when(tenantRepository.findAll(pageable)).thenReturn(page);

        // when
        PageResponse<TenantResponse> response = tenantService.getAll(pageable);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(2);
        assertThat(response.getContent().get(0).getCode()).isEqualTo("TEST");
        assertThat(response.getContent().get(1).getCode()).isEqualTo("SECOND");
        assertThat(response.getPage().getTotalElements()).isEqualTo(2);
        assertThat(response.getPage().getNumber()).isEqualTo(0);
        assertThat(response.getPage().getSize()).isEqualTo(10);
    }

    // ===== update =====

    @Test
    @DisplayName("update: success - publishes TenantUpdatedEvent")
    void update_success_publishesEvent() {
        // given
        UpdateTenantRequest request = UpdateTenantRequest.builder()
                .name("Updated Tenant Name")
                .email("updated@test.com")
                .phone("010-9999-8888")
                .build();

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        TenantResponse response = tenantService.update(tenantId, request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("Updated Tenant Name");
        assertThat(response.getEmail()).isEqualTo("updated@test.com");
        assertThat(response.getPhone()).isEqualTo("010-9999-8888");

        verify(eventPublisher).publish(eventCaptor.capture());
        DomainEvent publishedEvent = eventCaptor.getValue();
        assertThat(publishedEvent).isInstanceOf(TenantUpdatedEvent.class);
        TenantUpdatedEvent updatedEvent = (TenantUpdatedEvent) publishedEvent;
        assertThat(updatedEvent.getTenantId()).isEqualTo(tenantId);

        // planUpgradeService should NOT be called when planType is not changed
        verify(planUpgradeService, never()).syncFeatures(any(), any());
    }

    @Test
    @DisplayName("update: plan type changed - syncs features and publishes event")
    void update_planTypeChanged_syncsFeaturesAndPublishesEvent() {
        // given
        // tenant starts with STANDARD plan (set in createTenant)
        UpdateTenantRequest request = UpdateTenantRequest.builder()
                .planType(PlanType.PREMIUM)
                .build();

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        TenantResponse response = tenantService.update(tenantId, request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getPlanType()).isEqualTo(PlanType.PREMIUM);

        verify(planUpgradeService).syncFeatures(eq(tenantId), eq(PlanType.PREMIUM));
        verify(eventPublisher).publish(eventCaptor.capture());
        DomainEvent publishedEvent = eventCaptor.getValue();
        assertThat(publishedEvent).isInstanceOf(TenantUpdatedEvent.class);
    }

    // ===== activate =====

    @Test
    @DisplayName("activate: success - publishes TenantStatusChangedEvent")
    void activate_success_publishesStatusChangedEvent() {
        // given
        tenant.suspend(); // Set initial status to SUSPENDED
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        TenantResponse response = tenantService.activate(tenantId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(TenantStatus.ACTIVE);

        verify(eventPublisher).publish(eventCaptor.capture());
        DomainEvent publishedEvent = eventCaptor.getValue();
        assertThat(publishedEvent).isInstanceOf(TenantStatusChangedEvent.class);
        TenantStatusChangedEvent statusEvent = (TenantStatusChangedEvent) publishedEvent;
        assertThat(statusEvent.getTenantId()).isEqualTo(tenantId);
        assertThat(statusEvent.getPreviousStatus()).isEqualTo(TenantStatus.SUSPENDED);
        assertThat(statusEvent.getNewStatus()).isEqualTo(TenantStatus.ACTIVE);
    }

    // ===== suspend =====

    @Test
    @DisplayName("suspend: success - publishes TenantStatusChangedEvent")
    void suspend_success_publishesStatusChangedEvent() {
        // given
        // tenant is ACTIVE by default
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        TenantResponse response = tenantService.suspend(tenantId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(TenantStatus.SUSPENDED);

        verify(eventPublisher).publish(eventCaptor.capture());
        DomainEvent publishedEvent = eventCaptor.getValue();
        assertThat(publishedEvent).isInstanceOf(TenantStatusChangedEvent.class);
        TenantStatusChangedEvent statusEvent = (TenantStatusChangedEvent) publishedEvent;
        assertThat(statusEvent.getTenantId()).isEqualTo(tenantId);
        assertThat(statusEvent.getPreviousStatus()).isEqualTo(TenantStatus.ACTIVE);
        assertThat(statusEvent.getNewStatus()).isEqualTo(TenantStatus.SUSPENDED);
    }

    // ===== terminate =====

    @Test
    @DisplayName("terminate: success - publishes TenantStatusChangedEvent")
    void terminate_success_publishesStatusChangedEvent() {
        // given
        // tenant is ACTIVE by default
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        tenantService.terminate(tenantId);

        // then
        verify(tenantRepository).save(any(Tenant.class));
        verify(eventPublisher).publish(eventCaptor.capture());
        DomainEvent publishedEvent = eventCaptor.getValue();
        assertThat(publishedEvent).isInstanceOf(TenantStatusChangedEvent.class);
        TenantStatusChangedEvent statusEvent = (TenantStatusChangedEvent) publishedEvent;
        assertThat(statusEvent.getTenantId()).isEqualTo(tenantId);
        assertThat(statusEvent.getPreviousStatus()).isEqualTo(TenantStatus.ACTIVE);
        assertThat(statusEvent.getNewStatus()).isEqualTo(TenantStatus.TERMINATED);
    }

    // ===== search =====

    @Test
    @DisplayName("search: with filters - returns results")
    void search_withFilters_returnsResults() {
        // given
        TenantSearchRequest searchRequest = TenantSearchRequest.builder()
                .keyword("Acme")
                .status(TenantStatus.ACTIVE)
                .planType(PlanType.STANDARD)
                .contractEndDateFrom(LocalDate.of(2026, 1, 1))
                .contractEndDateTo(LocalDate.of(2027, 12, 31))
                .build();

        Pageable pageable = PageRequest.of(0, 20);
        Page<Tenant> page = new PageImpl<>(List.of(tenant), pageable, 1);

        when(tenantRepository.search(any(TenantSearchRequest.class), any(Pageable.class))).thenReturn(page);

        // when
        PageResponse<TenantResponse> response = tenantService.search(searchRequest, pageable);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getCode()).isEqualTo("TEST");
        assertThat(response.getPage().getTotalElements()).isEqualTo(1);

        verify(tenantRepository).search(eq(searchRequest), eq(pageable));
    }

    // ===== Helper Methods =====

    /**
     * Creates a default Tenant with ID set via reflection.
     */
    private Tenant createTenant() {
        Tenant t = Tenant.builder()
                .code("TEST")
                .name("Test Tenant")
                .businessNumber("111-22-33333")
                .representativeName("Test Rep")
                .address("Seoul, Korea")
                .phone("02-1234-5678")
                .email("test@test.com")
                .planType(PlanType.STANDARD)
                .contractStartDate(LocalDate.of(2026, 1, 1))
                .contractEndDate(LocalDate.of(2027, 1, 1))
                .maxEmployees(100)
                .build();
        setId(t, tenantId);
        return t;
    }

    /**
     * Creates a Tenant with a custom code and name, with ID set via reflection.
     */
    private Tenant createTenantWithCodeAndName(String code, String name) {
        Tenant t = Tenant.builder()
                .code(code)
                .name(name)
                .email(code.toLowerCase() + "@test.com")
                .planType(PlanType.STANDARD)
                .build();
        setId(t, UUID.randomUUID());
        return t;
    }

    /**
     * Sets the ID field on a BaseEntity via reflection, since the ID
     * is generated by JPA and not available through the builder.
     */
    private void setId(Tenant entity, UUID id) {
        try {
            var field = com.hrsaas.common.entity.BaseEntity.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set entity ID via reflection", e);
        }
    }
}
