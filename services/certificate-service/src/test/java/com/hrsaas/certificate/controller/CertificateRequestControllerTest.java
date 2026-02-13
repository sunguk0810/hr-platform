package com.hrsaas.certificate.controller;

import com.hrsaas.certificate.domain.dto.response.CertificateRequestResponse;
import com.hrsaas.certificate.domain.entity.RequestStatus;
import com.hrsaas.certificate.service.CertificateRequestService;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.ErrorCode;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.security.UserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CertificateRequestController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("CertificateRequestController 계약 테스트")
class CertificateRequestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CertificateRequestService certificateRequestService;

    private UUID employeeId;

    @BeforeEach
    void setUp() {
        employeeId = UUID.randomUUID();
        SecurityContextHolder.setContext(UserContext.builder()
                .employeeId(employeeId)
                .userId(UUID.randomUUID())
                .roles(Set.of("EMPLOYEE"))
                .build());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clear();
    }

    @Test
    @DisplayName("GET /certificates/requests/my: 쿼리 미전달 시 context 기반 employeeId로 조회")
    void getMyRequests_withoutQuery_shouldUseContextEmployeeId() throws Exception {
        Page<CertificateRequestResponse> emptyPage = new PageImpl<>(List.of());
        when(certificateRequestService.getMyRequests(eq(employeeId), any(), any(), any(Pageable.class))).thenReturn(emptyPage);

        mockMvc.perform(get("/api/v1/certificates/requests/my")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(certificateRequestService).getMyRequests(
                eq(employeeId),
                eq(null),
                eq(null),
                any(Pageable.class));
    }

    @Test
    @DisplayName("GET /certificates/requests/my: 컨텍스트 누락 시 401 에러")
    void getMyRequests_withoutContext_shouldReturnUnauthorized() throws Exception {
        SecurityContextHolder.clear();

        when(certificateRequestService.getMyRequests(isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenThrow(new BusinessException(ErrorCode.UNAUTHORIZED, "인증 정보에서 직원 식별자를 확인할 수 없습니다"));

        mockMvc.perform(get("/api/v1/certificates/requests/my")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isUnauthorized());

        verify(certificateRequestService).getMyRequests(
                isNull(),
                isNull(),
                isNull(),
                any(Pageable.class));
    }

    @Test
    @DisplayName("GET /certificates/requests/my: status/typeCode 필터를 context 기반 조회로 전달")
    void getMyRequests_withFilters_shouldPassStatusAndTypeToService() throws Exception {
        Page<CertificateRequestResponse> emptyPage = new PageImpl<>(List.of());
        when(certificateRequestService.getMyRequests(eq(employeeId), eq(RequestStatus.APPROVED), eq("EMPLOYMENT"), any(Pageable.class)))
                .thenReturn(emptyPage);

        mockMvc.perform(get("/api/v1/certificates/requests/my")
                        .param("status", "APPROVED")
                        .param("typeCode", "EMPLOYMENT")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(certificateRequestService).getMyRequests(
                eq(employeeId),
                eq(RequestStatus.APPROVED),
                eq("EMPLOYMENT"),
                any(Pageable.class));
    }
}
