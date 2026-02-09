package com.hrsaas.mdm.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.mdm.domain.dto.request.CreateCodeGroupRequest;
import com.hrsaas.mdm.domain.dto.request.UpdateCodeGroupRequest;
import com.hrsaas.mdm.domain.dto.response.CodeGroupResponse;
import com.hrsaas.mdm.domain.entity.CodeStatus;
import com.hrsaas.mdm.service.CodeGroupService;
import org.junit.jupiter.api.DisplayName;
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

@WebMvcTest(CodeGroupController.class)
@AutoConfigureMockMvc(addFilters = false)
class CodeGroupControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CodeGroupService codeGroupService;

    @MockBean
    private com.hrsaas.common.security.SecurityFilter securityFilter;

    @MockBean
    private com.hrsaas.common.security.jwt.JwtTokenProvider jwtTokenProvider;

    @MockBean(name = "permissionChecker")
    private com.hrsaas.common.security.PermissionChecker permissionChecker;

    private static final UUID GROUP_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private CodeGroupResponse createMockResponse() {
        return CodeGroupResponse.builder()
                .id(GROUP_ID)
                .groupCode("LEAVE_TYPE")
                .groupName("휴가 유형")
                .groupNameEn("Leave Type")
                .description("휴가 유형 코드 그룹")
                .system(false)
                .hierarchical(false)
                .status(CodeStatus.ACTIVE)
                .active(true)
                .sortOrder(1)
                .build();
    }

    // ================================================================
    // create
    // ================================================================

    @Test
    @DisplayName("create - with SUPER_ADMIN role returns 201")
    @WithMockUser(roles = "SUPER_ADMIN")
    void create_withValidRequest_returns201() throws Exception {
        CreateCodeGroupRequest request = CreateCodeGroupRequest.builder()
                .groupCode("LEAVE_TYPE")
                .groupName("휴가 유형")
                .groupNameEn("Leave Type")
                .description("휴가 유형 코드 그룹")
                .sortOrder(1)
                .build();

        when(codeGroupService.create(any(CreateCodeGroupRequest.class)))
                .thenReturn(createMockResponse());

        mockMvc.perform(post("/api/v1/mdm/code-groups")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.groupCode").value("LEAVE_TYPE"))
                .andExpect(jsonPath("$.data.groupName").value("휴가 유형"));
    }

    // ================================================================
    // getByGroupCode
    // ================================================================

    @Test
    @DisplayName("getByGroupCode - existing group returns 200")
    @WithMockUser(roles = "SUPER_ADMIN")
    void getByGroupCode_existing_returns200() throws Exception {
        when(codeGroupService.getByGroupCode("LEAVE_TYPE"))
                .thenReturn(createMockResponse());

        mockMvc.perform(get("/api/v1/mdm/code-groups/{groupCode}", "LEAVE_TYPE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.groupCode").value("LEAVE_TYPE"))
                .andExpect(jsonPath("$.data.groupName").value("휴가 유형"));
    }

    // ================================================================
    // getAll
    // ================================================================

    @Test
    @DisplayName("getAll - returns list of code groups with 200")
    @WithMockUser(roles = "SUPER_ADMIN")
    void getAll_returns200() throws Exception {
        CodeGroupResponse response1 = createMockResponse();
        CodeGroupResponse response2 = CodeGroupResponse.builder()
                .id(UUID.randomUUID())
                .groupCode("GRADE")
                .groupName("직급")
                .status(CodeStatus.ACTIVE)
                .active(true)
                .build();

        when(codeGroupService.getAll()).thenReturn(List.of(response1, response2));

        mockMvc.perform(get("/api/v1/mdm/code-groups"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].groupCode").value("LEAVE_TYPE"))
                .andExpect(jsonPath("$.data[1].groupCode").value("GRADE"));
    }

    // ================================================================
    // update
    // ================================================================

    @Test
    @DisplayName("update - with HR_ADMIN role returns 200")
    @WithMockUser(roles = "HR_ADMIN")
    void update_withValidRequest_returns200() throws Exception {
        UpdateCodeGroupRequest request = UpdateCodeGroupRequest.builder()
                .groupName("휴가 유형 (수정)")
                .description("수정된 휴가 유형 코드 그룹")
                .build();

        CodeGroupResponse updatedResponse = CodeGroupResponse.builder()
                .id(GROUP_ID)
                .groupCode("LEAVE_TYPE")
                .groupName("휴가 유형 (수정)")
                .description("수정된 휴가 유형 코드 그룹")
                .status(CodeStatus.ACTIVE)
                .active(true)
                .build();

        when(codeGroupService.update(eq(GROUP_ID), any(UpdateCodeGroupRequest.class)))
                .thenReturn(updatedResponse);

        mockMvc.perform(put("/api/v1/mdm/code-groups/{id}", GROUP_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.groupName").value("휴가 유형 (수정)"))
                .andExpect(jsonPath("$.data.description").value("수정된 휴가 유형 코드 그룹"));
    }

    // ================================================================
    // delete
    // ================================================================

    @Test
    @DisplayName("delete - with TENANT_ADMIN role returns 200")
    @WithMockUser(roles = "TENANT_ADMIN")
    void delete_existingGroup_returns200() throws Exception {
        doNothing().when(codeGroupService).delete(GROUP_ID);

        mockMvc.perform(delete("/api/v1/mdm/code-groups/{id}", GROUP_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("코드 그룹이 삭제되었습니다."));
    }

    // ================================================================
    // validation
    // ================================================================

    @Test
    @DisplayName("create - with missing required fields returns 400")
    @WithMockUser(roles = "SUPER_ADMIN")
    void create_withMissingFields_returns400() throws Exception {
        // Empty request - groupCode and groupName are @NotBlank
        CreateCodeGroupRequest request = CreateCodeGroupRequest.builder().build();

        mockMvc.perform(post("/api/v1/mdm/code-groups")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
