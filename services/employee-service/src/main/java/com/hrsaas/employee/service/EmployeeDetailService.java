package com.hrsaas.employee.service;

import com.hrsaas.employee.domain.dto.request.CreateEmployeeCareerRequest;
import com.hrsaas.employee.domain.dto.request.CreateEmployeeCertificateRequest;
import com.hrsaas.employee.domain.dto.request.CreateEmployeeEducationRequest;
import com.hrsaas.employee.domain.dto.response.EmployeeCareerResponse;
import com.hrsaas.employee.domain.dto.response.EmployeeCertificateResponse;
import com.hrsaas.employee.domain.dto.response.EmployeeEducationResponse;

import java.util.List;
import java.util.UUID;

public interface EmployeeDetailService {

    // Career
    EmployeeCareerResponse createCareer(UUID employeeId, CreateEmployeeCareerRequest request);
    List<EmployeeCareerResponse> getCareers(UUID employeeId);
    void deleteCareer(UUID employeeId, UUID careerId);

    // Education
    EmployeeEducationResponse createEducation(UUID employeeId, CreateEmployeeEducationRequest request);
    List<EmployeeEducationResponse> getEducations(UUID employeeId);
    void deleteEducation(UUID employeeId, UUID educationId);

    // Certificate
    EmployeeCertificateResponse createCertificate(UUID employeeId, CreateEmployeeCertificateRequest request);
    List<EmployeeCertificateResponse> getCertificates(UUID employeeId);
    List<EmployeeCertificateResponse> getValidCertificates(UUID employeeId);
    void deleteCertificate(UUID employeeId, UUID certificateId);
}
