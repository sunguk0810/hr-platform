package com.hrsaas.organization.service.impl;

import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.core.exception.ValidationException;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.organization.TestEntityFactory;
import com.hrsaas.organization.client.EmployeeClient;
import com.hrsaas.organization.domain.dto.request.CreateGradeRequest;
import com.hrsaas.organization.domain.dto.request.UpdateGradeRequest;
import com.hrsaas.organization.domain.dto.response.GradeResponse;
import com.hrsaas.organization.domain.entity.Grade;
import com.hrsaas.organization.repository.GradeRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GradeServiceImplTest {

    @Mock
    private GradeRepository gradeRepository;

    @Mock
    private EmployeeClient employeeClient;

    @InjectMocks
    private GradeServiceImpl gradeService;

    private UUID tenantId;
    private UUID gradeId;
    private Grade grade;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        gradeId = UUID.randomUUID();
        TenantContext.setCurrentTenant(tenantId);

        grade = TestEntityFactory.createGrade(gradeId, "G01", "사원", 1);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ===== create =====

    @Test
    @DisplayName("create: success - returns GradeResponse")
    void create_success_returnsGradeResponse() {
        // given
        CreateGradeRequest request = CreateGradeRequest.builder()
                .code("G01")
                .name("사원")
                .nameEn("Staff")
                .level(1)
                .sortOrder(1)
                .build();

        when(gradeRepository.existsByCodeAndTenantId("G01", tenantId)).thenReturn(false);
        when(gradeRepository.save(any(Grade.class))).thenAnswer(invocation -> {
            Grade saved = invocation.getArgument(0);
            TestEntityFactory.setEntityId(saved, gradeId);
            return saved;
        });

        // when
        GradeResponse response = gradeService.create(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getCode()).isEqualTo("G01");
        assertThat(response.getName()).isEqualTo("사원");
        assertThat(response.getNameEn()).isEqualTo("Staff");
        assertThat(response.getLevel()).isEqualTo(1);
        assertThat(response.getSortOrder()).isEqualTo(1);
        assertThat(response.getIsActive()).isTrue();

        verify(gradeRepository).existsByCodeAndTenantId("G01", tenantId);
        verify(gradeRepository).save(any(Grade.class));
    }

    @Test
    @DisplayName("create: duplicate code - throws DuplicateException")
    void create_duplicateCode_throwsDuplicateException() {
        // given
        CreateGradeRequest request = CreateGradeRequest.builder()
                .code("G01")
                .name("사원")
                .level(1)
                .build();

        when(gradeRepository.existsByCodeAndTenantId("G01", tenantId)).thenReturn(true);

        // when & then
        assertThatThrownBy(() -> gradeService.create(request))
                .isInstanceOf(DuplicateException.class)
                .hasMessageContaining("G01");

        verify(gradeRepository).existsByCodeAndTenantId("G01", tenantId);
        verify(gradeRepository, never()).save(any());
    }

    // ===== getById =====

    @Test
    @DisplayName("getById: exists - returns GradeResponse")
    void getById_exists_returnsGradeResponse() {
        // given
        when(gradeRepository.findById(gradeId)).thenReturn(Optional.of(grade));

        // when
        GradeResponse response = gradeService.getById(gradeId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(gradeId);
        assertThat(response.getCode()).isEqualTo("G01");
        assertThat(response.getName()).isEqualTo("사원");

        verify(gradeRepository).findById(gradeId);
    }

    @Test
    @DisplayName("getById: not found - throws NotFoundException")
    void getById_notFound_throwsNotFoundException() {
        // given
        UUID nonExistentId = UUID.randomUUID();
        when(gradeRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> gradeService.getById(nonExistentId))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining(nonExistentId.toString());

        verify(gradeRepository).findById(nonExistentId);
    }

    // ===== update =====

    @Test
    @DisplayName("update: success - returns updated GradeResponse")
    void update_success_returnsGradeResponse() {
        // given
        UpdateGradeRequest request = UpdateGradeRequest.builder()
                .name("대리")
                .nameEn("Assistant Manager")
                .level(2)
                .sortOrder(2)
                .isActive(true)
                .build();

        when(gradeRepository.findById(gradeId)).thenReturn(Optional.of(grade));
        when(gradeRepository.save(any(Grade.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        GradeResponse response = gradeService.update(gradeId, request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("대리");
        assertThat(response.getNameEn()).isEqualTo("Assistant Manager");
        assertThat(response.getLevel()).isEqualTo(2);
        assertThat(response.getSortOrder()).isEqualTo(2);
        assertThat(response.getIsActive()).isTrue();

        verify(gradeRepository).findById(gradeId);
        verify(gradeRepository).save(any(Grade.class));
    }

    // ===== delete =====

    @Test
    @DisplayName("delete: no employees - deactivates grade successfully")
    void delete_noEmployees_success() {
        // given
        when(gradeRepository.findById(gradeId)).thenReturn(Optional.of(grade));
        when(employeeClient.countByGradeId(gradeId)).thenReturn(ApiResponse.success(0L));
        when(gradeRepository.save(any(Grade.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        gradeService.delete(gradeId);

        // then
        assertThat(grade.getIsActive()).isFalse();

        verify(gradeRepository).findById(gradeId);
        verify(employeeClient).countByGradeId(gradeId);
        verify(gradeRepository).save(grade);
    }

    @Test
    @DisplayName("delete: has employees - throws ValidationException (ORG_013)")
    void delete_hasEmployees_throwsValidationException() {
        // given
        when(gradeRepository.findById(gradeId)).thenReturn(Optional.of(grade));
        when(employeeClient.countByGradeId(gradeId)).thenReturn(ApiResponse.success(5L));

        // when & then
        assertThatThrownBy(() -> gradeService.delete(gradeId))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("비활성화");

        assertThat(grade.getIsActive()).isTrue();

        verify(gradeRepository).findById(gradeId);
        verify(employeeClient).countByGradeId(gradeId);
        verify(gradeRepository, never()).save(any());
    }
}
