package com.hrsaas.auth.service;

import com.hrsaas.auth.client.EmployeeServiceClient;
import com.hrsaas.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

/**
 * AUTH-G02: 부서/팀 동일 여부 확인 서비스
 * Employee Service Feign 연동
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DepartmentCheckService {

    private final Optional<EmployeeServiceClient> employeeServiceClient;

    /**
     * 두 사원이 같은 부서인지 확인
     */
    public boolean isSameDepartment(UUID employeeId1, UUID employeeId2) {
        if (employeeId1 == null || employeeId2 == null) return false;
        if (employeeId1.equals(employeeId2)) return true;

        try {
            if (employeeServiceClient.isEmpty()) {
                log.warn("EmployeeServiceClient not available, returning false for department check");
                return false;
            }

            EmployeeServiceClient client = employeeServiceClient.get();
            ApiResponse<EmployeeServiceClient.EmployeeInfo> emp1 = client.getEmployee(employeeId1);
            ApiResponse<EmployeeServiceClient.EmployeeInfo> emp2 = client.getEmployee(employeeId2);

            if (emp1.getData() == null || emp2.getData() == null) return false;

            UUID dept1 = emp1.getData().departmentId();
            UUID dept2 = emp2.getData().departmentId();

            return dept1 != null && dept1.equals(dept2);
        } catch (Exception e) {
            log.warn("Failed to check department for employees: {} and {}", employeeId1, employeeId2, e);
            return false;
        }
    }

    /**
     * 두 사원이 같은 팀인지 확인
     */
    public boolean isSameTeam(UUID employeeId1, UUID employeeId2) {
        if (employeeId1 == null || employeeId2 == null) return false;
        if (employeeId1.equals(employeeId2)) return true;

        try {
            if (employeeServiceClient.isEmpty()) {
                log.warn("EmployeeServiceClient not available, returning false for team check");
                return false;
            }

            EmployeeServiceClient client = employeeServiceClient.get();
            ApiResponse<EmployeeServiceClient.EmployeeInfo> emp1 = client.getEmployee(employeeId1);
            ApiResponse<EmployeeServiceClient.EmployeeInfo> emp2 = client.getEmployee(employeeId2);

            if (emp1.getData() == null || emp2.getData() == null) return false;

            UUID team1 = emp1.getData().teamId();
            UUID team2 = emp2.getData().teamId();

            return team1 != null && team1.equals(team2);
        } catch (Exception e) {
            log.warn("Failed to check team for employees: {} and {}", employeeId1, employeeId2, e);
            return false;
        }
    }
}
