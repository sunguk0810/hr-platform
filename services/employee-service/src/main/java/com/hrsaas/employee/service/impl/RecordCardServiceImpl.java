package com.hrsaas.employee.service.impl;

import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.employee.domain.dto.response.*;
import com.hrsaas.employee.domain.entity.*;
import com.hrsaas.employee.repository.*;
import com.hrsaas.employee.service.RecordCardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecordCardServiceImpl implements RecordCardService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeHistoryRepository employeeHistoryRepository;
    private final EmployeeFamilyRepository employeeFamilyRepository;
    private final EmployeeCareerRepository employeeCareerRepository;
    private final EmployeeEducationRepository employeeEducationRepository;
    private final EmployeeCertificateRepository employeeCertificateRepository;

    @Override
    public RecordCardResponse getRecordCard(UUID employeeId) {
        log.info("Generating record card for employee: {}", employeeId);

        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new NotFoundException("EMP_001", "직원을 찾을 수 없습니다: " + employeeId));

        RecordCardResponse response = RecordCardResponse.fromEmployee(employee);

        // 관리자 정보 조회
        if (employee.getManagerId() != null) {
            employeeRepository.findById(employee.getManagerId())
                .ifPresent(manager -> {
                    response.setManagerName(manager.getName());
                    response.setManagerEmployeeNumber(manager.getEmployeeNumber());
                });
        }

        // 인사이력 조회
        List<EmployeeHistory> histories = employeeHistoryRepository.findByEmployeeId(employeeId);
        response.setHistories(histories.stream()
            .map(EmployeeHistoryResponse::from)
            .toList());

        // 가족정보 조회
        List<EmployeeFamily> families = employeeFamilyRepository.findByEmployeeId(employeeId);
        response.setFamilies(families.stream()
            .map(EmployeeFamilyResponse::from)
            .toList());

        // 경력정보 조회
        List<EmployeeCareer> careers = employeeCareerRepository.findByEmployeeId(employeeId);
        response.setCareers(careers.stream()
            .map(EmployeeCareerResponse::from)
            .toList());

        // 학력정보 조회
        List<EmployeeEducation> educations = employeeEducationRepository.findByEmployeeId(employeeId);
        response.setEducations(educations.stream()
            .map(EmployeeEducationResponse::from)
            .toList());

        // 자격증정보 조회
        List<EmployeeCertificate> certificates = employeeCertificateRepository.findByEmployeeId(employeeId);
        response.setCertificates(certificates.stream()
            .map(EmployeeCertificateResponse::from)
            .toList());

        // 근속연수 계산
        response.calculateServiceYears();

        log.info("Record card generated for employee: {}, histories={}, families={}, careers={}, educations={}, certificates={}",
                 employeeId, histories.size(), families.size(), careers.size(), educations.size(), certificates.size());

        return response;
    }

    @Override
    public byte[] generateRecordCardPdf(UUID employeeId) {
        log.info("Generating PDF record card for employee: {}", employeeId);

        RecordCardResponse recordCard = getRecordCard(employeeId);

        // HTML 기반 PDF 생성을 위한 HTML 문자열 생성
        // 실제 환경에서는 iText, Flying Saucer, OpenPDF 등의 라이브러리 사용
        String html = generateHtmlContent(recordCard);

        // 임시로 HTML을 바이트 배열로 반환 (실제로는 PDF 변환 필요)
        // TODO: PDF 라이브러리 연동 시 실제 PDF 생성 구현
        log.info("PDF generation completed for employee: {}", employeeId);

        return html.getBytes(StandardCharsets.UTF_8);
    }

    private String generateHtmlContent(RecordCardResponse recordCard) {
        StringBuilder html = new StringBuilder();
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        html.append("<!DOCTYPE html>\n");
        html.append("<html lang=\"ko\">\n");
        html.append("<head>\n");
        html.append("  <meta charset=\"UTF-8\">\n");
        html.append("  <title>인사기록카드 - ").append(recordCard.getName()).append("</title>\n");
        html.append("  <style>\n");
        html.append("    body { font-family: 'Malgun Gothic', sans-serif; margin: 40px; }\n");
        html.append("    h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }\n");
        html.append("    h2 { background-color: #f5f5f5; padding: 8px; margin-top: 20px; }\n");
        html.append("    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }\n");
        html.append("    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }\n");
        html.append("    th { background-color: #f0f0f0; width: 150px; }\n");
        html.append("    .section { margin-bottom: 30px; }\n");
        html.append("  </style>\n");
        html.append("</head>\n");
        html.append("<body>\n");

        // 제목
        html.append("<h1>인사기록카드</h1>\n");

        // 기본정보 섹션
        html.append("<div class=\"section\">\n");
        html.append("  <h2>기본정보</h2>\n");
        html.append("  <table>\n");
        html.append("    <tr><th>사번</th><td>").append(nullSafe(recordCard.getEmployeeNumber())).append("</td>");
        html.append("    <th>성명</th><td>").append(nullSafe(recordCard.getName())).append("</td></tr>\n");
        html.append("    <tr><th>영문명</th><td>").append(nullSafe(recordCard.getNameEn())).append("</td>");
        html.append("    <th>이메일</th><td>").append(nullSafe(recordCard.getEmail())).append("</td></tr>\n");
        html.append("    <tr><th>전화번호</th><td>").append(nullSafe(recordCard.getPhone())).append("</td>");
        html.append("    <th>휴대전화</th><td>").append(nullSafe(recordCard.getMobile())).append("</td></tr>\n");
        html.append("    <tr><th>부서</th><td>").append(nullSafe(recordCard.getDepartmentName())).append("</td>");
        html.append("    <th>직책</th><td>").append(nullSafe(recordCard.getPositionName())).append("</td></tr>\n");
        html.append("    <tr><th>입사일</th><td>").append(formatDate(recordCard.getHireDate())).append("</td>");
        html.append("    <th>근속기간</th><td>").append(formatServiceYears(recordCard)).append("</td></tr>\n");
        html.append("    <tr><th>재직상태</th><td>").append(formatStatus(recordCard.getStatus())).append("</td>");
        html.append("    <th>고용형태</th><td>").append(formatEmploymentType(recordCard.getEmploymentType())).append("</td></tr>\n");
        html.append("  </table>\n");
        html.append("</div>\n");

        // 인사이력 섹션
        if (recordCard.getHistories() != null && !recordCard.getHistories().isEmpty()) {
            html.append("<div class=\"section\">\n");
            html.append("  <h2>인사이력</h2>\n");
            html.append("  <table>\n");
            html.append("    <tr><th>발령일</th><th>변경유형</th><th>내용</th><th>사유</th></tr>\n");
            for (EmployeeHistoryResponse history : recordCard.getHistories()) {
                html.append("    <tr>");
                html.append("<td>").append(formatDate(history.getEffectiveDate())).append("</td>");
                html.append("<td>").append(formatChangeType(history.getChangeType())).append("</td>");
                html.append("<td>").append(formatHistoryDescription(history)).append("</td>");
                html.append("<td>").append(nullSafe(history.getReason())).append("</td>");
                html.append("</tr>\n");
            }
            html.append("  </table>\n");
            html.append("</div>\n");
        }

        // 학력 섹션
        if (recordCard.getEducations() != null && !recordCard.getEducations().isEmpty()) {
            html.append("<div class=\"section\">\n");
            html.append("  <h2>학력사항</h2>\n");
            html.append("  <table>\n");
            html.append("    <tr><th>학교명</th><th>학위</th><th>전공</th><th>졸업일</th></tr>\n");
            for (EmployeeEducationResponse edu : recordCard.getEducations()) {
                html.append("    <tr>");
                html.append("<td>").append(nullSafe(edu.getSchoolName())).append("</td>");
                html.append("<td>").append(nullSafe(edu.getDegree())).append("</td>");
                html.append("<td>").append(nullSafe(edu.getMajor())).append("</td>");
                html.append("<td>").append(formatDate(edu.getEndDate())).append("</td>");
                html.append("</tr>\n");
            }
            html.append("  </table>\n");
            html.append("</div>\n");
        }

        // 경력 섹션
        if (recordCard.getCareers() != null && !recordCard.getCareers().isEmpty()) {
            html.append("<div class=\"section\">\n");
            html.append("  <h2>경력사항</h2>\n");
            html.append("  <table>\n");
            html.append("    <tr><th>회사명</th><th>부서</th><th>직위</th><th>근무기간</th></tr>\n");
            for (EmployeeCareerResponse career : recordCard.getCareers()) {
                html.append("    <tr>");
                html.append("<td>").append(nullSafe(career.getCompanyName())).append("</td>");
                html.append("<td>").append(nullSafe(career.getDepartment())).append("</td>");
                html.append("<td>").append(nullSafe(career.getPosition())).append("</td>");
                html.append("<td>").append(formatDate(career.getStartDate()))
                    .append(" ~ ").append(formatDate(career.getEndDate())).append("</td>");
                html.append("</tr>\n");
            }
            html.append("  </table>\n");
            html.append("</div>\n");
        }

        // 자격증 섹션
        if (recordCard.getCertificates() != null && !recordCard.getCertificates().isEmpty()) {
            html.append("<div class=\"section\">\n");
            html.append("  <h2>자격증</h2>\n");
            html.append("  <table>\n");
            html.append("    <tr><th>자격증명</th><th>발급기관</th><th>취득일</th><th>유효기간</th></tr>\n");
            for (EmployeeCertificateResponse cert : recordCard.getCertificates()) {
                html.append("    <tr>");
                html.append("<td>").append(nullSafe(cert.getCertificateName())).append("</td>");
                html.append("<td>").append(nullSafe(cert.getIssuingOrganization())).append("</td>");
                html.append("<td>").append(formatDate(cert.getIssueDate())).append("</td>");
                html.append("<td>").append(formatDate(cert.getExpiryDate())).append("</td>");
                html.append("</tr>\n");
            }
            html.append("  </table>\n");
            html.append("</div>\n");
        }

        // 가족 섹션
        if (recordCard.getFamilies() != null && !recordCard.getFamilies().isEmpty()) {
            html.append("<div class=\"section\">\n");
            html.append("  <h2>가족사항</h2>\n");
            html.append("  <table>\n");
            html.append("    <tr><th>관계</th><th>성명</th><th>생년월일</th><th>동거여부</th></tr>\n");
            for (EmployeeFamilyResponse family : recordCard.getFamilies()) {
                html.append("    <tr>");
                html.append("<td>").append(formatRelation(family.getRelation())).append("</td>");
                html.append("<td>").append(nullSafe(family.getName())).append("</td>");
                html.append("<td>").append(formatDate(family.getBirthDate())).append("</td>");
                html.append("<td>").append(Boolean.TRUE.equals(family.getIsCohabiting()) ? "동거" : "별거").append("</td>");
                html.append("</tr>\n");
            }
            html.append("  </table>\n");
            html.append("</div>\n");
        }

        html.append("<p style=\"text-align: right; color: #666; margin-top: 40px;\">");
        html.append("생성일시: ").append(recordCard.getGeneratedAt()).append("</p>\n");

        html.append("</body>\n");
        html.append("</html>");

        return html.toString();
    }

    private String nullSafe(String value) {
        return value != null ? value : "-";
    }

    private String formatDate(LocalDate date) {
        if (date == null) return "-";
        return date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
    }

    private String formatServiceYears(RecordCardResponse recordCard) {
        if (recordCard.getYearsOfService() == null) return "-";
        return recordCard.getYearsOfService() + "년 " + recordCard.getMonthsOfService() + "개월";
    }

    private String formatStatus(EmployeeStatus status) {
        if (status == null) return "-";
        return switch (status) {
            case ACTIVE -> "재직";
            case RESIGNED -> "퇴사";
            case SUSPENDED -> "휴직";
            case ON_LEAVE -> "휴가중";
        };
    }

    private String formatEmploymentType(EmploymentType type) {
        if (type == null) return "-";
        return switch (type) {
            case REGULAR -> "정규직";
            case CONTRACT -> "계약직";
            case PART_TIME -> "파트타임";
            case INTERN -> "인턴";
        };
    }

    private String formatChangeType(HistoryChangeType type) {
        if (type == null) return "-";
        return switch (type) {
            case HIRE -> "입사";
            case TRANSFER -> "전보";
            case PROMOTION -> "승진";
            case GRADE_CHANGE -> "직급변경";
            case POSITION_CHANGE -> "직책변경";
            case RESIGN -> "퇴사";
            case RETURN -> "복직";
            case LEAVE -> "휴직";
        };
    }

    private String formatRelation(FamilyRelationType relation) {
        if (relation == null) return "-";
        return switch (relation) {
            case SPOUSE -> "배우자";
            case CHILD -> "자녀";
            case PARENT -> "부모";
            case SIBLING -> "형제자매";
            case GRANDPARENT -> "조부모";
            case OTHER -> "기타";
        };
    }

    private String formatHistoryDescription(EmployeeHistoryResponse history) {
        StringBuilder desc = new StringBuilder();
        if (history.getFromDepartmentName() != null || history.getToDepartmentName() != null) {
            desc.append(nullSafe(history.getFromDepartmentName()))
                .append(" → ")
                .append(nullSafe(history.getToDepartmentName()));
        }
        if (history.getFromPositionName() != null || history.getToPositionName() != null) {
            if (desc.length() > 0) desc.append(" / ");
            desc.append(nullSafe(history.getFromPositionName()))
                .append(" → ")
                .append(nullSafe(history.getToPositionName()));
        }
        if (history.getFromGradeName() != null || history.getToGradeName() != null) {
            if (desc.length() > 0) desc.append(" / ");
            desc.append(nullSafe(history.getFromGradeName()))
                .append(" → ")
                .append(nullSafe(history.getToGradeName()));
        }
        return desc.length() > 0 ? desc.toString() : "-";
    }
}
