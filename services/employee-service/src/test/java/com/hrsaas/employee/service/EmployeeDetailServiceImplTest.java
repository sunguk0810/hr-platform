package com.hrsaas.employee.service;

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
import com.hrsaas.employee.service.impl.EmployeeDetailServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeDetailServiceImplTest {

    @Mock
    private EmployeeCareerRepository careerRepository;
    @Mock
    private EmployeeEducationRepository educationRepository;
    @Mock
    private EmployeeCertificateRepository certificateRepository;
    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private EmployeeDetailServiceImpl employeeDetailService;

    private UUID employeeId;

    @BeforeEach
    void setUp() {
        employeeId = UUID.randomUUID();
    }

    private void mockEmployeeExists() {
        when(employeeRepository.existsById(employeeId)).thenReturn(true);
    }

    @Nested
    @DisplayName("Career Tests")
    class CareerTests {
        @Test
        @DisplayName("Create career - Success")
        void createCareer_Success() {
            mockEmployeeExists();
            CreateEmployeeCareerRequest request = CreateEmployeeCareerRequest.builder()
                .companyName("Test Company")
                .department("IT")
                .position("Developer")
                .startDate(LocalDate.of(2020, 1, 1))
                .endDate(LocalDate.of(2022, 1, 1))
                .jobDescription("Doing stuff")
                .resignationReason("Better offer")
                .build();

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
            ReflectionTestUtils.setField(career, "id", UUID.randomUUID());

            when(careerRepository.save(any(EmployeeCareer.class))).thenReturn(career);

            EmployeeCareerResponse response = employeeDetailService.createCareer(employeeId, request);

            assertThat(response).isNotNull();
            assertThat(response.getCompanyName()).isEqualTo(request.getCompanyName());
            assertThat(response.getEmployeeId()).isEqualTo(employeeId);
            verify(careerRepository).save(any(EmployeeCareer.class));
        }

        @Test
        @DisplayName("Get careers - Success")
        void getCareers_Success() {
            mockEmployeeExists();
            EmployeeCareer career = EmployeeCareer.builder()
                .employeeId(employeeId)
                .companyName("Test Company")
                .startDate(LocalDate.now())
                .build();
            ReflectionTestUtils.setField(career, "id", UUID.randomUUID());

            when(careerRepository.findByEmployeeId(employeeId)).thenReturn(List.of(career));

            List<EmployeeCareerResponse> responses = employeeDetailService.getCareers(employeeId);

            assertThat(responses).hasSize(1);
            assertThat(responses.get(0).getCompanyName()).isEqualTo("Test Company");
            verify(careerRepository).findByEmployeeId(employeeId);
        }

        @Test
        @DisplayName("Delete career - Success")
        void deleteCareer_Success() {
            UUID careerId = UUID.randomUUID();
            EmployeeCareer career = EmployeeCareer.builder()
                .employeeId(employeeId)
                .companyName("Test Company")
                .startDate(LocalDate.now())
                .build();
            ReflectionTestUtils.setField(career, "id", careerId);

            when(careerRepository.findById(careerId)).thenReturn(Optional.of(career));

            employeeDetailService.deleteCareer(employeeId, careerId);

            verify(careerRepository).delete(career);
        }

        @Test
        @DisplayName("Delete career - Not Found")
        void deleteCareer_NotFound() {
            UUID careerId = UUID.randomUUID();
            when(careerRepository.findById(careerId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> employeeDetailService.deleteCareer(employeeId, careerId))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("EMP_003");
        }

        @Test
        @DisplayName("Delete career - Not Owner")
        void deleteCareer_NotOwner() {
            UUID careerId = UUID.randomUUID();
            UUID otherEmployeeId = UUID.randomUUID();
            EmployeeCareer career = EmployeeCareer.builder()
                .employeeId(otherEmployeeId)
                .companyName("Test Company")
                .startDate(LocalDate.now())
                .build();
            ReflectionTestUtils.setField(career, "id", careerId);

            when(careerRepository.findById(careerId)).thenReturn(Optional.of(career));

            assertThatThrownBy(() -> employeeDetailService.deleteCareer(employeeId, careerId))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("EMP_003");
        }
    }

    @Nested
    @DisplayName("Education Tests")
    class EducationTests {
        @Test
        @DisplayName("Create education - Success")
        void createEducation_Success() {
            mockEmployeeExists();
            CreateEmployeeEducationRequest request = CreateEmployeeEducationRequest.builder()
                .schoolType("UNIVERSITY")
                .schoolName("Test Univ")
                .major("CS")
                .degree("Bachelor")
                .startDate(LocalDate.of(2010, 3, 1))
                .endDate(LocalDate.of(2014, 2, 28))
                .graduationStatus("GRADUATED")
                .build();

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
            ReflectionTestUtils.setField(education, "id", UUID.randomUUID());

            when(educationRepository.save(any(EmployeeEducation.class))).thenReturn(education);

            EmployeeEducationResponse response = employeeDetailService.createEducation(employeeId, request);

            assertThat(response).isNotNull();
            assertThat(response.getSchoolName()).isEqualTo(request.getSchoolName());
            verify(educationRepository).save(any(EmployeeEducation.class));
        }

        @Test
        @DisplayName("Get educations - Success")
        void getEducations_Success() {
            mockEmployeeExists();
            EmployeeEducation education = EmployeeEducation.builder()
                .employeeId(employeeId)
                .schoolName("Test Univ")
                .schoolType("UNIVERSITY")
                .build();
            ReflectionTestUtils.setField(education, "id", UUID.randomUUID());

            when(educationRepository.findByEmployeeId(employeeId)).thenReturn(List.of(education));

            List<EmployeeEducationResponse> responses = employeeDetailService.getEducations(employeeId);

            assertThat(responses).hasSize(1);
            assertThat(responses.get(0).getSchoolName()).isEqualTo("Test Univ");
        }

        @Test
        @DisplayName("Delete education - Success")
        void deleteEducation_Success() {
            UUID educationId = UUID.randomUUID();
            EmployeeEducation education = EmployeeEducation.builder()
                .employeeId(employeeId)
                .schoolName("Test Univ")
                .schoolType("UNIVERSITY")
                .build();
            ReflectionTestUtils.setField(education, "id", educationId);

            when(educationRepository.findById(educationId)).thenReturn(Optional.of(education));

            employeeDetailService.deleteEducation(employeeId, educationId);

            verify(educationRepository).delete(education);
        }

        @Test
        @DisplayName("Delete education - Not Found")
        void deleteEducation_NotFound() {
            UUID educationId = UUID.randomUUID();
            when(educationRepository.findById(educationId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> employeeDetailService.deleteEducation(employeeId, educationId))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("EMP_004");
        }
    }

    @Nested
    @DisplayName("Certificate Tests")
    class CertificateTests {
        @Test
        @DisplayName("Create certificate - Success")
        void createCertificate_Success() {
            mockEmployeeExists();
            CreateEmployeeCertificateRequest request = CreateEmployeeCertificateRequest.builder()
                .certificateName("AWS Solution Architect")
                .issuingOrganization("AWS")
                .certificateNumber("12345")
                .issueDate(LocalDate.now())
                .expiryDate(LocalDate.now().plusYears(3))
                .grade("Professional")
                .build();

            EmployeeCertificate certificate = EmployeeCertificate.builder()
                .employeeId(employeeId)
                .certificateName(request.getCertificateName())
                .issuingOrganization(request.getIssuingOrganization())
                .certificateNumber(request.getCertificateNumber())
                .issueDate(request.getIssueDate())
                .expiryDate(request.getExpiryDate())
                .grade(request.getGrade())
                .build();
            ReflectionTestUtils.setField(certificate, "id", UUID.randomUUID());

            when(certificateRepository.save(any(EmployeeCertificate.class))).thenReturn(certificate);

            EmployeeCertificateResponse response = employeeDetailService.createCertificate(employeeId, request);

            assertThat(response).isNotNull();
            assertThat(response.getCertificateName()).isEqualTo(request.getCertificateName());
            verify(certificateRepository).save(any(EmployeeCertificate.class));
        }

        @Test
        @DisplayName("Get certificates - Success")
        void getCertificates_Success() {
            mockEmployeeExists();
            EmployeeCertificate certificate = EmployeeCertificate.builder()
                .employeeId(employeeId)
                .certificateName("AWS SA")
                .issuingOrganization("AWS")
                .issueDate(LocalDate.now())
                .build();
            ReflectionTestUtils.setField(certificate, "id", UUID.randomUUID());

            when(certificateRepository.findByEmployeeId(employeeId)).thenReturn(List.of(certificate));

            List<EmployeeCertificateResponse> responses = employeeDetailService.getCertificates(employeeId);

            assertThat(responses).hasSize(1);
            assertThat(responses.get(0).getCertificateName()).isEqualTo("AWS SA");
        }

        @Test
        @DisplayName("Get valid certificates - Success")
        void getValidCertificates_Success() {
            mockEmployeeExists();
            EmployeeCertificate certificate = EmployeeCertificate.builder()
                .employeeId(employeeId)
                .certificateName("AWS SA")
                .issuingOrganization("AWS")
                .issueDate(LocalDate.now())
                .build();
            ReflectionTestUtils.setField(certificate, "id", UUID.randomUUID());

            when(certificateRepository.findValidCertificatesByEmployeeId(eq(employeeId), any(LocalDate.class)))
                .thenReturn(List.of(certificate));

            List<EmployeeCertificateResponse> responses = employeeDetailService.getValidCertificates(employeeId);

            assertThat(responses).hasSize(1);
            verify(certificateRepository).findValidCertificatesByEmployeeId(eq(employeeId), any(LocalDate.class));
        }

        @Test
        @DisplayName("Delete certificate - Success")
        void deleteCertificate_Success() {
            UUID certificateId = UUID.randomUUID();
            EmployeeCertificate certificate = EmployeeCertificate.builder()
                .employeeId(employeeId)
                .certificateName("AWS SA")
                .issuingOrganization("AWS")
                .issueDate(LocalDate.now())
                .build();
            ReflectionTestUtils.setField(certificate, "id", certificateId);

            when(certificateRepository.findById(certificateId)).thenReturn(Optional.of(certificate));

            employeeDetailService.deleteCertificate(employeeId, certificateId);

            verify(certificateRepository).delete(certificate);
        }

        @Test
        @DisplayName("Delete certificate - Not Found")
        void deleteCertificate_NotFound() {
            UUID certificateId = UUID.randomUUID();
            when(certificateRepository.findById(certificateId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> employeeDetailService.deleteCertificate(employeeId, certificateId))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("EMP_005");
        }
    }

    @Test
    @DisplayName("Employee validation - Not Found")
    void validateEmployeeExists_NotFound() {
        when(employeeRepository.existsById(employeeId)).thenReturn(false);

        assertThatThrownBy(() -> employeeDetailService.getCareers(employeeId))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("EMP_001")
            .hasMessageContaining("직원을 찾을 수 없습니다");
    }
}
