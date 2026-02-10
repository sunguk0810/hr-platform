package com.hrsaas.auth.service;

import com.hrsaas.auth.client.EmployeeServiceClient;
import com.hrsaas.common.response.ApiResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DepartmentCheckServiceTest {

    private final UUID deptId = UUID.randomUUID();
    private final UUID teamId = UUID.randomUUID();
    private final UUID emp1Id = UUID.randomUUID();
    private final UUID emp2Id = UUID.randomUUID();

    @Test
    @DisplayName("isSameDepartment - same employee ID - returns true")
    void isSameDepartment_sameEmployee_returnsTrue() {
        DepartmentCheckService service = new DepartmentCheckService(Optional.empty());
        assertThat(service.isSameDepartment(emp1Id, emp1Id)).isTrue();
    }

    @Test
    @DisplayName("isSameDepartment - null employee ID - returns false")
    void isSameDepartment_nullEmployee_returnsFalse() {
        DepartmentCheckService service = new DepartmentCheckService(Optional.empty());
        assertThat(service.isSameDepartment(null, emp2Id)).isFalse();
        assertThat(service.isSameDepartment(emp1Id, null)).isFalse();
    }

    @Test
    @DisplayName("isSameDepartment - client unavailable - returns false")
    void isSameDepartment_clientUnavailable_returnsFalse() {
        DepartmentCheckService service = new DepartmentCheckService(Optional.empty());
        assertThat(service.isSameDepartment(emp1Id, emp2Id)).isFalse();
    }

    @Test
    @DisplayName("isSameDepartment - same department - returns true")
    void isSameDepartment_sameDepartment_returnsTrue() {
        EmployeeServiceClient client = mock(EmployeeServiceClient.class);
        EmployeeServiceClient.EmployeeInfo info1 = new EmployeeServiceClient.EmployeeInfo(
                emp1Id, "EMP-001", "홍길동", "hong@test.com", deptId, "개발팀", teamId, "백엔드", "P3", "선임", null);
        EmployeeServiceClient.EmployeeInfo info2 = new EmployeeServiceClient.EmployeeInfo(
                emp2Id, "EMP-002", "김철수", "kim@test.com", deptId, "개발팀", teamId, "프론트", "P3", "선임", null);

        when(client.getEmployee(emp1Id)).thenReturn(ApiResponse.success(info1));
        when(client.getEmployee(emp2Id)).thenReturn(ApiResponse.success(info2));

        DepartmentCheckService service = new DepartmentCheckService(Optional.of(client));
        assertThat(service.isSameDepartment(emp1Id, emp2Id)).isTrue();
    }

    @Test
    @DisplayName("isSameDepartment - different department - returns false")
    void isSameDepartment_differentDepartment_returnsFalse() {
        EmployeeServiceClient client = mock(EmployeeServiceClient.class);
        UUID otherDeptId = UUID.randomUUID();
        EmployeeServiceClient.EmployeeInfo info1 = new EmployeeServiceClient.EmployeeInfo(
                emp1Id, "EMP-001", "홍길동", "hong@test.com", deptId, "개발팀", null, null, "P3", "선임", null);
        EmployeeServiceClient.EmployeeInfo info2 = new EmployeeServiceClient.EmployeeInfo(
                emp2Id, "EMP-002", "김철수", "kim@test.com", otherDeptId, "인사팀", null, null, "P3", "선임", null);

        when(client.getEmployee(emp1Id)).thenReturn(ApiResponse.success(info1));
        when(client.getEmployee(emp2Id)).thenReturn(ApiResponse.success(info2));

        DepartmentCheckService service = new DepartmentCheckService(Optional.of(client));
        assertThat(service.isSameDepartment(emp1Id, emp2Id)).isFalse();
    }

    @Test
    @DisplayName("isSameDepartment - feign call throws exception - returns false")
    void isSameDepartment_feignFails_returnsFalse() {
        EmployeeServiceClient client = mock(EmployeeServiceClient.class);
        when(client.getEmployee(emp1Id)).thenThrow(new RuntimeException("Connection refused"));

        DepartmentCheckService service = new DepartmentCheckService(Optional.of(client));
        assertThat(service.isSameDepartment(emp1Id, emp2Id)).isFalse();
    }

    @Test
    @DisplayName("isSameTeam - same team - returns true")
    void isSameTeam_sameTeam_returnsTrue() {
        EmployeeServiceClient client = mock(EmployeeServiceClient.class);
        EmployeeServiceClient.EmployeeInfo info1 = new EmployeeServiceClient.EmployeeInfo(
                emp1Id, "EMP-001", "홍길동", "hong@test.com", deptId, "개발팀", teamId, "백엔드", "P3", "선임", null);
        EmployeeServiceClient.EmployeeInfo info2 = new EmployeeServiceClient.EmployeeInfo(
                emp2Id, "EMP-002", "김철수", "kim@test.com", deptId, "개발팀", teamId, "백엔드", "P3", "선임", null);

        when(client.getEmployee(emp1Id)).thenReturn(ApiResponse.success(info1));
        when(client.getEmployee(emp2Id)).thenReturn(ApiResponse.success(info2));

        DepartmentCheckService service = new DepartmentCheckService(Optional.of(client));
        assertThat(service.isSameTeam(emp1Id, emp2Id)).isTrue();
    }

    @Test
    @DisplayName("isSameTeam - different team - returns false")
    void isSameTeam_differentTeam_returnsFalse() {
        EmployeeServiceClient client = mock(EmployeeServiceClient.class);
        UUID otherTeamId = UUID.randomUUID();
        EmployeeServiceClient.EmployeeInfo info1 = new EmployeeServiceClient.EmployeeInfo(
                emp1Id, "EMP-001", "홍길동", "hong@test.com", deptId, "개발팀", teamId, "백엔드", "P3", "선임", null);
        EmployeeServiceClient.EmployeeInfo info2 = new EmployeeServiceClient.EmployeeInfo(
                emp2Id, "EMP-002", "김철수", "kim@test.com", deptId, "개발팀", otherTeamId, "프론트", "P3", "선임", null);

        when(client.getEmployee(emp1Id)).thenReturn(ApiResponse.success(info1));
        when(client.getEmployee(emp2Id)).thenReturn(ApiResponse.success(info2));

        DepartmentCheckService service = new DepartmentCheckService(Optional.of(client));
        assertThat(service.isSameTeam(emp1Id, emp2Id)).isFalse();
    }

    @Test
    @DisplayName("isSameTeam - null employee - returns false")
    void isSameTeam_nullEmployee_returnsFalse() {
        DepartmentCheckService service = new DepartmentCheckService(Optional.empty());
        assertThat(service.isSameTeam(null, emp2Id)).isFalse();
    }

    @Test
    @DisplayName("isSameTeam - same employee ID - returns true")
    void isSameTeam_sameEmployee_returnsTrue() {
        DepartmentCheckService service = new DepartmentCheckService(Optional.empty());
        assertThat(service.isSameTeam(emp1Id, emp1Id)).isTrue();
    }
}
