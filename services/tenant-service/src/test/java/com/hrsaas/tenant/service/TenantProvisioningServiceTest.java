package com.hrsaas.tenant.service;

import com.hrsaas.tenant.domain.entity.PlanType;
import com.hrsaas.tenant.domain.entity.PolicyType;
import com.hrsaas.tenant.domain.entity.TenantFeature;
import com.hrsaas.tenant.domain.entity.TenantPolicy;
import com.hrsaas.tenant.repository.TenantFeatureRepository;
import com.hrsaas.tenant.repository.TenantPolicyRepository;
import com.hrsaas.tenant.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TenantProvisioningServiceTest {

    @Mock
    private TenantPolicyRepository tenantPolicyRepository;

    @Mock
    private TenantFeatureRepository tenantFeatureRepository;

    @Mock
    private TenantRepository tenantRepository;

    private TenantProvisioningService service;

    @BeforeEach
    void setUp() {
        service = new TenantProvisioningService(
                tenantPolicyRepository, tenantFeatureRepository, tenantRepository, Optional.empty());
    }

    @Test
    void provision_basicPlan_creates7PoliciesAnd4Features() {
        UUID tenantId = UUID.randomUUID();

        when(tenantPolicyRepository.existsByTenantIdAndPolicyType(eq(tenantId), any(PolicyType.class)))
                .thenReturn(false);
        when(tenantFeatureRepository.existsByTenantIdAndFeatureCode(eq(tenantId), anyString()))
                .thenReturn(false);

        service.provision(tenantId, PlanType.BASIC);

        verify(tenantPolicyRepository, times(7)).save(any(TenantPolicy.class));
        verify(tenantFeatureRepository, times(4)).save(any(TenantFeature.class));
    }

    @Test
    void provision_standardPlan_creates7PoliciesAnd8Features() {
        UUID tenantId = UUID.randomUUID();

        when(tenantPolicyRepository.existsByTenantIdAndPolicyType(eq(tenantId), any(PolicyType.class)))
                .thenReturn(false);
        when(tenantFeatureRepository.existsByTenantIdAndFeatureCode(eq(tenantId), anyString()))
                .thenReturn(false);

        service.provision(tenantId, PlanType.STANDARD);

        verify(tenantPolicyRepository, times(7)).save(any(TenantPolicy.class));
        verify(tenantFeatureRepository, times(8)).save(any(TenantFeature.class));
    }

    @Test
    void provision_premiumPlan_creates7PoliciesAnd14Features() {
        UUID tenantId = UUID.randomUUID();

        when(tenantPolicyRepository.existsByTenantIdAndPolicyType(eq(tenantId), any(PolicyType.class)))
                .thenReturn(false);
        when(tenantFeatureRepository.existsByTenantIdAndFeatureCode(eq(tenantId), anyString()))
                .thenReturn(false);

        service.provision(tenantId, PlanType.PREMIUM);

        verify(tenantPolicyRepository, times(7)).save(any(TenantPolicy.class));
        verify(tenantFeatureRepository, times(14)).save(any(TenantFeature.class));
    }

    @Test
    void provision_enterprisePlan_creates7PoliciesAnd16Features() {
        UUID tenantId = UUID.randomUUID();

        when(tenantPolicyRepository.existsByTenantIdAndPolicyType(eq(tenantId), any(PolicyType.class)))
                .thenReturn(false);
        when(tenantFeatureRepository.existsByTenantIdAndFeatureCode(eq(tenantId), anyString()))
                .thenReturn(false);

        service.provision(tenantId, PlanType.ENTERPRISE);

        verify(tenantPolicyRepository, times(7)).save(any(TenantPolicy.class));
        verify(tenantFeatureRepository, times(16)).save(any(TenantFeature.class));
    }
}
