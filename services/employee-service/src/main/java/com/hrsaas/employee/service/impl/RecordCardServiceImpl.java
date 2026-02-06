package com.hrsaas.employee.service.impl;

import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.employee.domain.dto.response.*;
import com.hrsaas.employee.domain.entity.*;
import com.hrsaas.employee.repository.*;
import com.hrsaas.employee.service.RecordCardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
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

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            // TODO: Korean font embedding - load a Korean TTF font (e.g., NanumGothic)
            // for proper Korean character rendering. Currently using built-in Helvetica
            // which cannot render Korean characters. Example:
            //   InputStream fontStream = getClass().getResourceAsStream("/fonts/NanumGothic.ttf");
            //   PDType0Font koreanFont = PDType0Font.load(document, fontStream);
            PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

            float margin = 50;
            float yStart = PDRectangle.A4.getHeight() - margin;
            float pageWidth = PDRectangle.A4.getWidth();
            float contentWidth = pageWidth - 2 * margin;

            // -- Page 1: Basic Info --
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            PDPageContentStream cs = new PDPageContentStream(document, page);
            float y = yStart;

            // Title
            y = drawCenteredText(cs, fontBold, 18, "Personnel Record Card", pageWidth, y);
            // Korean subtitle (will show as boxes without Korean font - see TODO above)
            y = drawCenteredText(cs, fontRegular, 10, "(Insa Girok Kadeu)", pageWidth, y - 5);
            y -= 30;

            // Horizontal rule
            cs.setLineWidth(1.5f);
            cs.moveTo(margin, y);
            cs.lineTo(pageWidth - margin, y);
            cs.stroke();
            y -= 25;

            // Basic Info Section
            y = drawSectionHeader(cs, fontBold, "Basic Information", margin, y);
            y -= 5;

            y = drawLabelValue(cs, fontBold, fontRegular, "Name:", nullSafe(recordCard.getName()), margin, y, contentWidth);
            y = drawLabelValue(cs, fontBold, fontRegular, "Employee No:", nullSafe(recordCard.getEmployeeNumber()), margin, y, contentWidth);
            y = drawLabelValue(cs, fontBold, fontRegular, "Department:", nullSafe(recordCard.getDepartmentName()), margin, y, contentWidth);
            y = drawLabelValue(cs, fontBold, fontRegular, "Position:", nullSafe(recordCard.getPositionName()), margin, y, contentWidth);
            y = drawLabelValue(cs, fontBold, fontRegular, "Hire Date:", formatDate(recordCard.getHireDate()), margin, y, contentWidth);
            y = drawLabelValue(cs, fontBold, fontRegular, "Email:", nullSafe(recordCard.getEmail()), margin, y, contentWidth);
            y = drawLabelValue(cs, fontBold, fontRegular, "Phone:", nullSafe(recordCard.getPhone()), margin, y, contentWidth);
            y = drawLabelValue(cs, fontBold, fontRegular, "Mobile:", nullSafe(recordCard.getMobile()), margin, y, contentWidth);
            y = drawLabelValue(cs, fontBold, fontRegular, "Status:", formatStatus(recordCard.getStatus()), margin, y, contentWidth);
            y = drawLabelValue(cs, fontBold, fontRegular, "Employment Type:", formatEmploymentType(recordCard.getEmploymentType()), margin, y, contentWidth);
            y = drawLabelValue(cs, fontBold, fontRegular, "Service Years:", formatServiceYears(recordCard), margin, y, contentWidth);
            y -= 15;

            // Career History Section
            if (recordCard.getCareers() != null && !recordCard.getCareers().isEmpty()) {
                if (y < 120) {
                    cs.close();
                    page = new PDPage(PDRectangle.A4);
                    document.addPage(page);
                    cs = new PDPageContentStream(document, page);
                    y = yStart;
                }
                y = drawSectionHeader(cs, fontBold, "Career History", margin, y);
                y -= 5;
                for (EmployeeCareerResponse career : recordCard.getCareers()) {
                    if (y < 80) {
                        cs.close();
                        page = new PDPage(PDRectangle.A4);
                        document.addPage(page);
                        cs = new PDPageContentStream(document, page);
                        y = yStart;
                    }
                    String line = nullSafe(career.getCompanyName()) + " | " +
                                  nullSafe(career.getDepartment()) + " | " +
                                  nullSafe(career.getPosition()) + " | " +
                                  formatDate(career.getStartDate()) + " ~ " + formatDate(career.getEndDate());
                    y = drawText(cs, fontRegular, 9, line, margin + 10, y);
                }
                y -= 10;
            }

            // Education Section
            if (recordCard.getEducations() != null && !recordCard.getEducations().isEmpty()) {
                if (y < 120) {
                    cs.close();
                    page = new PDPage(PDRectangle.A4);
                    document.addPage(page);
                    cs = new PDPageContentStream(document, page);
                    y = yStart;
                }
                y = drawSectionHeader(cs, fontBold, "Education", margin, y);
                y -= 5;
                for (EmployeeEducationResponse edu : recordCard.getEducations()) {
                    if (y < 80) {
                        cs.close();
                        page = new PDPage(PDRectangle.A4);
                        document.addPage(page);
                        cs = new PDPageContentStream(document, page);
                        y = yStart;
                    }
                    String line = nullSafe(edu.getSchoolName()) + " | " +
                                  nullSafe(edu.getDegree()) + " | " +
                                  nullSafe(edu.getMajor()) + " | " +
                                  formatDate(edu.getEndDate());
                    y = drawText(cs, fontRegular, 9, line, margin + 10, y);
                }
                y -= 10;
            }

            // Footer
            if (y < 60) {
                cs.close();
                page = new PDPage(PDRectangle.A4);
                document.addPage(page);
                cs = new PDPageContentStream(document, page);
                y = yStart;
            }
            y -= 20;
            drawText(cs, fontRegular, 8, "Generated at: " + recordCard.getGeneratedAt(), margin, y);

            cs.close();

            document.save(baos);
            log.info("PDF generation completed for employee: {}", employeeId);
            return baos.toByteArray();

        } catch (IOException e) {
            log.error("Failed to generate PDF for employee: {}", employeeId, e);
            throw new BusinessException("EMP_010", "PDF 생성에 실패했습니다", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Draws centered text on the page and returns the new Y position.
     */
    private float drawCenteredText(PDPageContentStream cs, PDType1Font font, float fontSize,
                                    String text, float pageWidth, float y) throws IOException {
        float textWidth = font.getStringWidth(text) / 1000 * fontSize;
        float x = (pageWidth - textWidth) / 2;
        cs.beginText();
        cs.setFont(font, fontSize);
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
        return y - fontSize - 4;
    }

    /**
     * Draws a section header with underline.
     */
    private float drawSectionHeader(PDPageContentStream cs, PDType1Font font,
                                     String text, float x, float y) throws IOException {
        cs.beginText();
        cs.setFont(font, 12);
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
        y -= 4;
        cs.setLineWidth(0.75f);
        cs.moveTo(x, y);
        cs.lineTo(x + font.getStringWidth(text) / 1000 * 12, y);
        cs.stroke();
        return y - 16;
    }

    /**
     * Draws a label-value pair.
     */
    private float drawLabelValue(PDPageContentStream cs, PDType1Font boldFont, PDType1Font regularFont,
                                  String label, String value, float x, float y, float contentWidth) throws IOException {
        cs.beginText();
        cs.setFont(boldFont, 10);
        cs.newLineAtOffset(x, y);
        cs.showText(label);
        cs.setFont(regularFont, 10);
        cs.newLineAtOffset(130, 0);
        cs.showText(value);
        cs.endText();
        return y - 16;
    }

    /**
     * Draws a single line of text.
     */
    private float drawText(PDPageContentStream cs, PDType1Font font, float fontSize,
                            String text, float x, float y) throws IOException {
        cs.beginText();
        cs.setFont(font, fontSize);
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
        return y - fontSize - 4;
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
