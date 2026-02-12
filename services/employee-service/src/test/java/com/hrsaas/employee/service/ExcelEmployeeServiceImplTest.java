package com.hrsaas.employee.service;

import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.employee.domain.dto.request.CreateEmployeeRequest;
import com.hrsaas.employee.domain.entity.Employee;
import com.hrsaas.employee.domain.entity.EmploymentType;
import com.hrsaas.employee.service.impl.ExcelEmployeeServiceImpl;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Excel Employee Service Test")
class ExcelEmployeeServiceImplTest {

    private ExcelEmployeeServiceImpl excelEmployeeService;

    @BeforeEach
    void setUp() {
        excelEmployeeService = new ExcelEmployeeServiceImpl();
    }

    @Test
    @DisplayName("Export to Excel - Valid Data")
    void exportToExcel_validData_returnsByteArray() throws IOException {
        // Given
        UUID deptId = UUID.randomUUID();
        Employee employee = Employee.builder()
                .employeeNumber("EMP-001")
                .name("Test User")
                .nameEn("Test User EN")
                .email("test@example.com")
                .phone("02-1234-5678")
                .mobile("010-1234-5678")
                .departmentId(deptId)
                .positionCode("P01")
                .jobTitleCode("J01")
                .hireDate(LocalDate.of(2023, 1, 1))
                .employmentType(EmploymentType.REGULAR)
                .build();

        List<Employee> employees = List.of(employee);

        // When
        byte[] excelBytes = excelEmployeeService.exportToExcel(employees);

        // Then
        assertNotNull(excelBytes);
        assertTrue(excelBytes.length > 0);

        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(excelBytes))) {
            Sheet sheet = workbook.getSheet("직원목록");
            assertNotNull(sheet);

            // Verify Header
            Row headerRow = sheet.getRow(0);
            assertEquals("사번", headerRow.getCell(0).getStringCellValue());
            assertEquals("이름", headerRow.getCell(1).getStringCellValue());

            // Verify Data
            Row dataRow = sheet.getRow(1);
            assertEquals("EMP-001", dataRow.getCell(0).getStringCellValue());
            assertEquals("Test User", dataRow.getCell(1).getStringCellValue());
            assertEquals("Test User EN", dataRow.getCell(2).getStringCellValue());
            assertEquals("test@example.com", dataRow.getCell(3).getStringCellValue());
            assertEquals("02-1234-5678", dataRow.getCell(4).getStringCellValue());
            assertEquals("010-1234-5678", dataRow.getCell(5).getStringCellValue());
            assertEquals(deptId.toString(), dataRow.getCell(6).getStringCellValue());
            assertEquals("P01", dataRow.getCell(7).getStringCellValue());
            assertEquals("J01", dataRow.getCell(8).getStringCellValue());
            assertEquals("2023-01-01", dataRow.getCell(9).getStringCellValue());
            assertEquals("REGULAR", dataRow.getCell(10).getStringCellValue());
        }
    }

    @Test
    @DisplayName("Export to Excel - Empty List")
    void exportToExcel_emptyList_returnsHeadersOnly() throws IOException {
        // When
        byte[] excelBytes = excelEmployeeService.exportToExcel(Collections.emptyList());

        // Then
        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(excelBytes))) {
            Sheet sheet = workbook.getSheet("직원목록");
            assertNotNull(sheet);
            assertEquals(0, sheet.getLastRowNum()); // Only header row exists (index 0)
        }
    }

    @Test
    @DisplayName("Import from Excel - Valid File")
    void importFromExcel_validFile_returnsRequests() throws IOException {
        // Given
        byte[] excelFile = createSampleExcelFile();

        // When
        List<CreateEmployeeRequest> requests = excelEmployeeService.importFromExcel(new ByteArrayInputStream(excelFile));

        // Then
        assertEquals(1, requests.size());
        CreateEmployeeRequest request = requests.get(0);
        assertEquals("EMP-TEST", request.getEmployeeNumber());
        assertEquals("Test User", request.getName());
        assertEquals("Test User EN", request.getNameEn());
        assertEquals("test@example.com", request.getEmail());
        assertEquals("REGULAR", request.getEmploymentType().name());
    }

    @Test
    @DisplayName("Import from Excel - Parsing Logic")
    void importFromExcel_parsingLogic() throws IOException {
        // Given: Create an Excel with specific data for parsing tests
        // Row 1: Normal date, Lowercase enum, Empty UUID
        // Row 2: Invalid date format (should result in null), Invalid enum (should default to REGULAR)

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet();
            Row row = sheet.createRow(1); // Data row 1
            createCell(row, 0, "EMP-001");
            createCell(row, 1, "User 1");
            createCell(row, 9, "2023-01-01"); // Date
            createCell(row, 10, "contract"); // Lowercase Enum

            Row row2 = sheet.createRow(2); // Data row 2
            createCell(row2, 0, "EMP-002");
            createCell(row2, 1, "User 2");
            createCell(row2, 9, "invalid-date"); // Invalid Date
            createCell(row2, 10, "UNKNOWN_TYPE"); // Invalid Enum

            workbook.write(baos);
            byte[] excelBytes = baos.toByteArray();

            // When
            List<CreateEmployeeRequest> requests = excelEmployeeService.importFromExcel(new ByteArrayInputStream(excelBytes));

            // Then
            assertEquals(2, requests.size());

            // Check Row 1
            CreateEmployeeRequest req1 = requests.get(0);
            assertEquals(LocalDate.of(2023, 1, 1), req1.getHireDate());
            assertEquals(EmploymentType.CONTRACT, req1.getEmploymentType());

            // Check Row 2
            CreateEmployeeRequest req2 = requests.get(1);
            assertNull(req2.getHireDate());
            assertEquals(EmploymentType.REGULAR, req2.getEmploymentType()); // Default fallback
        }
    }

    @Test
    @DisplayName("Import from Excel - Invalid Stream")
    void importFromExcel_invalidStream_throwsBusinessException() {
        // Given
        ByteArrayInputStream invalidStream = new ByteArrayInputStream(new byte[0]); // Empty stream might cause POI to fail differently, let's try a closed stream if possible or just garbage bytes.
        // POI usually throws Exception on empty/garbage stream.

        // When & Then
        assertThrows(BusinessException.class, () ->
            excelEmployeeService.importFromExcel(new ByteArrayInputStream(new byte[]{1, 2, 3})) // Garbage data
        );
    }

    @Test
    @DisplayName("Import from Excel - Skip Empty Rows")
    void importFromExcel_skipEmptyRows() throws IOException {
         try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet();

            // Row 1: Valid
            Row row1 = sheet.createRow(1);
            createCell(row1, 0, "EMP-001");
            createCell(row1, 1, "User 1");

            // Row 2: Empty employee number
            Row row2 = sheet.createRow(2);
            createCell(row2, 0, "");
            createCell(row2, 1, "User 2");

            // Row 3: Empty name
            Row row3 = sheet.createRow(3);
            createCell(row3, 0, "EMP-003");
            createCell(row3, 1, "");

            // Row 4: Null row (simulated by skipping creation, but POI iterates up to lastRowNum)
            // If we write Row 5, Row 4 will be null.
            Row row5 = sheet.createRow(5);
            createCell(row5, 0, "EMP-005");
            createCell(row5, 1, "User 5");

            workbook.write(baos);

            List<CreateEmployeeRequest> requests = excelEmployeeService.importFromExcel(new ByteArrayInputStream(baos.toByteArray()));

            // Expecting only EMP-001 and EMP-005
            assertEquals(2, requests.size());
            assertEquals("EMP-001", requests.get(0).getEmployeeNumber());
            assertEquals("EMP-005", requests.get(1).getEmployeeNumber());
         }
    }

    @Test
    @DisplayName("Generate Template - Returns Valid Excel")
    void generateTemplate_returnsValidExcel() throws IOException {
        // When
        byte[] templateBytes = excelEmployeeService.generateTemplate();

        // Then
        assertNotNull(templateBytes);
        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(templateBytes))) {
            // Check Data Sheet
            Sheet dataSheet = workbook.getSheet("직원등록");
            assertNotNull(dataSheet);
            assertEquals("사번", dataSheet.getRow(0).getCell(0).getStringCellValue());
            assertEquals("홍길동", dataSheet.getRow(1).getCell(1).getStringCellValue()); // Sample data

            // Check Guide Sheet
            Sheet guideSheet = workbook.getSheet("입력가이드");
            assertNotNull(guideSheet);
            assertTrue(guideSheet.getRow(0).getCell(0).getStringCellValue().contains("가이드"));
        }
    }

    // Helper methods
    private byte[] createSampleExcelFile() throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet();
            Row row = sheet.createRow(1); // Data starts at index 1
            createCell(row, 0, "EMP-TEST");
            createCell(row, 1, "Test User");
            createCell(row, 2, "Test User EN");
            createCell(row, 3, "test@example.com");
            createCell(row, 10, "REGULAR");

            workbook.write(baos);
            return baos.toByteArray();
        }
    }

    private void createCell(Row row, int index, String value) {
        row.createCell(index).setCellValue(value);
    }
}
