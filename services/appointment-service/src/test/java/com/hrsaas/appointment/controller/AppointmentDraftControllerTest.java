package com.hrsaas.appointment.controller;

import com.hrsaas.appointment.domain.dto.response.AppointmentDraftResponse;
import com.hrsaas.appointment.domain.entity.DraftStatus;
import com.hrsaas.appointment.service.AppointmentDraftService;
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

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AppointmentDraftController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("AppointmentDraftController 계약 테스트")
class AppointmentDraftControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AppointmentDraftService appointmentDraftService;

    @Test
    @DisplayName("GET /appointments/drafts: startDate/endDate 파라미터를 그대로 서비스로 전달")
    void search_shouldDelegateDateParamsToService() throws Exception {
        Page<AppointmentDraftResponse> emptyPage = new PageImpl<>(List.of());
        when(appointmentDraftService.search(any(), any(), any(), any(Pageable.class))).thenReturn(emptyPage);

        mockMvc.perform(get("/api/v1/appointments/drafts")
                        .param("status", "APPROVED")
                        .param("startDate", "2026-02-01")
                        .param("endDate", "2026-02-29")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(appointmentDraftService).search(
                eq(DraftStatus.APPROVED),
                eq(LocalDate.parse("2026-02-01")),
                eq(LocalDate.parse("2026-02-29")),
                any(Pageable.class));
    }
}
