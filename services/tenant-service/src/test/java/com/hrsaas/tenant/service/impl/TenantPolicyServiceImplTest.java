package com.hrsaas.tenant.service.impl;

import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.entity.BaseEntity;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.tenant.domain.constant.DefaultPolicyData;
import com.hrsaas.tenant.domain.dto.request.UpdateTenantPolicyRequest;
import com.hrsaas.tenant.domain.dto.response.TenantPolicyResponse;
import com.hrsaas.tenant.domain.entity.PolicyType;
import com.hrsaas.tenant.domain.entity.TenantPolicy;
import com.hrsaas.tenant.domain.event.TenantPolicyChangedEvent;
import com.hrsaas.tenant.repository.TenantPolicyRepository;
import com.hrsaas.tenant.repository.TenantRepository;
import com.hrsaas.tenant.service.PolicyDataValidator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TenantPolicyServiceImpl Tests")
class TenantPolicyServiceImplTest {

    @InjectMocks
    private TenantPolicyServiceImpl tenantPolicyService;

    @Mock
    private TenantPolicyRepository tenantPolicyRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private PolicyDataValidator policyDataValidator;

    @Mock
    private EventPublisher eventPublisher;

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID POLICY_ID = UUID.fromString("10000000-0000-0000-0000-000000000001");

    private TenantPolicy createTenantPolicy(UUID tenantId, PolicyType policyType, String policyData) {
        TenantPolicy policy = TenantPolicy.builder()
                .tenantId(tenantId)
                .policyType(policyType)
                .policyData(policyData)
                .build();
        setEntityId(policy, POLICY_ID);
        return policy;
    }

    private void setEntityId(TenantPolicy entity, UUID id) {
        try {
            var field = BaseEntity.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set entity id", e);
        }
    }

    @Nested
    @DisplayName("getByTenantIdAndPolicyType")
    class GetByTenantIdAndPolicyTypeTest {

        @Test
        @DisplayName("정책이 존재하면 응답을 반환한다")
        void getByTenantIdAndPolicyType_exists_returnsResponse() {
            // given
            PolicyType policyType = PolicyType.PASSWORD;
            String policyData = DefaultPolicyData.get(policyType);
            TenantPolicy policy = createTenantPolicy(TENANT_ID, policyType, policyData);

            when(tenantRepository.existsById(TENANT_ID)).thenReturn(true);
            when(tenantPolicyRepository.findByTenantIdAndPolicyType(TENANT_ID, policyType))
                    .thenReturn(Optional.of(policy));

            // when
            TenantPolicyResponse response = tenantPolicyService.getByTenantIdAndPolicyType(TENANT_ID, policyType);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(POLICY_ID);
            assertThat(response.getTenantId()).isEqualTo(TENANT_ID);
            assertThat(response.getPolicyType()).isEqualTo(policyType);
            assertThat(response.getPolicyData()).isEqualTo(policyData);
            assertThat(response.getIsActive()).isTrue();

            verify(tenantRepository).existsById(TENANT_ID);
            verify(tenantPolicyRepository).findByTenantIdAndPolicyType(TENANT_ID, policyType);
        }

        @Test
        @DisplayName("정책이 없으면 기본값 폴백을 반환한다")
        void getByTenantIdAndPolicyType_notExists_returnsFallbackDefault() {
            // given
            PolicyType policyType = PolicyType.ATTENDANCE;

            when(tenantRepository.existsById(TENANT_ID)).thenReturn(true);
            when(tenantPolicyRepository.findByTenantIdAndPolicyType(TENANT_ID, policyType))
                    .thenReturn(Optional.empty());

            // when
            TenantPolicyResponse response = tenantPolicyService.getByTenantIdAndPolicyType(TENANT_ID, policyType);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getId()).isNull();
            assertThat(response.getTenantId()).isEqualTo(TENANT_ID);
            assertThat(response.getPolicyType()).isEqualTo(policyType);
            assertThat(response.getPolicyData()).isEqualTo(DefaultPolicyData.get(policyType));
            assertThat(response.getIsActive()).isTrue();
        }

        @Test
        @DisplayName("테넌트가 존재하지 않으면 NotFoundException 발생")
        void getByTenantIdAndPolicyType_tenantNotFound_throwsNotFoundException() {
            // given
            UUID unknownTenantId = UUID.randomUUID();
            when(tenantRepository.existsById(unknownTenantId)).thenReturn(false);

            // when & then
            assertThatThrownBy(() ->
                    tenantPolicyService.getByTenantIdAndPolicyType(unknownTenantId, PolicyType.PASSWORD))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining(unknownTenantId.toString());

            verify(tenantPolicyRepository, never()).findByTenantIdAndPolicyType(any(), any());
        }
    }

    @Nested
    @DisplayName("getAllByTenantId")
    class GetAllByTenantIdTest {

        @Test
        @DisplayName("테넌트의 전체 정책 목록을 반환한다")
        void getAllByTenantId_returnsList() {
            // given
            TenantPolicy passwordPolicy = createTenantPolicy(TENANT_ID, PolicyType.PASSWORD,
                    DefaultPolicyData.get(PolicyType.PASSWORD));

            UUID secondPolicyId = UUID.fromString("10000000-0000-0000-0000-000000000002");
            TenantPolicy attendancePolicy = TenantPolicy.builder()
                    .tenantId(TENANT_ID)
                    .policyType(PolicyType.ATTENDANCE)
                    .policyData(DefaultPolicyData.get(PolicyType.ATTENDANCE))
                    .build();
            setEntityId(attendancePolicy, secondPolicyId);

            when(tenantRepository.existsById(TENANT_ID)).thenReturn(true);
            when(tenantPolicyRepository.findAllByTenantId(TENANT_ID))
                    .thenReturn(List.of(passwordPolicy, attendancePolicy));

            // when
            List<TenantPolicyResponse> responses = tenantPolicyService.getAllByTenantId(TENANT_ID);

            // then
            assertThat(responses).hasSize(2);
            assertThat(responses.get(0).getPolicyType()).isEqualTo(PolicyType.PASSWORD);
            assertThat(responses.get(1).getPolicyType()).isEqualTo(PolicyType.ATTENDANCE);

            verify(tenantRepository).existsById(TENANT_ID);
            verify(tenantPolicyRepository).findAllByTenantId(TENANT_ID);
        }
    }

    @Nested
    @DisplayName("getActiveByTenantId")
    class GetActiveByTenantIdTest {

        @Test
        @DisplayName("테넌트의 활성 정책 목록을 반환한다")
        void getActiveByTenantId_returnsList() {
            // given
            TenantPolicy activePolicy = createTenantPolicy(TENANT_ID, PolicyType.LEAVE,
                    DefaultPolicyData.get(PolicyType.LEAVE));

            when(tenantRepository.existsById(TENANT_ID)).thenReturn(true);
            when(tenantPolicyRepository.findActiveByTenantId(TENANT_ID))
                    .thenReturn(List.of(activePolicy));

            // when
            List<TenantPolicyResponse> responses = tenantPolicyService.getActiveByTenantId(TENANT_ID);

            // then
            assertThat(responses).hasSize(1);
            assertThat(responses.get(0).getPolicyType()).isEqualTo(PolicyType.LEAVE);
            assertThat(responses.get(0).getIsActive()).isTrue();

            verify(tenantRepository).existsById(TENANT_ID);
            verify(tenantPolicyRepository).findActiveByTenantId(TENANT_ID);
        }
    }

    @Nested
    @DisplayName("saveOrUpdate")
    class SaveOrUpdateTest {

        @Test
        @DisplayName("신규 정책 생성 시 CREATED 이벤트를 발행한다")
        void saveOrUpdate_newPolicy_createsAndPublishesEvent() {
            // given
            PolicyType policyType = PolicyType.SECURITY;
            String policyData = DefaultPolicyData.get(policyType);
            UpdateTenantPolicyRequest request = UpdateTenantPolicyRequest.builder()
                    .policyData(policyData)
                    .isActive(true)
                    .build();

            TenantPolicy savedPolicy = createTenantPolicy(TENANT_ID, policyType, policyData);

            when(tenantRepository.existsById(TENANT_ID)).thenReturn(true);
            when(tenantPolicyRepository.existsByTenantIdAndPolicyType(TENANT_ID, policyType)).thenReturn(false);
            when(tenantPolicyRepository.findByTenantIdAndPolicyType(TENANT_ID, policyType))
                    .thenReturn(Optional.empty());
            when(tenantPolicyRepository.save(any(TenantPolicy.class))).thenReturn(savedPolicy);

            // when
            TenantPolicyResponse response = tenantPolicyService.saveOrUpdate(TENANT_ID, policyType, request);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(POLICY_ID);
            assertThat(response.getPolicyType()).isEqualTo(policyType);
            assertThat(response.getPolicyData()).isEqualTo(policyData);

            verify(policyDataValidator).validate(policyType, policyData);
            verify(tenantPolicyRepository).save(any(TenantPolicy.class));

            ArgumentCaptor<TenantPolicyChangedEvent> eventCaptor = ArgumentCaptor.forClass(TenantPolicyChangedEvent.class);
            verify(eventPublisher).publish(eventCaptor.capture());
            TenantPolicyChangedEvent event = eventCaptor.getValue();
            assertThat(event.getTenantId()).isEqualTo(TENANT_ID);
            assertThat(event.getPolicyType()).isEqualTo(policyType);
            assertThat(event.getAction()).isEqualTo("CREATED");
        }

        @Test
        @DisplayName("기존 정책 수정 시 UPDATED 이벤트를 발행한다")
        void saveOrUpdate_existingPolicy_updatesAndPublishesEvent() {
            // given
            PolicyType policyType = PolicyType.PASSWORD;
            String updatedPolicyData = "{\"minLength\":12,\"maxLength\":30}";
            UpdateTenantPolicyRequest request = UpdateTenantPolicyRequest.builder()
                    .policyData(updatedPolicyData)
                    .isActive(false)
                    .build();

            TenantPolicy existingPolicy = createTenantPolicy(TENANT_ID, policyType,
                    DefaultPolicyData.get(policyType));
            TenantPolicy savedPolicy = createTenantPolicy(TENANT_ID, policyType, updatedPolicyData);
            savedPolicy.deactivate();

            when(tenantRepository.existsById(TENANT_ID)).thenReturn(true);
            when(tenantPolicyRepository.existsByTenantIdAndPolicyType(TENANT_ID, policyType)).thenReturn(true);
            when(tenantPolicyRepository.findByTenantIdAndPolicyType(TENANT_ID, policyType))
                    .thenReturn(Optional.of(existingPolicy));
            when(tenantPolicyRepository.save(any(TenantPolicy.class))).thenReturn(savedPolicy);

            // when
            TenantPolicyResponse response = tenantPolicyService.saveOrUpdate(TENANT_ID, policyType, request);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getPolicyData()).isEqualTo(updatedPolicyData);
            assertThat(response.getIsActive()).isFalse();

            verify(policyDataValidator).validate(policyType, updatedPolicyData);
            verify(tenantPolicyRepository).save(any(TenantPolicy.class));

            ArgumentCaptor<TenantPolicyChangedEvent> eventCaptor = ArgumentCaptor.forClass(TenantPolicyChangedEvent.class);
            verify(eventPublisher).publish(eventCaptor.capture());
            TenantPolicyChangedEvent event = eventCaptor.getValue();
            assertThat(event.getTenantId()).isEqualTo(TENANT_ID);
            assertThat(event.getPolicyType()).isEqualTo(policyType);
            assertThat(event.getAction()).isEqualTo("UPDATED");
        }

        @Test
        @DisplayName("유효하지 않은 정책 데이터이면 BusinessException 발생")
        void saveOrUpdate_invalidData_throwsBusinessException() {
            // given
            PolicyType policyType = PolicyType.PASSWORD;
            String invalidPolicyData = "{invalid json}";
            UpdateTenantPolicyRequest request = UpdateTenantPolicyRequest.builder()
                    .policyData(invalidPolicyData)
                    .isActive(true)
                    .build();

            when(tenantRepository.existsById(TENANT_ID)).thenReturn(true);
            doThrow(new BusinessException("TNT_005", "정책 데이터 형식이 올바르지 않습니다: PASSWORD"))
                    .when(policyDataValidator).validate(any(), any());

            // when & then
            assertThatThrownBy(() ->
                    tenantPolicyService.saveOrUpdate(TENANT_ID, policyType, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("정책 데이터 형식이 올바르지 않습니다");

            verify(tenantPolicyRepository, never()).save(any());
            verify(eventPublisher, never()).publish(any());
        }
    }

    @Nested
    @DisplayName("delete")
    class DeleteTest {

        @Test
        @DisplayName("정책이 존재하면 삭제하고 DELETED 이벤트를 발행한다")
        void delete_exists_deletesAndPublishesEvent() {
            // given
            PolicyType policyType = PolicyType.NOTIFICATION;
            TenantPolicy policy = createTenantPolicy(TENANT_ID, policyType,
                    DefaultPolicyData.get(policyType));

            when(tenantPolicyRepository.findByTenantIdAndPolicyType(TENANT_ID, policyType))
                    .thenReturn(Optional.of(policy));

            // when
            tenantPolicyService.delete(TENANT_ID, policyType);

            // then
            verify(tenantPolicyRepository).delete(policy);

            ArgumentCaptor<TenantPolicyChangedEvent> eventCaptor = ArgumentCaptor.forClass(TenantPolicyChangedEvent.class);
            verify(eventPublisher).publish(eventCaptor.capture());
            TenantPolicyChangedEvent event = eventCaptor.getValue();
            assertThat(event.getTenantId()).isEqualTo(TENANT_ID);
            assertThat(event.getPolicyType()).isEqualTo(policyType);
            assertThat(event.getAction()).isEqualTo("DELETED");
        }

        @Test
        @DisplayName("정책이 존재하지 않으면 NotFoundException 발생")
        void delete_notExists_throwsNotFoundException() {
            // given
            PolicyType policyType = PolicyType.ORGANIZATION;

            when(tenantPolicyRepository.findByTenantIdAndPolicyType(TENANT_ID, policyType))
                    .thenReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() ->
                    tenantPolicyService.delete(TENANT_ID, policyType))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining(policyType.toString());

            verify(tenantPolicyRepository, never()).delete(any(TenantPolicy.class));
            verify(eventPublisher, never()).publish(any());
        }
    }
}
