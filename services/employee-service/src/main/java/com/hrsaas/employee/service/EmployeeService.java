package com.hrsaas.employee.service;

import com.hrsaas.common.response.PageResponse;
import com.hrsaas.employee.domain.dto.request.CreateEmployeeRequest;
import com.hrsaas.employee.domain.dto.request.EmployeeSearchCondition;
import com.hrsaas.employee.domain.dto.request.UpdateEmployeeRequest;
import com.hrsaas.employee.domain.dto.response.BulkImportResultResponse;
import com.hrsaas.employee.domain.dto.response.EmployeeResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface EmployeeService {

    EmployeeResponse create(CreateEmployeeRequest request);

    EmployeeResponse getById(UUID id);

    EmployeeResponse getByEmployeeNumber(String employeeNumber);

    PageResponse<EmployeeResponse> search(EmployeeSearchCondition condition, Pageable pageable);

    PageResponse<EmployeeResponse> searchByKeyword(String keyword, Pageable pageable);

    EmployeeResponse update(UUID id, UpdateEmployeeRequest request);

    EmployeeResponse resign(UUID id, String resignDate);

    EmployeeResponse cancelResign(UUID id, String reason);

    void delete(UUID id);

    int bulkDelete(List<UUID> ids);

    byte[] exportToExcel(EmployeeSearchCondition condition);

    BulkImportResultResponse importFromExcel(MultipartFile file);

    byte[] getImportTemplate();

    String unmask(UUID id, String field, String reason);

    long countByDepartment(UUID departmentId);

    long countByPosition(String positionCode);

    long countByGrade(String jobTitleCode);

    boolean existsById(UUID id);

    List<EmployeeResponse> getBatch(List<UUID> ids);

    List<EmployeeResponse> getList(EmployeeSearchCondition condition);

    void suspend(UUID id);

    void activate(UUID id);

    void bulkUpdate(List<UpdateEmployeeRequest> requests);

    void bulkResign(List<UUID> ids, String resignDate);

    void bulkSuspend(List<UUID> ids);

    void bulkActivate(List<UUID> ids);
}
