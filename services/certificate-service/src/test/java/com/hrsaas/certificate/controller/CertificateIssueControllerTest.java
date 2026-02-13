package com.hrsaas.certificate.controller;

import com.hrsaas.certificate.domain.dto.response.CertificateIssueResponse;
import com.hrsaas.certificate.service.CertificateIssueService;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.security.UserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CertificateIssueController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("CertificateIssueController 계약 테스트")
class CertificateIssueControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CertificateIssueService certificateIssueService;

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
    @DisplayName("GET /certificates/issues/my: typeCode 필터 반영 및 includeExpired 기본 false 적용")
    void getMyIssues_withTypeCode_shouldCallFilterMethod() throws Exception {
        Page<CertificateIssueResponse> emptyPage = new PageImpl<>(List.of());
        when(certificateIssueService.getByEmployeeId(eq(employeeId), eq("EMPLOYMENT"), eq(false), any(Pageable.class)))
                .thenReturn(emptyPage);

        mockMvc.perform(get("/api/v1/certificates/issues/my")
                        .param("typeCode", "EMPLOYMENT")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk());

        verify(certificateIssueService).getByEmployeeId(
                eq(employeeId),
                eq("EMPLOYMENT"),
                eq(false),
                any(Pageable.class));
    }

    @Test
    @DisplayName("GET /certificates/issues/{id}/download: id 기반 경로로 파일 다운로드")
    void downloadPdf_shouldCallIdBasedServiceAndSetHeaders() throws Exception {
        UUID issueId = UUID.randomUUID();
        String issueNumber = "ISS-20260213-000001";
        CertificateIssueResponse issue = CertificateIssueResponse.builder()
                .id(issueId)
                .issueNumber(issueNumber)
                .build();

        byte[] pdfContent = "pdf-data".getBytes(StandardCharsets.UTF_8);

        when(certificateIssueService.getById(issueId)).thenReturn(issue);
        when(certificateIssueService.downloadPdf(issueId)).thenReturn(pdfContent);
        when(certificateIssueService.markDownloaded(issueId)).thenReturn(issue);

        MockHttpServletResponse downloadRes = mockMvc.perform(get("/api/v1/certificates/issues/{id}/download", issueId)
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andExpect(header().exists("Content-Disposition"))
                .andReturn().getResponse();

        assertThat(downloadRes.getHeader("Content-Disposition")).contains(issueNumber + ".pdf");

        verify(certificateIssueService).markDownloaded(issueId);
        verify(certificateIssueService).downloadPdf(issueId);
        verify(certificateIssueService).getById(issueId);
    }
}
