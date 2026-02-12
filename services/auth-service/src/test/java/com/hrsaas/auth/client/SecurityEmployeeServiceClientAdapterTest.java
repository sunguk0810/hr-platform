package com.hrsaas.auth.client;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.security.dto.EmployeeAffiliationDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

class SecurityEmployeeServiceClientAdapterTest {

    @Test
    @DisplayName("getAffiliation should map employee response to affiliation dto")
    void getAffiliation_mapsResponse() {
        EmployeeServiceClient feignClient = mock(EmployeeServiceClient.class);
        SecurityEmployeeServiceClientAdapter adapter = new SecurityEmployeeServiceClientAdapter(feignClient);

        UUID employeeId = UUID.randomUUID();
        UUID departmentId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();

        given(feignClient.getEmployee(employeeId))
                .willReturn(ApiResponse.success(new EmployeeServiceClient.EmployeeInfo(
                        employeeId,
                        "E001",
                        "홍길동",
                        "hong@example.com",
                        departmentId,
                        "개발본부",
                        teamId,
                        "플랫폼팀",
                        "LEAD",
                        "팀장",
                        null
                )));

        EmployeeAffiliationDto affiliation = adapter.getAffiliation(employeeId);

        assertThat(affiliation).isNotNull();
        assertThat(affiliation.departmentId()).isEqualTo(departmentId);
        assertThat(affiliation.teamId()).isEqualTo(teamId);
    }
}
