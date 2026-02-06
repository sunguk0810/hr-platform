package com.hrsaas.employee.service;

import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.domain.entity.EmployeeAffiliation;
import com.hrsaas.employee.domain.event.EmployeeAffiliationChangedEvent;
import com.hrsaas.employee.repository.EmployeeAffiliationRepository;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link AffiliationService}.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AffiliationService Tests")
class AffiliationServiceTest {

    @Mock
    private EmployeeAffiliationRepository affiliationRepository;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private AffiliationService affiliationService;

    @Captor
    private ArgumentCaptor<EmployeeAffiliationChangedEvent> eventCaptor;

    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID EMPLOYEE_ID = UUID.randomUUID();
    private static final UUID DEPARTMENT_ID = UUID.randomUUID();
    private static final UUID AFFILIATION_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("addAffiliation: valid data creates affiliation and publishes ADDED event")
    void addAffiliation_validData_createsAndPublishesEvent() {
        // given
        EmployeeAffiliation affiliation = EmployeeAffiliation.builder()
            .employeeId(EMPLOYEE_ID)
            .departmentId(DEPARTMENT_ID)
            .departmentName("Engineering")
            .positionCode("DEV")
            .positionName("Developer")
            .isPrimary(false)
            .affiliationType("SECONDARY")
            .startDate(LocalDate.of(2026, 1, 1))
            .isActive(true)
            .build();

        EmployeeAffiliation savedAffiliation = EmployeeAffiliation.builder()
            .employeeId(EMPLOYEE_ID)
            .departmentId(DEPARTMENT_ID)
            .departmentName("Engineering")
            .positionCode("DEV")
            .positionName("Developer")
            .isPrimary(false)
            .affiliationType("SECONDARY")
            .startDate(LocalDate.of(2026, 1, 1))
            .isActive(true)
            .build();

        when(affiliationRepository.save(affiliation)).thenReturn(savedAffiliation);

        // when
        EmployeeAffiliation result = affiliationService.addAffiliation(affiliation);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getEmployeeId()).isEqualTo(EMPLOYEE_ID);
        assertThat(result.getDepartmentId()).isEqualTo(DEPARTMENT_ID);
        assertThat(result.getAffiliationType()).isEqualTo("SECONDARY");

        verify(affiliationRepository).save(affiliation);
        verify(eventPublisher).publish(eventCaptor.capture());

        EmployeeAffiliationChangedEvent capturedEvent = eventCaptor.getValue();
        assertThat(capturedEvent.getEmployeeId()).isEqualTo(EMPLOYEE_ID);
        assertThat(capturedEvent.getDepartmentId()).isEqualTo(DEPARTMENT_ID);
        assertThat(capturedEvent.getAffiliationType()).isEqualTo("SECONDARY");
        assertThat(capturedEvent.getAction()).isEqualTo("ADDED");
    }

    @Test
    @DisplayName("addAffiliation: PRIMARY type when primary already exists throws exception via repository constraint")
    void addAffiliation_primaryAlreadyExists_throwsException() {
        // given
        // Simulate that a PRIMARY affiliation already exists by having the repository
        // throw a constraint violation when trying to save a second PRIMARY affiliation.
        EmployeeAffiliation newPrimary = EmployeeAffiliation.builder()
            .employeeId(EMPLOYEE_ID)
            .departmentId(DEPARTMENT_ID)
            .departmentName("HR Department")
            .positionCode("HR")
            .positionName("HR Manager")
            .isPrimary(true)
            .affiliationType("PRIMARY")
            .startDate(LocalDate.of(2026, 2, 1))
            .isActive(true)
            .build();

        when(affiliationRepository.save(newPrimary))
            .thenThrow(new org.springframework.dao.DataIntegrityViolationException(
                "Unique constraint violation: only one active PRIMARY affiliation allowed per employee"));

        // when & then
        assertThatThrownBy(() -> affiliationService.addAffiliation(newPrimary))
            .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class)
            .hasMessageContaining("PRIMARY");

        verify(eventPublisher, never()).publish(any(EmployeeAffiliationChangedEvent.class));
    }

    @Test
    @DisplayName("removeAffiliation: existing affiliation deactivates and publishes REMOVED event")
    void removeAffiliation_existing_softDeletesAndPublishesEvent() {
        // given
        EmployeeAffiliation existingAffiliation = EmployeeAffiliation.builder()
            .employeeId(EMPLOYEE_ID)
            .departmentId(DEPARTMENT_ID)
            .departmentName("Engineering")
            .positionCode("DEV")
            .positionName("Developer")
            .isPrimary(false)
            .affiliationType("CONCURRENT")
            .startDate(LocalDate.of(2025, 6, 1))
            .isActive(true)
            .build();

        when(affiliationRepository.findById(AFFILIATION_ID))
            .thenReturn(Optional.of(existingAffiliation));
        when(affiliationRepository.save(any(EmployeeAffiliation.class)))
            .thenReturn(existingAffiliation);

        // when
        affiliationService.removeAffiliation(AFFILIATION_ID);

        // then
        // Verify deactivation happened (soft delete via deactivate() method)
        assertThat(existingAffiliation.getIsActive()).isFalse();
        assertThat(existingAffiliation.getEndDate()).isEqualTo(LocalDate.now());

        verify(affiliationRepository).findById(AFFILIATION_ID);
        verify(affiliationRepository).save(existingAffiliation);
        verify(eventPublisher).publish(eventCaptor.capture());

        EmployeeAffiliationChangedEvent capturedEvent = eventCaptor.getValue();
        assertThat(capturedEvent.getEmployeeId()).isEqualTo(EMPLOYEE_ID);
        assertThat(capturedEvent.getDepartmentId()).isEqualTo(DEPARTMENT_ID);
        assertThat(capturedEvent.getAffiliationType()).isEqualTo("CONCURRENT");
        assertThat(capturedEvent.getAction()).isEqualTo("REMOVED");
    }

    @Test
    @DisplayName("removeAffiliation: non-existing affiliation throws IllegalArgumentException")
    void removeAffiliation_notFound_throwsException() {
        // given
        UUID nonExistentId = UUID.randomUUID();
        when(affiliationRepository.findById(nonExistentId))
            .thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> affiliationService.removeAffiliation(nonExistentId))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Affiliation not found");

        verify(affiliationRepository, never()).save(any());
        verify(eventPublisher, never()).publish(any(EmployeeAffiliationChangedEvent.class));
    }

    @Test
    @DisplayName("getByEmployeeId: returns only active affiliations")
    void getAffiliations_byEmployeeId_returnsActiveOnly() {
        // given
        EmployeeAffiliation activeAffiliation1 = EmployeeAffiliation.builder()
            .employeeId(EMPLOYEE_ID)
            .departmentId(DEPARTMENT_ID)
            .departmentName("Engineering")
            .affiliationType("PRIMARY")
            .isPrimary(true)
            .isActive(true)
            .startDate(LocalDate.of(2024, 1, 1))
            .build();

        EmployeeAffiliation activeAffiliation2 = EmployeeAffiliation.builder()
            .employeeId(EMPLOYEE_ID)
            .departmentId(UUID.randomUUID())
            .departmentName("Research")
            .affiliationType("CONCURRENT")
            .isPrimary(false)
            .isActive(true)
            .startDate(LocalDate.of(2025, 6, 1))
            .build();

        List<EmployeeAffiliation> activeAffiliations = List.of(activeAffiliation1, activeAffiliation2);

        when(affiliationRepository.findActiveByEmployeeId(TENANT_ID, EMPLOYEE_ID))
            .thenReturn(activeAffiliations);

        // when
        List<EmployeeAffiliation> result = affiliationService.getByEmployeeId(EMPLOYEE_ID);

        // then
        assertThat(result).hasSize(2);
        assertThat(result).allMatch(a -> a.getIsActive());
        assertThat(result.get(0).getAffiliationType()).isEqualTo("PRIMARY");
        assertThat(result.get(1).getAffiliationType()).isEqualTo("CONCURRENT");

        verify(affiliationRepository).findActiveByEmployeeId(TENANT_ID, EMPLOYEE_ID);
    }

    @Test
    @DisplayName("getByEmployeeId: returns empty list when no active affiliations exist")
    void getAffiliations_noActiveAffiliations_returnsEmptyList() {
        // given
        when(affiliationRepository.findActiveByEmployeeId(TENANT_ID, EMPLOYEE_ID))
            .thenReturn(List.of());

        // when
        List<EmployeeAffiliation> result = affiliationService.getByEmployeeId(EMPLOYEE_ID);

        // then
        assertThat(result).isEmpty();
        verify(affiliationRepository).findActiveByEmployeeId(TENANT_ID, EMPLOYEE_ID);
    }

    @Test
    @DisplayName("updateAffiliation: existing affiliation updates fields correctly")
    void updateAffiliation_existing_updatesFields() {
        // given
        EmployeeAffiliation existingAffiliation = EmployeeAffiliation.builder()
            .employeeId(EMPLOYEE_ID)
            .departmentId(DEPARTMENT_ID)
            .departmentName("Engineering")
            .positionCode("DEV")
            .positionName("Developer")
            .affiliationType("SECONDARY")
            .isPrimary(false)
            .isActive(true)
            .startDate(LocalDate.of(2025, 1, 1))
            .build();

        UUID newDepartmentId = UUID.randomUUID();
        EmployeeAffiliation updated = EmployeeAffiliation.builder()
            .departmentId(newDepartmentId)
            .departmentName("Product")
            .positionCode("PM")
            .positionName("Product Manager")
            .affiliationType("CONCURRENT")
            .startDate(LocalDate.of(2026, 1, 1))
            .endDate(LocalDate.of(2026, 12, 31))
            .build();

        when(affiliationRepository.findById(AFFILIATION_ID))
            .thenReturn(Optional.of(existingAffiliation));
        when(affiliationRepository.save(any(EmployeeAffiliation.class)))
            .thenReturn(existingAffiliation);

        // when
        EmployeeAffiliation result = affiliationService.updateAffiliation(AFFILIATION_ID, updated);

        // then
        assertThat(result.getDepartmentId()).isEqualTo(newDepartmentId);
        assertThat(result.getDepartmentName()).isEqualTo("Product");
        assertThat(result.getPositionCode()).isEqualTo("PM");
        assertThat(result.getPositionName()).isEqualTo("Product Manager");
        assertThat(result.getAffiliationType()).isEqualTo("CONCURRENT");

        verify(affiliationRepository).findById(AFFILIATION_ID);
        verify(affiliationRepository).save(existingAffiliation);
    }
}
