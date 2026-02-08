package com.hrsaas.organization.service.impl;

import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.core.exception.ValidationException;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.organization.TestEntityFactory;
import com.hrsaas.organization.client.EmployeeClient;
import com.hrsaas.organization.domain.dto.request.CreatePositionRequest;
import com.hrsaas.organization.domain.dto.request.UpdatePositionRequest;
import com.hrsaas.organization.domain.dto.response.PositionResponse;
import com.hrsaas.organization.domain.entity.Position;
import com.hrsaas.organization.repository.PositionRepository;
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
class PositionServiceImplTest {

    @Mock
    private PositionRepository positionRepository;

    @Mock
    private EmployeeClient employeeClient;

    @InjectMocks
    private PositionServiceImpl positionService;

    private UUID tenantId;
    private UUID positionId;
    private Position position;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        positionId = UUID.randomUUID();
        TenantContext.setCurrentTenant(tenantId);

        position = TestEntityFactory.createPosition(positionId, "P01", "팀장", 1);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ===== create =====

    @Test
    @DisplayName("create: success - returns PositionResponse")
    void create_success_returnsPositionResponse() {
        // given
        CreatePositionRequest request = CreatePositionRequest.builder()
                .code("P01")
                .name("팀장")
                .nameEn("Team Leader")
                .level(1)
                .sortOrder(1)
                .build();

        when(positionRepository.existsByCodeAndTenantId("P01", tenantId)).thenReturn(false);
        when(positionRepository.save(any(Position.class))).thenAnswer(invocation -> {
            Position saved = invocation.getArgument(0);
            TestEntityFactory.setEntityId(saved, positionId);
            return saved;
        });

        // when
        PositionResponse response = positionService.create(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getCode()).isEqualTo("P01");
        assertThat(response.getName()).isEqualTo("팀장");
        assertThat(response.getNameEn()).isEqualTo("Team Leader");
        assertThat(response.getLevel()).isEqualTo(1);
        assertThat(response.getSortOrder()).isEqualTo(1);
        assertThat(response.getIsActive()).isTrue();

        verify(positionRepository).existsByCodeAndTenantId("P01", tenantId);
        verify(positionRepository).save(any(Position.class));
    }

    @Test
    @DisplayName("create: duplicate code - throws DuplicateException")
    void create_duplicateCode_throwsDuplicateException() {
        // given
        CreatePositionRequest request = CreatePositionRequest.builder()
                .code("P01")
                .name("팀장")
                .level(1)
                .build();

        when(positionRepository.existsByCodeAndTenantId("P01", tenantId)).thenReturn(true);

        // when & then
        assertThatThrownBy(() -> positionService.create(request))
                .isInstanceOf(DuplicateException.class)
                .hasMessageContaining("P01");

        verify(positionRepository).existsByCodeAndTenantId("P01", tenantId);
        verify(positionRepository, never()).save(any());
    }

    // ===== getById =====

    @Test
    @DisplayName("getById: exists - returns PositionResponse")
    void getById_exists_returnsPositionResponse() {
        // given
        when(positionRepository.findById(positionId)).thenReturn(Optional.of(position));

        // when
        PositionResponse response = positionService.getById(positionId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(positionId);
        assertThat(response.getCode()).isEqualTo("P01");
        assertThat(response.getName()).isEqualTo("팀장");

        verify(positionRepository).findById(positionId);
    }

    @Test
    @DisplayName("getById: not found - throws NotFoundException")
    void getById_notFound_throwsNotFoundException() {
        // given
        UUID nonExistentId = UUID.randomUUID();
        when(positionRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> positionService.getById(nonExistentId))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining(nonExistentId.toString());

        verify(positionRepository).findById(nonExistentId);
    }

    // ===== update =====

    @Test
    @DisplayName("update: success - returns updated PositionResponse")
    void update_success_returnsPositionResponse() {
        // given
        UpdatePositionRequest request = UpdatePositionRequest.builder()
                .name("파트장")
                .nameEn("Part Leader")
                .level(2)
                .sortOrder(2)
                .isActive(true)
                .build();

        when(positionRepository.findById(positionId)).thenReturn(Optional.of(position));
        when(positionRepository.save(any(Position.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        PositionResponse response = positionService.update(positionId, request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("파트장");
        assertThat(response.getNameEn()).isEqualTo("Part Leader");
        assertThat(response.getLevel()).isEqualTo(2);
        assertThat(response.getSortOrder()).isEqualTo(2);
        assertThat(response.getIsActive()).isTrue();

        verify(positionRepository).findById(positionId);
        verify(positionRepository).save(any(Position.class));
    }

    // ===== delete =====

    @Test
    @DisplayName("delete: no employees - deactivates position successfully")
    void delete_noEmployees_success() {
        // given
        when(positionRepository.findById(positionId)).thenReturn(Optional.of(position));
        when(employeeClient.countByPositionId(positionId)).thenReturn(ApiResponse.success(0L));
        when(positionRepository.save(any(Position.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        positionService.delete(positionId);

        // then
        assertThat(position.getIsActive()).isFalse();

        verify(positionRepository).findById(positionId);
        verify(employeeClient).countByPositionId(positionId);
        verify(positionRepository).save(position);
    }

    @Test
    @DisplayName("delete: has employees - throws ValidationException (ORG_014)")
    void delete_hasEmployees_throwsValidationException() {
        // given
        when(positionRepository.findById(positionId)).thenReturn(Optional.of(position));
        when(employeeClient.countByPositionId(positionId)).thenReturn(ApiResponse.success(5L));

        // when & then
        assertThatThrownBy(() -> positionService.delete(positionId))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("비활성화");

        assertThat(position.getIsActive()).isTrue();

        verify(positionRepository).findById(positionId);
        verify(employeeClient).countByPositionId(positionId);
        verify(positionRepository, never()).save(any());
    }
}
