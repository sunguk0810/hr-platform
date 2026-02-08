package com.hrsaas.tenant.service.impl;

import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.entity.BaseEntity;
import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.tenant.domain.constant.FeatureCode;
import com.hrsaas.tenant.domain.dto.request.UpdateTenantFeatureRequest;
import com.hrsaas.tenant.domain.dto.response.TenantFeatureResponse;
import com.hrsaas.tenant.domain.entity.PlanType;
import com.hrsaas.tenant.domain.entity.Tenant;
import com.hrsaas.tenant.domain.entity.TenantFeature;
import com.hrsaas.tenant.repository.TenantFeatureRepository;
import com.hrsaas.tenant.repository.TenantRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TenantFeatureServiceImpl Tests")
class TenantFeatureServiceImplTest {

    @InjectMocks
    private TenantFeatureServiceImpl tenantFeatureService;

    @Mock
    private TenantFeatureRepository tenantFeatureRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private EventPublisher eventPublisher;

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID FEATURE_ID = UUID.fromString("10000000-0000-0000-0000-000000000001");

    /**
     * Sets the id field on a BaseEntity via reflection.
     */
    private void setEntityId(Object entity, UUID id) throws Exception {
        Field idField = BaseEntity.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(entity, id);
    }

    private TenantFeature createTenantFeature(UUID id, UUID tenantId, String featureCode, boolean enabled) throws Exception {
        TenantFeature feature = TenantFeature.builder()
                .tenantId(tenantId)
                .featureCode(featureCode)
                .isEnabled(enabled)
                .config("{\"maxUsers\": 100}")
                .build();
        setEntityId(feature, id);
        return feature;
    }

    private Tenant createTenant(UUID id, PlanType planType) throws Exception {
        Tenant tenant = Tenant.builder()
                .code("TENANT-001")
                .name("Test Tenant")
                .planType(planType)
                .build();
        setEntityId(tenant, id);
        return tenant;
    }

    @Nested
    @DisplayName("getByTenantIdAndFeatureCode")
    class GetByTenantIdAndFeatureCodeTest {

        @Test
        @DisplayName("존재하는 기능 조회 - 응답 반환")
        void getByTenantIdAndFeatureCode_exists_returnsResponse() throws Exception {
            // given
            TenantFeature feature = createTenantFeature(FEATURE_ID, TENANT_ID, FeatureCode.ATTENDANCE, true);

            when(tenantRepository.existsById(TENANT_ID)).thenReturn(true);
            when(tenantFeatureRepository.findByTenantIdAndFeatureCode(TENANT_ID, FeatureCode.ATTENDANCE))
                    .thenReturn(Optional.of(feature));

            // when
            TenantFeatureResponse response = tenantFeatureService.getByTenantIdAndFeatureCode(TENANT_ID, FeatureCode.ATTENDANCE);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(FEATURE_ID);
            assertThat(response.getTenantId()).isEqualTo(TENANT_ID);
            assertThat(response.getFeatureCode()).isEqualTo(FeatureCode.ATTENDANCE);
            assertThat(response.getIsEnabled()).isTrue();
            assertThat(response.getConfig()).isEqualTo("{\"maxUsers\": 100}");

            verify(tenantRepository).existsById(TENANT_ID);
            verify(tenantFeatureRepository).findByTenantIdAndFeatureCode(TENANT_ID, FeatureCode.ATTENDANCE);
        }

        @Test
        @DisplayName("존재하지 않는 기능 조회 - NotFoundException 발생")
        void getByTenantIdAndFeatureCode_notFound_throwsNotFoundException() {
            // given
            when(tenantRepository.existsById(TENANT_ID)).thenReturn(true);
            when(tenantFeatureRepository.findByTenantIdAndFeatureCode(TENANT_ID, FeatureCode.RECRUITMENT))
                    .thenReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() ->
                    tenantFeatureService.getByTenantIdAndFeatureCode(TENANT_ID, FeatureCode.RECRUITMENT))
                    .isInstanceOf(NotFoundException.class)
                    .satisfies(ex -> {
                        NotFoundException nfe = (NotFoundException) ex;
                        assertThat(nfe.getErrorCode()).isEqualTo("TNT_003");
                    });

            verify(tenantRepository).existsById(TENANT_ID);
            verify(tenantFeatureRepository).findByTenantIdAndFeatureCode(TENANT_ID, FeatureCode.RECRUITMENT);
        }
    }

    @Nested
    @DisplayName("getAllByTenantId")
    class GetAllByTenantIdTest {

        @Test
        @DisplayName("테넌트의 전체 기능 목록 반환")
        void getAllByTenantId_returnsList() throws Exception {
            // given
            TenantFeature feature1 = createTenantFeature(
                    UUID.fromString("10000000-0000-0000-0000-000000000001"),
                    TENANT_ID, FeatureCode.ATTENDANCE, true);
            TenantFeature feature2 = createTenantFeature(
                    UUID.fromString("10000000-0000-0000-0000-000000000002"),
                    TENANT_ID, FeatureCode.APPROVAL, false);

            when(tenantRepository.existsById(TENANT_ID)).thenReturn(true);
            when(tenantFeatureRepository.findAllByTenantId(TENANT_ID))
                    .thenReturn(List.of(feature1, feature2));

            // when
            List<TenantFeatureResponse> responses = tenantFeatureService.getAllByTenantId(TENANT_ID);

            // then
            assertThat(responses).hasSize(2);
            assertThat(responses.get(0).getFeatureCode()).isEqualTo(FeatureCode.ATTENDANCE);
            assertThat(responses.get(0).getIsEnabled()).isTrue();
            assertThat(responses.get(1).getFeatureCode()).isEqualTo(FeatureCode.APPROVAL);
            assertThat(responses.get(1).getIsEnabled()).isFalse();

            verify(tenantRepository).existsById(TENANT_ID);
            verify(tenantFeatureRepository).findAllByTenantId(TENANT_ID);
        }
    }

    @Nested
    @DisplayName("getEnabledByTenantId")
    class GetEnabledByTenantIdTest {

        @Test
        @DisplayName("테넌트의 활성화된 기능 목록만 반환")
        void getEnabledByTenantId_returnsList() throws Exception {
            // given
            TenantFeature enabledFeature = createTenantFeature(
                    UUID.fromString("10000000-0000-0000-0000-000000000001"),
                    TENANT_ID, FeatureCode.EMPLOYEE, true);

            when(tenantRepository.existsById(TENANT_ID)).thenReturn(true);
            when(tenantFeatureRepository.findEnabledByTenantId(TENANT_ID))
                    .thenReturn(List.of(enabledFeature));

            // when
            List<TenantFeatureResponse> responses = tenantFeatureService.getEnabledByTenantId(TENANT_ID);

            // then
            assertThat(responses).hasSize(1);
            assertThat(responses.get(0).getFeatureCode()).isEqualTo(FeatureCode.EMPLOYEE);
            assertThat(responses.get(0).getIsEnabled()).isTrue();

            verify(tenantRepository).existsById(TENANT_ID);
            verify(tenantFeatureRepository).findEnabledByTenantId(TENANT_ID);
        }
    }

    @Nested
    @DisplayName("update")
    class UpdateTest {

        @Test
        @DisplayName("ENTERPRISE 플랜 - GROUP_DASHBOARD 활성화 성공")
        void update_enableFeature_allowedByPlan_success() throws Exception {
            // given
            Tenant enterpriseTenant = createTenant(TENANT_ID, PlanType.ENTERPRISE);
            TenantFeature existingFeature = createTenantFeature(
                    FEATURE_ID, TENANT_ID, FeatureCode.GROUP_DASHBOARD, false);
            TenantFeature savedFeature = createTenantFeature(
                    FEATURE_ID, TENANT_ID, FeatureCode.GROUP_DASHBOARD, true);

            UpdateTenantFeatureRequest request = UpdateTenantFeatureRequest.builder()
                    .isEnabled(true)
                    .config("{\"widgets\": [\"headcount\", \"attendance\"]}")
                    .build();

            when(tenantRepository.existsById(TENANT_ID)).thenReturn(true);
            when(tenantRepository.findById(TENANT_ID)).thenReturn(Optional.of(enterpriseTenant));
            when(tenantFeatureRepository.findByTenantIdAndFeatureCode(TENANT_ID, FeatureCode.GROUP_DASHBOARD))
                    .thenReturn(Optional.of(existingFeature));
            when(tenantFeatureRepository.save(any(TenantFeature.class))).thenReturn(savedFeature);

            // when
            TenantFeatureResponse response = tenantFeatureService.update(
                    TENANT_ID, FeatureCode.GROUP_DASHBOARD, request);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getFeatureCode()).isEqualTo(FeatureCode.GROUP_DASHBOARD);
            assertThat(response.getIsEnabled()).isTrue();

            verify(tenantRepository).existsById(TENANT_ID);
            verify(tenantRepository).findById(TENANT_ID);
            verify(tenantFeatureRepository).findByTenantIdAndFeatureCode(TENANT_ID, FeatureCode.GROUP_DASHBOARD);
            verify(tenantFeatureRepository).save(any(TenantFeature.class));
            verify(eventPublisher).publish(any(DomainEvent.class));
        }

        @Test
        @DisplayName("BASIC 플랜 - APPOINTMENT 활성화 시도 - BusinessException(TNT_006) 발생")
        void update_enableFeature_notAllowedByPlan_throwsBusinessException() throws Exception {
            // given
            Tenant basicTenant = createTenant(TENANT_ID, PlanType.BASIC);

            UpdateTenantFeatureRequest request = UpdateTenantFeatureRequest.builder()
                    .isEnabled(true)
                    .build();

            when(tenantRepository.existsById(TENANT_ID)).thenReturn(true);
            when(tenantRepository.findById(TENANT_ID)).thenReturn(Optional.of(basicTenant));

            // when & then
            assertThatThrownBy(() ->
                    tenantFeatureService.update(TENANT_ID, FeatureCode.APPOINTMENT, request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException be = (BusinessException) ex;
                        assertThat(be.getErrorCode()).isEqualTo("TNT_006");
                    });

            verify(tenantRepository).existsById(TENANT_ID);
            verify(tenantRepository).findById(TENANT_ID);
            verify(tenantFeatureRepository, never()).save(any(TenantFeature.class));
            verify(eventPublisher, never()).publish(any(DomainEvent.class));
        }
    }

    @Nested
    @DisplayName("isFeatureEnabled")
    class IsFeatureEnabledTest {

        @Test
        @DisplayName("활성화된 기능 - true 반환")
        void isFeatureEnabled_enabled_returnsTrue() throws Exception {
            // given
            TenantFeature enabledFeature = createTenantFeature(
                    FEATURE_ID, TENANT_ID, FeatureCode.ATTENDANCE, true);

            when(tenantFeatureRepository.findByTenantIdAndFeatureCode(TENANT_ID, FeatureCode.ATTENDANCE))
                    .thenReturn(Optional.of(enabledFeature));

            // when
            boolean result = tenantFeatureService.isFeatureEnabled(TENANT_ID, FeatureCode.ATTENDANCE);

            // then
            assertThat(result).isTrue();
            verify(tenantFeatureRepository).findByTenantIdAndFeatureCode(TENANT_ID, FeatureCode.ATTENDANCE);
        }

        @Test
        @DisplayName("비활성화된 기능 - false 반환")
        void isFeatureEnabled_disabled_returnsFalse() throws Exception {
            // given
            TenantFeature disabledFeature = createTenantFeature(
                    FEATURE_ID, TENANT_ID, FeatureCode.RECRUITMENT, false);

            when(tenantFeatureRepository.findByTenantIdAndFeatureCode(TENANT_ID, FeatureCode.RECRUITMENT))
                    .thenReturn(Optional.of(disabledFeature));

            // when
            boolean result = tenantFeatureService.isFeatureEnabled(TENANT_ID, FeatureCode.RECRUITMENT);

            // then
            assertThat(result).isFalse();
            verify(tenantFeatureRepository).findByTenantIdAndFeatureCode(TENANT_ID, FeatureCode.RECRUITMENT);
        }

        @Test
        @DisplayName("존재하지 않는 기능 - false 반환")
        void isFeatureEnabled_notFound_returnsFalse() {
            // given
            when(tenantFeatureRepository.findByTenantIdAndFeatureCode(TENANT_ID, FeatureCode.API_INTEGRATION))
                    .thenReturn(Optional.empty());

            // when
            boolean result = tenantFeatureService.isFeatureEnabled(TENANT_ID, FeatureCode.API_INTEGRATION);

            // then
            assertThat(result).isFalse();
            verify(tenantFeatureRepository).findByTenantIdAndFeatureCode(TENANT_ID, FeatureCode.API_INTEGRATION);
        }
    }
}
