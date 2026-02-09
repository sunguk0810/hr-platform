package com.hrsaas.tenant.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.tenant.domain.dto.policy.PasswordPolicyData;
import com.hrsaas.tenant.domain.dto.request.CreateTenantRequest;
import com.hrsaas.tenant.domain.dto.request.UpdateTenantRequest;
import com.hrsaas.tenant.domain.dto.response.TenantDetailResponse;
import com.hrsaas.tenant.domain.dto.response.TenantListItemResponse;
import com.hrsaas.tenant.domain.dto.response.TenantResponse;
import com.hrsaas.tenant.domain.entity.PlanType;
import com.hrsaas.tenant.domain.entity.TenantStatus;
import com.hrsaas.tenant.repository.PolicyChangeHistoryRepository;
import com.hrsaas.tenant.repository.TenantRepository;
import com.hrsaas.tenant.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TenantController.class)
@AutoConfigureMockMvc(addFilters = false)
class TenantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TenantService tenantService;

    @MockBean
    private TenantBrandingService brandingService;

    @MockBean
    private TenantHierarchyService hierarchyService;

    @MockBean
    private PolicyInheritanceService policyInheritanceService;

    @MockBean
    private PolicyChangeHistoryRepository policyChangeHistoryRepository;

    @MockBean
    private TenantRepository tenantRepository;

    @MockBean
    private com.hrsaas.common.security.SecurityFilter securityFilter;

    @MockBean
    private com.hrsaas.common.security.jwt.JwtTokenProvider jwtTokenProvider;

    @MockBean(name = "permissionChecker")
    private com.hrsaas.common.security.PermissionChecker permissionChecker;

    private final UUID testTenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private TenantDetailResponse createMockDetailResponse() {
        return TenantDetailResponse.builder()
                .id(testTenantId)
                .code("ACME")
                .name("Acme Corporation")
                .status(TenantStatus.ACTIVE)
                .planType(PlanType.STANDARD)
                .build();
    }

    private TenantResponse createMockTenantResponse() {
        return TenantResponse.builder()
                .id(testTenantId)
                .code("ACME")
                .name("Acme Corporation")
                .status(TenantStatus.ACTIVE)
                .planType(PlanType.STANDARD)
                .build();
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void create_withSuperAdmin_returns201() throws Exception {
        CreateTenantRequest request = CreateTenantRequest.builder()
                .code("ACME")
                .name("Acme Corporation")
                .planType(PlanType.STANDARD)
                .build();

        when(tenantService.createWithDetail(any(CreateTenantRequest.class)))
                .thenReturn(createMockDetailResponse());

        mockMvc.perform(post("/api/v1/tenants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("ACME"))
                .andExpect(jsonPath("$.data.name").value("Acme Corporation"));
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void getById_withSuperAdmin_returns200() throws Exception {
        when(tenantService.getDetailById(testTenantId))
                .thenReturn(createMockDetailResponse());

        mockMvc.perform(get("/api/v1/tenants/{id}", testTenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(testTenantId.toString()))
                .andExpect(jsonPath("$.data.code").value("ACME"));
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void getAll_withSuperAdmin_returns200() throws Exception {
        PageResponse<TenantListItemResponse> pageResponse = PageResponse.<TenantListItemResponse>builder()
                .content(List.of(TenantListItemResponse.builder()
                        .id(testTenantId)
                        .code("ACME")
                        .name("Acme Corporation")
                        .status(TenantStatus.ACTIVE)
                        .build()))
                .page(PageResponse.PageInfo.builder()
                        .number(0)
                        .size(20)
                        .totalElements(1)
                        .totalPages(1)
                        .first(true)
                        .last(true)
                        .hasNext(false)
                        .hasPrevious(false)
                        .build())
                .build();

        when(tenantService.getAllList(any())).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/tenants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].code").value("ACME"));
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void update_withSuperAdmin_returns200() throws Exception {
        UpdateTenantRequest request = UpdateTenantRequest.builder()
                .name("Acme Corp Updated")
                .build();

        TenantDetailResponse updatedResponse = TenantDetailResponse.builder()
                .id(testTenantId)
                .code("ACME")
                .name("Acme Corp Updated")
                .status(TenantStatus.ACTIVE)
                .planType(PlanType.STANDARD)
                .build();

        when(tenantService.updateWithDetail(eq(testTenantId), any(UpdateTenantRequest.class)))
                .thenReturn(updatedResponse);

        mockMvc.perform(put("/api/v1/tenants/{id}", testTenantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Acme Corp Updated"));
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void activate_withSuperAdmin_returns200() throws Exception {
        TenantResponse activatedResponse = TenantResponse.builder()
                .id(testTenantId)
                .code("ACME")
                .name("Acme Corporation")
                .status(TenantStatus.ACTIVE)
                .planType(PlanType.STANDARD)
                .build();

        when(tenantService.activate(testTenantId)).thenReturn(activatedResponse);

        mockMvc.perform(post("/api/v1/tenants/{id}/activate", testTenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void suspend_withSuperAdmin_returns200() throws Exception {
        TenantResponse suspendedResponse = TenantResponse.builder()
                .id(testTenantId)
                .code("ACME")
                .name("Acme Corporation")
                .status(TenantStatus.SUSPENDED)
                .planType(PlanType.STANDARD)
                .build();

        when(tenantService.suspend(testTenantId)).thenReturn(suspendedResponse);

        mockMvc.perform(post("/api/v1/tenants/{id}/suspend", testTenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("SUSPENDED"));
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void delete_withSuperAdmin_returns200() throws Exception {
        doNothing().when(tenantService).terminate(testTenantId);

        mockMvc.perform(delete("/api/v1/tenants/{id}", testTenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void getStatus_permitAll_returns200() throws Exception {
        when(tenantService.getStatus(testTenantId)).thenReturn(TenantStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/tenants/{tenantId}/status", testTenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("ACTIVE"));
    }

    @Test
    void getPasswordPolicy_permitAll_returns200() throws Exception {
        PasswordPolicyData policyData = PasswordPolicyData.builder()
                .minLength(8)
                .build();

        when(tenantService.getPasswordPolicy(testTenantId)).thenReturn(policyData);

        mockMvc.perform(get("/api/v1/tenants/{tenantId}/password-policy", testTenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.minLength").value(8));
    }
}
