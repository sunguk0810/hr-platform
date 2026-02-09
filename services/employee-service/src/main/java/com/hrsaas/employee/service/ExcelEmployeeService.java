package com.hrsaas.employee.service;

import com.hrsaas.employee.domain.dto.request.CreateEmployeeRequest;
import com.hrsaas.employee.domain.entity.Employee;

import java.io.InputStream;
import java.util.List;

/**
 * Service for Excel import/export of employee data.
 */
public interface ExcelEmployeeService {

    byte[] exportToExcel(List<Employee> employees);

    List<CreateEmployeeRequest> importFromExcel(InputStream inputStream);

    byte[] generateTemplate();
}
