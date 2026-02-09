package com.hrsaas.employee.service.impl;

import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.employee.domain.dto.request.CreateEmployeeRequest;
import com.hrsaas.employee.domain.entity.Employee;
import com.hrsaas.employee.domain.entity.EmploymentType;
import com.hrsaas.employee.service.ExcelEmployeeService;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class ExcelEmployeeServiceImpl implements ExcelEmployeeService {

    private static final String[] HEADERS = {
        "사번", "이름", "영문명", "이메일", "전화번호", "휴대전화",
        "부서ID", "직책코드", "직급코드", "입사일(yyyy-MM-dd)", "고용유형(REGULAR/CONTRACT/PART_TIME/INTERN)"
    };

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    public byte[] exportToExcel(List<Employee> employees) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("직원목록");

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Header row
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowNum = 1;
            for (Employee emp : employees) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(nullSafe(emp.getEmployeeNumber()));
                row.createCell(1).setCellValue(nullSafe(emp.getName()));
                row.createCell(2).setCellValue(nullSafe(emp.getNameEn()));
                row.createCell(3).setCellValue(nullSafe(emp.getEmail()));
                row.createCell(4).setCellValue(nullSafe(emp.getPhone()));
                row.createCell(5).setCellValue(nullSafe(emp.getMobile()));
                row.createCell(6).setCellValue(emp.getDepartmentId() != null ? emp.getDepartmentId().toString() : "");
                row.createCell(7).setCellValue(nullSafe(emp.getPositionCode()));
                row.createCell(8).setCellValue(nullSafe(emp.getJobTitleCode()));
                row.createCell(9).setCellValue(emp.getHireDate() != null ? emp.getHireDate().format(DATE_FORMAT) : "");
                row.createCell(10).setCellValue(emp.getEmploymentType() != null ? emp.getEmploymentType().name() : "REGULAR");
            }

            // Auto-size columns
            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(baos);
            log.info("Excel export completed: {} employees", employees.size());
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Failed to export employees to Excel", e);
            throw new BusinessException("EMP_040", "Excel 내보내기에 실패했습니다", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public List<CreateEmployeeRequest> importFromExcel(InputStream inputStream) {
        List<CreateEmployeeRequest> requests = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(inputStream)) {
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String employeeNumber = getCellString(row, 0);
                String name = getCellString(row, 1);

                // Skip empty rows
                if (employeeNumber == null || employeeNumber.isBlank()) continue;
                if (name == null || name.isBlank()) continue;

                CreateEmployeeRequest request = CreateEmployeeRequest.builder()
                    .employeeNumber(employeeNumber.trim())
                    .name(name.trim())
                    .nameEn(getCellString(row, 2))
                    .email(getCellString(row, 3))
                    .phone(getCellString(row, 4))
                    .mobile(getCellString(row, 5))
                    .departmentId(parseUuid(getCellString(row, 6)))
                    .positionCode(getCellString(row, 7))
                    .jobTitleCode(getCellString(row, 8))
                    .hireDate(parseDate(getCellString(row, 9)))
                    .employmentType(parseEmploymentType(getCellString(row, 10)))
                    .build();

                requests.add(request);
            }

            log.info("Excel import parsed: {} employees", requests.size());
            return requests;

        } catch (Exception e) {
            log.error("Failed to import employees from Excel", e);
            throw new BusinessException("EMP_041", "Excel 가져오기에 실패했습니다: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @Override
    public byte[] generateTemplate() {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            Sheet dataSheet = workbook.createSheet("직원등록");

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Header row
            Row headerRow = dataSheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            // Sample row
            Row sampleRow = dataSheet.createRow(1);
            sampleRow.createCell(0).setCellValue("EMP-2026-0001");
            sampleRow.createCell(1).setCellValue("홍길동");
            sampleRow.createCell(2).setCellValue("Hong Gildong");
            sampleRow.createCell(3).setCellValue("hong@example.com");
            sampleRow.createCell(4).setCellValue("02-1234-5678");
            sampleRow.createCell(5).setCellValue("010-1234-5678");
            sampleRow.createCell(6).setCellValue("");
            sampleRow.createCell(7).setCellValue("TL");
            sampleRow.createCell(8).setCellValue("G3");
            sampleRow.createCell(9).setCellValue("2026-03-01");
            sampleRow.createCell(10).setCellValue("REGULAR");

            // Auto-size columns
            for (int i = 0; i < HEADERS.length; i++) {
                dataSheet.autoSizeColumn(i);
            }

            // Guide sheet
            Sheet guideSheet = workbook.createSheet("입력가이드");
            guideSheet.createRow(0).createCell(0).setCellValue("== 직원 일괄등록 입력 가이드 ==");
            guideSheet.createRow(2).createCell(0).setCellValue("1. 사번: 필수. 테넌트 내 유일해야 합니다.");
            guideSheet.createRow(3).createCell(0).setCellValue("2. 이름: 필수.");
            guideSheet.createRow(4).createCell(0).setCellValue("3. 이메일: 필수. 유효한 이메일 형식이어야 합니다.");
            guideSheet.createRow(5).createCell(0).setCellValue("4. 입사일: yyyy-MM-dd 형식 (예: 2026-03-01)");
            guideSheet.createRow(6).createCell(0).setCellValue("5. 고용유형: REGULAR, CONTRACT, PART_TIME, INTERN 중 하나");
            guideSheet.autoSizeColumn(0);

            workbook.write(baos);
            log.info("Excel template generated");
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Failed to generate Excel template", e);
            throw new BusinessException("EMP_042", "템플릿 생성에 실패했습니다", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String getCellString(Row row, int index) {
        Cell cell = row.getCell(index);
        if (cell == null) return null;
        cell.setCellType(CellType.STRING);
        String value = cell.getStringCellValue();
        return value != null && !value.isBlank() ? value.trim() : null;
    }

    private java.util.UUID parseUuid(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return java.util.UUID.fromString(value.trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDate.parse(value.trim(), DATE_FORMAT);
        } catch (Exception e) {
            return null;
        }
    }

    private EmploymentType parseEmploymentType(String value) {
        if (value == null || value.isBlank()) return EmploymentType.REGULAR;
        try {
            return EmploymentType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return EmploymentType.REGULAR;
        }
    }

    private String nullSafe(String value) {
        return value != null ? value : "";
    }
}
