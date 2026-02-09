package com.hrsaas.employee.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.security.PermissionChecker;
import com.hrsaas.common.security.SecurityFilter;
import com.hrsaas.common.security.jwt.JwtTokenProvider;
import com.hrsaas.employee.config.SecurityConfig;
import com.hrsaas.employee.domain.dto.request.CreateEmployeeRequest;
import com.hrsaas.employee.domain.dto.response.EmployeeResponse;
import com.hrsaas.employee.service.EmployeeService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    value = EmployeeController.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = {SecurityFilter.class, SecurityConfig.class}
    )
)
@Import(EmployeeControllerSecurityTest.TestSecurityConfig.class)
@DisplayName("EmployeeController Security Tests")
class EmployeeControllerSecurityTest {

    @TestConfiguration
    @EnableMethodSecurity(prePostEnabled = true)
    static class TestSecurityConfig {
        @Bean
        public SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
            return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/actuator/**").permitAll()
                    .anyRequest().authenticated()
                )
                .exceptionHandling(exceptions -> exceptions
                    .authenticationEntryPoint((request, response, authException) ->
                        response.sendError(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED))
                )
                .build();
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EmployeeService employeeService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private PermissionChecker permissionChecker;

    private static final UUID EMPLOYEE_ID = UUID.randomUUID();

    private EmployeeResponse createMockResponse() {
        return EmployeeResponse.builder()
            .id(EMPLOYEE_ID)
            .employeeNumber("EMP001")
            .name("홍길동")
            .email("test@example.com")
            .phone("010-1234-5678")
            .build();
    }

    @Nested
    @DisplayName("POST /api/v1/employees (직원 생성)")
    class CreateEmployee {

        @Test
        @DisplayName("HR_ADMIN 역할: 생성 성공 (201)")
        @WithMockUser(roles = "HR_ADMIN")
        void create_asHrAdmin_success() throws Exception {
            CreateEmployeeRequest request = CreateEmployeeRequest.builder()
                .employeeNumber("EMP001")
                .name("홍길동")
                .email("test@example.com")
                .hireDate(LocalDate.now())
                .build();

            when(employeeService.create(any())).thenReturn(createMockResponse());

            mockMvc.perform(post("/api/v1/employees")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
        }

        @Test
        @DisplayName("TENANT_ADMIN 역할: 생성 성공 (201)")
        @WithMockUser(roles = "TENANT_ADMIN")
        void create_asTenantAdmin_success() throws Exception {
            CreateEmployeeRequest request = CreateEmployeeRequest.builder()
                .employeeNumber("EMP001")
                .name("홍길동")
                .email("test@example.com")
                .hireDate(LocalDate.now())
                .build();

            when(employeeService.create(any())).thenReturn(createMockResponse());

            mockMvc.perform(post("/api/v1/employees")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
        }

        @Test
        @DisplayName("EMPLOYEE 역할: 접근 거부 (403)")
        @WithMockUser(roles = "EMPLOYEE")
        void create_asEmployee_forbidden() throws Exception {
            CreateEmployeeRequest request = CreateEmployeeRequest.builder()
                .employeeNumber("EMP001")
                .name("홍길동")
                .email("test@example.com")
                .hireDate(LocalDate.now())
                .build();

            mockMvc.perform(post("/api/v1/employees")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("인증되지 않은 사용자: 401")
        void create_unauthenticated_unauthorized() throws Exception {
            CreateEmployeeRequest request = CreateEmployeeRequest.builder()
                .employeeNumber("EMP001")
                .name("홍길동")
                .email("test@example.com")
                .hireDate(LocalDate.now())
                .build();

            mockMvc.perform(post("/api/v1/employees")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/employees (직원 목록 조회)")
    class SearchEmployees {

        @Test
        @DisplayName("EMPLOYEE 역할: 조회 성공 (200)")
        @WithMockUser(roles = "EMPLOYEE")
        void search_asEmployee_success() throws Exception {
            PageResponse<EmployeeResponse> pageResponse = PageResponse.from(
                new PageImpl<>(List.of(createMockResponse()))
            );
            when(employeeService.search(any(), any())).thenReturn(pageResponse);

            mockMvc.perform(get("/api/v1/employees"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("HR_ADMIN 역할: 조회 성공 (200)")
        @WithMockUser(roles = "HR_ADMIN")
        void search_asHrAdmin_success() throws Exception {
            PageResponse<EmployeeResponse> pageResponse = PageResponse.from(
                new PageImpl<>(List.of(createMockResponse()))
            );
            when(employeeService.search(any(), any())).thenReturn(pageResponse);

            mockMvc.perform(get("/api/v1/employees"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("인증되지 않은 사용자: 401")
        void search_unauthenticated_unauthorized() throws Exception {
            mockMvc.perform(get("/api/v1/employees"))
                .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/employees/{id} (직원 삭제)")
    class DeleteEmployee {

        @Test
        @DisplayName("SUPER_ADMIN 역할: 삭제 성공 (200)")
        @WithMockUser(roles = "SUPER_ADMIN")
        void delete_asSuperAdmin_success() throws Exception {
            mockMvc.perform(delete("/api/v1/employees/{id}", EMPLOYEE_ID))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("HR_ADMIN 역할: 접근 거부 (403)")
        @WithMockUser(roles = "HR_ADMIN")
        void delete_asHrAdmin_forbidden() throws Exception {
            mockMvc.perform(delete("/api/v1/employees/{id}", EMPLOYEE_ID))
                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("TENANT_ADMIN 역할: 접근 거부 (403)")
        @WithMockUser(roles = "TENANT_ADMIN")
        void delete_asTenantAdmin_forbidden() throws Exception {
            mockMvc.perform(delete("/api/v1/employees/{id}", EMPLOYEE_ID))
                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("EMPLOYEE 역할: 접근 거부 (403)")
        @WithMockUser(roles = "EMPLOYEE")
        void delete_asEmployee_forbidden() throws Exception {
            mockMvc.perform(delete("/api/v1/employees/{id}", EMPLOYEE_ID))
                .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/employees/employee-number/{employeeNumber} (사번으로 조회)")
    class GetByEmployeeNumber {

        @Test
        @DisplayName("HR_ADMIN 역할: 조회 성공 (200)")
        @WithMockUser(roles = "HR_ADMIN")
        void getByEmployeeNumber_asHrAdmin_success() throws Exception {
            when(employeeService.getByEmployeeNumber("EMP001")).thenReturn(createMockResponse());

            mockMvc.perform(get("/api/v1/employees/employee-number/{employeeNumber}", "EMP001"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("EMPLOYEE 역할: 접근 거부 (403)")
        @WithMockUser(roles = "EMPLOYEE")
        void getByEmployeeNumber_asEmployee_forbidden() throws Exception {
            mockMvc.perform(get("/api/v1/employees/employee-number/{employeeNumber}", "EMP001"))
                .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("POST /api/v1/employees/{id}/resign (퇴사 처리)")
    class ResignEmployee {

        @Test
        @DisplayName("HR_ADMIN 역할: 퇴사 처리 성공 (200)")
        @WithMockUser(roles = "HR_ADMIN")
        void resign_asHrAdmin_success() throws Exception {
            when(employeeService.resign(any(), any())).thenReturn(createMockResponse());

            mockMvc.perform(post("/api/v1/employees/{id}/resign", EMPLOYEE_ID)
                    .param("resignDate", "2024-12-31"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("EMPLOYEE 역할: 접근 거부 (403)")
        @WithMockUser(roles = "EMPLOYEE")
        void resign_asEmployee_forbidden() throws Exception {
            mockMvc.perform(post("/api/v1/employees/{id}/resign", EMPLOYEE_ID)
                    .param("resignDate", "2024-12-31"))
                .andExpect(status().isForbidden());
        }
    }
}
