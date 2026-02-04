package com.hrsaas.employee.service.impl;

import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.employee.domain.dto.request.CreateEmployeeCareerRequest;
import com.hrsaas.employee.domain.dto.request.CreateEmployeeCertificateRequest;
import com.hrsaas.employee.domain.dto.request.CreateEmployeeEducationRequest;
import com.hrsaas.employee.domain.dto.response.EmployeeCareerResponse;
import com.hrsaas.employee.domain.dto.response.EmployeeCertificateResponse;
import com.hrsaas.employee.domain.dto.response.EmployeeEducationResponse;
import com.hrsaas.employee.domain.entity.EmployeeCareer;
import com.hrsaas.employee.domain.entity.EmployeeCertificate;
import com.hrsaas.employee.domain.entity.EmployeeEducation;
import com.hrsaas.employee.repository.EmployeeCareerRepository;
import com.hrsaas.employee.repository.EmployeeCertificateRepository;
import com.hrsaas.employee.repository.EmployeeEducationRepository;
import com.hrsaas.employee.repository.EmployeeRepository;
import com.hrsaas.employee.service.EmployeeDetailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeDetailServiceImpl implements EmployeeDetailService {

    private final EmployeeCareerRepository careerRepository;
    private final EmployeeEducationRepository educationRepository;
    private final EmployeeCertificateRepository certificateRepository;
    private final EmployeeRepository employeeRepository;

    // Career
    @Override
    @Transactional
    public EmployeeCareerResponse createCareer(UUID employeeId, CreateEmployeeCareerRequest request) {
        validateEmployeeExists(employeeId);

        EmployeeCareer career = EmployeeCareer.builder()
            .employeeId(employeeId)
            .companyName(request.getCompanyName())
            .department(request.getDepartment())
            .position(request.getPosition())
            .startDate(request.getStartDate())
            .endDate(request.getEndDate())
            .jobDescription(request.getJobDescription())
            .resignationReason(request.getResignationReason())
            .build();

        EmployeeCareer saved = careerRepository.save(career);
        log.info("Employee career created: employeeId={}, companyName={}", employeeId, request.getCompanyName());

        return EmployeeCareerResponse.from(saved);
    }

    @Override
    public List<EmployeeCareerResponse> getCareers(UUID employeeId) {
        validateEmployeeExists(employeeId);
        List<EmployeeCareer> careers = careerRepository.findByEmployeeId(employeeId);

        return careers.stream()
            .map(EmployeeCareerResponse::from)
            .toList();
    }

    @Override
    @Transactional
    public void deleteCareer(UUID employeeId, UUID careerId) {
        EmployeeCareer career = careerRepository.findById(careerId)
            .filter(c -> c.getEmployeeId().equals(employeeId))
            .orElseThrow(() -> new NotFoundException("EMP_003", "경력 정보를 찾을 수 없습니다: " + careerId));
        careerRepository.delete(career);
        log.info("Employee career deleted: careerId={}", careerId);
    }

    // Education
    @Override
    @Transactional
    public EmployeeEducationResponse createEducation(UUID employeeId, CreateEmployeeEducationRequest request) {
        validateEmployeeExists(employeeId);

        EmployeeEducation education = EmployeeEducation.builder()
            .employeeId(employeeId)
            .schoolType(request.getSchoolType())
            .schoolName(request.getSchoolName())
            .major(request.getMajor())
            .degree(request.getDegree())
            .startDate(request.getStartDate())
            .endDate(request.getEndDate())
            .graduationStatus(request.getGraduationStatus())
            .build();

        EmployeeEducation saved = educationRepository.save(education);
        log.info("Employee education created: employeeId={}, schoolName={}", employeeId, request.getSchoolName());

        return EmployeeEducationResponse.from(saved);
    }

    @Override
    public List<EmployeeEducationResponse> getEducations(UUID employeeId) {
        validateEmployeeExists(employeeId);
        List<EmployeeEducation> educations = educationRepository.findByEmployeeId(employeeId);

        return educations.stream()
            .map(EmployeeEducationResponse::from)
            .toList();
    }

    @Override
    @Transactional
    public void deleteEducation(UUID employeeId, UUID educationId) {
        EmployeeEducation education = educationRepository.findById(educationId)
            .filter(e -> e.getEmployeeId().equals(employeeId))
            .orElseThrow(() -> new NotFoundException("EMP_004", "학력 정보를 찾을 수 없습니다: " + educationId));
        educationRepository.delete(education);
        log.info("Employee education deleted: educationId={}", educationId);
    }

    // Certificate
    @Override
    @Transactional
    public EmployeeCertificateResponse createCertificate(UUID employeeId, CreateEmployeeCertificateRequest request) {
        validateEmployeeExists(employeeId);

        EmployeeCertificate certificate = EmployeeCertificate.builder()
            .employeeId(employeeId)
            .certificateName(request.getCertificateName())
            .issuingOrganization(request.getIssuingOrganization())
            .certificateNumber(request.getCertificateNumber())
            .issueDate(request.getIssueDate())
            .expiryDate(request.getExpiryDate())
            .grade(request.getGrade())
            .build();

        EmployeeCertificate saved = certificateRepository.save(certificate);
        log.info("Employee certificate created: employeeId={}, certificateName={}", employeeId, request.getCertificateName());

        return EmployeeCertificateResponse.from(saved);
    }

    @Override
    public List<EmployeeCertificateResponse> getCertificates(UUID employeeId) {
        validateEmployeeExists(employeeId);
        List<EmployeeCertificate> certificates = certificateRepository.findByEmployeeId(employeeId);

        return certificates.stream()
            .map(EmployeeCertificateResponse::from)
            .toList();
    }

    @Override
    public List<EmployeeCertificateResponse> getValidCertificates(UUID employeeId) {
        validateEmployeeExists(employeeId);
        List<EmployeeCertificate> certificates = certificateRepository.findValidCertificatesByEmployeeId(
            employeeId, LocalDate.now());

        return certificates.stream()
            .map(EmployeeCertificateResponse::from)
            .toList();
    }

    @Override
    @Transactional
    public void deleteCertificate(UUID employeeId, UUID certificateId) {
        EmployeeCertificate certificate = certificateRepository.findById(certificateId)
            .filter(c -> c.getEmployeeId().equals(employeeId))
            .orElseThrow(() -> new NotFoundException("EMP_005", "자격증 정보를 찾을 수 없습니다: " + certificateId));
        certificateRepository.delete(certificate);
        log.info("Employee certificate deleted: certificateId={}", certificateId);
    }

    private void validateEmployeeExists(UUID employeeId) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new NotFoundException("EMP_001", "직원을 찾을 수 없습니다: " + employeeId);
        }
    }
}
