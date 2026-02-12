package com.hrsaas.organization.client;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.organization.client.dto.BulkTransferRequest;
import com.hrsaas.organization.client.dto.EmployeeClientResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
public class EmployeeClientFallback implements EmployeeClient {

    @Override
    public ApiResponse<Long> countByDepartmentId(UUID departmentId) {
        log.warn("EmployeeClient fallback: countByDepartmentId({})", departmentId);
        return ApiResponse.success(-1L);
    }

    @Override
    public ApiResponse<Boolean> existsById(UUID id) {
        log.warn("EmployeeClient fallback: existsById({})", id);
        return ApiResponse.success(true);
    }

    @Override
    public ApiResponse<Integer> bulkTransferDepartment(BulkTransferRequest request) {
        log.error("EmployeeClient fallback: bulkTransferDepartment - operation blocked");
        throw new RuntimeException("Employee service unavailable: bulk transfer blocked");
    }

    @Override
    public ApiResponse<Long> countByGradeId(UUID gradeId) {
        log.warn("EmployeeClient fallback: countByGradeId({})", gradeId);
        return ApiResponse.success(-1L);
    }

    @Override
    public ApiResponse<Long> countByPositionId(UUID positionId) {
        log.warn("EmployeeClient fallback: countByPositionId({})", positionId);
        return ApiResponse.success(-1L);
    }

    @Override
    public ApiResponse<Map<UUID, Long>> countByDepartmentIds(List<UUID> departmentIds) {
        log.warn("EmployeeClient fallback: countByDepartmentIds({})", departmentIds.size());
        return ApiResponse.success(Collections.emptyMap());
    }

    @Override
    public ApiResponse<List<EmployeeClientResponse>> getBatch(List<UUID> ids) {
        log.warn("EmployeeClient fallback: getBatch({})", ids.size());
        return ApiResponse.success(Collections.emptyList());
    }

    @Override
    public ApiResponse<List<EmployeeClientResponse>> getEmployeesByDepartment(UUID departmentId) {
        log.warn("EmployeeClient fallback: getEmployeesByDepartment({})", departmentId);
        return ApiResponse.success(Collections.emptyList());
    }
}
