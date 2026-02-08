package com.hrsaas.tenant.service;

import com.hrsaas.common.tenant.TenantInfo;
import com.hrsaas.tenant.domain.entity.PlanType;
import com.hrsaas.tenant.domain.entity.Tenant;
import com.hrsaas.tenant.domain.entity.TenantStatus;
import com.hrsaas.tenant.repository.TenantRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TenantResolverImplTest {

    @Mock
    private TenantRepository tenantRepository;

    @InjectMocks
    private TenantResolverImpl tenantResolver;

    private Tenant createTenant(UUID id, String code, String name) {
        Tenant tenant = Tenant.builder()
                .code(code)
                .name(name)
                .planType(PlanType.STANDARD)
                .build();
        setId(tenant, id);
        return tenant;
    }

    private void setId(Tenant tenant, UUID id) {
        try {
            Field idField = tenant.getClass().getSuperclass().getSuperclass().getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(tenant, id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set tenant id", e);
        }
    }

    @Test
    void resolve_existingTenant_returnsTenantInfo() {
        UUID tenantId = UUID.randomUUID();
        Tenant tenant = createTenant(tenantId, "ACME", "Acme Corporation");

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));

        TenantInfo result = tenantResolver.resolve(tenantId);

        assertThat(result).isNotNull();
        assertThat(result.getTenantId()).isEqualTo(tenantId);
        assertThat(result.getTenantCode()).isEqualTo("ACME");
        assertThat(result.getTenantName()).isEqualTo("Acme Corporation");
        assertThat(result.isActive()).isTrue();
    }

    @Test
    void resolve_nonExistent_returnsNull() {
        UUID tenantId = UUID.randomUUID();

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.empty());

        TenantInfo result = tenantResolver.resolve(tenantId);

        assertThat(result).isNull();
    }

    @Test
    void resolveByCode_existingTenant_returnsTenantInfo() {
        UUID tenantId = UUID.randomUUID();
        Tenant tenant = createTenant(tenantId, "ACME", "Acme Corporation");

        when(tenantRepository.findByCode("ACME")).thenReturn(Optional.of(tenant));

        TenantInfo result = tenantResolver.resolveByCode("ACME");

        assertThat(result).isNotNull();
        assertThat(result.getTenantId()).isEqualTo(tenantId);
        assertThat(result.getTenantCode()).isEqualTo("ACME");
        assertThat(result.getTenantName()).isEqualTo("Acme Corporation");
        assertThat(result.isActive()).isTrue();
    }

    @Test
    void resolveByCode_nonExistent_returnsNull() {
        when(tenantRepository.findByCode("NONEXISTENT")).thenReturn(Optional.empty());

        TenantInfo result = tenantResolver.resolveByCode("NONEXISTENT");

        assertThat(result).isNull();
    }

    @Test
    void isActive_activeTenant_returnsTrue() {
        UUID tenantId = UUID.randomUUID();
        Tenant tenant = createTenant(tenantId, "ACME", "Acme Corporation");

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));

        boolean result = tenantResolver.isActive(tenantId);

        assertThat(result).isTrue();
    }
}
