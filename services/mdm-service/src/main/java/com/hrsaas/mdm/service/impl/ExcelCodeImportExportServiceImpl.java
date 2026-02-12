package com.hrsaas.mdm.service.impl;

import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.mdm.domain.dto.request.CodeImportBatchRequest;
import com.hrsaas.mdm.domain.dto.request.CodeImportRequest;
import com.hrsaas.mdm.domain.dto.response.ImportResultResponse;
import com.hrsaas.mdm.domain.entity.CodeGroup;
import com.hrsaas.mdm.domain.entity.CommonCode;
import com.hrsaas.mdm.repository.CodeGroupRepository;
import com.hrsaas.mdm.repository.CommonCodeRepository;
import com.hrsaas.mdm.service.CodeImportExportService;
import com.hrsaas.mdm.service.ExcelCodeImportExportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Excel 기반 코드 임포트/엑스포트 서비스 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExcelCodeImportExportServiceImpl implements ExcelCodeImportExportService {

    private static final int MAX_IMPORT_ROWS = 5_000;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // Sheet 1: 코드그룹 헤더
    private static final String[] GROUP_HEADERS = {
        "groupCode", "groupName", "groupNameEn", "description",
        "hierarchical", "maxLevel", "isSystem", "sortOrder"
    };

    // Sheet 2: 공통코드 헤더
    private static final String[] CODE_HEADERS = {
        "groupCode", "code", "codeName", "codeNameEn", "description",
        "level", "parentCode", "extraValue1", "extraValue2", "extraValue3",
        "effectiveFrom", "effectiveTo", "sortOrder"
    };

    private final CodeGroupRepository codeGroupRepository;
    private final CommonCodeRepository commonCodeRepository;
    private final CodeImportExportService codeImportExportService;

    @Override
    public byte[] exportToExcel(List<String> groupCodes) {
        log.info("Exporting codes to Excel: groupCodes={}", groupCodes);

        UUID tenantId = TenantContext.getCurrentTenant();
        List<CodeGroup> groups;

        if (groupCodes != null && !groupCodes.isEmpty()) {
            groups = new ArrayList<>();
            for (String groupCode : groupCodes) {
                codeGroupRepository.findByGroupCodeAndTenant(groupCode, tenantId)
                    .ifPresent(groups::add);
            }
        } else {
            groups = codeGroupRepository.findAllForTenant(tenantId);
        }

        return buildExcelWorkbook(groups);
    }

    @Override
    public byte[] exportSystemCodesToExcel() {
        log.info("Exporting system codes to Excel");

        List<CodeGroup> groups = codeGroupRepository.findAllSystemCodeGroups();
        return buildExcelWorkbook(groups);
    }

    @Override
    public byte[] generateImportTemplate() {
        log.info("Generating import template");

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            CellStyle headerStyle = createHeaderStyle(workbook);

            // Sheet 1: 코드그룹
            Sheet groupSheet = workbook.createSheet("코드그룹");
            writeHeaderRow(groupSheet, GROUP_HEADERS, headerStyle);

            // Example row for group sheet
            Row groupExampleRow = groupSheet.createRow(1);
            groupExampleRow.createCell(0).setCellValue("EXAMPLE_GROUP");
            groupExampleRow.createCell(1).setCellValue("예시 그룹");
            groupExampleRow.createCell(2).setCellValue("Example Group");
            groupExampleRow.createCell(3).setCellValue("예시 코드 그룹입니다");
            groupExampleRow.createCell(4).setCellValue("false");
            groupExampleRow.createCell(5).setCellValue(1);
            groupExampleRow.createCell(6).setCellValue("false");
            groupExampleRow.createCell(7).setCellValue(1);

            autoSizeColumns(groupSheet, GROUP_HEADERS.length);

            // Sheet 2: 공통코드
            Sheet codeSheet = workbook.createSheet("공통코드");
            writeHeaderRow(codeSheet, CODE_HEADERS, headerStyle);

            // Example row for code sheet
            Row codeExampleRow = codeSheet.createRow(1);
            codeExampleRow.createCell(0).setCellValue("EXAMPLE_GROUP");
            codeExampleRow.createCell(1).setCellValue("EX_001");
            codeExampleRow.createCell(2).setCellValue("예시 코드");
            codeExampleRow.createCell(3).setCellValue("Example Code");
            codeExampleRow.createCell(4).setCellValue("예시 코드 설명");
            codeExampleRow.createCell(5).setCellValue(1);
            codeExampleRow.createCell(6).setCellValue("");
            codeExampleRow.createCell(7).setCellValue("");
            codeExampleRow.createCell(8).setCellValue("");
            codeExampleRow.createCell(9).setCellValue("");
            codeExampleRow.createCell(10).setCellValue("2026-01-01");
            codeExampleRow.createCell(11).setCellValue("2026-12-31");
            codeExampleRow.createCell(12).setCellValue(1);

            autoSizeColumns(codeSheet, CODE_HEADERS.length);

            return toByteArray(workbook);

        } catch (IOException e) {
            throw new RuntimeException("Excel 임포트 템플릿 생성 중 오류가 발생했습니다", e);
        }
    }

    @Override
    public ImportResultResponse importFromExcel(MultipartFile file, boolean overwrite, boolean validateOnly) {
        log.info("Importing codes from Excel: overwrite={}, validateOnly={}", overwrite, validateOnly);

        try (XSSFWorkbook workbook = new XSSFWorkbook(file.getInputStream())) {
            // Sheet 2 (공통코드) 읽기
            Sheet codeSheet = workbook.getSheet("공통코드");
            if (codeSheet == null) {
                // 시트 이름으로 찾지 못하면 인덱스 1로 시도
                if (workbook.getNumberOfSheets() >= 2) {
                    codeSheet = workbook.getSheetAt(1);
                } else {
                    throw new RuntimeException("'공통코드' 시트를 찾을 수 없습니다");
                }
            }

            int lastRow = codeSheet.getLastRowNum();
            if (lastRow < 1) {
                throw new RuntimeException("임포트할 데이터가 없습니다");
            }

            int dataRowCount = lastRow; // header row excluded
            if (dataRowCount > MAX_IMPORT_ROWS) {
                throw new RuntimeException(
                    String.format("임포트 최대 행 수(%d)를 초과했습니다: %d행", MAX_IMPORT_ROWS, dataRowCount));
            }

            // Parse rows into CodeImportRequest list
            List<CodeImportRequest> importRequests = new ArrayList<>();
            for (int i = 1; i <= lastRow; i++) {
                Row row = codeSheet.getRow(i);
                if (row == null || isEmptyRow(row)) {
                    continue;
                }

                CodeImportRequest request = parseCodeRow(row);
                if (request != null) {
                    importRequests.add(request);
                }
            }

            if (importRequests.isEmpty()) {
                throw new RuntimeException("유효한 임포트 데이터가 없습니다");
            }

            // Build batch request and delegate to existing service
            CodeImportBatchRequest batchRequest = CodeImportBatchRequest.builder()
                .codes(importRequests)
                .overwrite(overwrite)
                .validateOnly(validateOnly)
                .build();

            return codeImportExportService.importCodes(batchRequest);

        } catch (IOException e) {
            throw new RuntimeException("Excel 파일 읽기 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    // ===== Private helper methods =====

    /**
     * CodeGroup 및 CommonCode 목록을 Excel 워크북으로 변환
     */
    private byte[] buildExcelWorkbook(List<CodeGroup> groups) {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            CellStyle headerStyle = createHeaderStyle(workbook);

            // Sheet 1: 코드그룹
            Sheet groupSheet = workbook.createSheet("코드그룹");
            writeHeaderRow(groupSheet, GROUP_HEADERS, headerStyle);

            int groupRowIdx = 1;
            for (CodeGroup group : groups) {
                Row row = groupSheet.createRow(groupRowIdx++);
                row.createCell(0).setCellValue(group.getGroupCode());
                row.createCell(1).setCellValue(group.getGroupName());
                row.createCell(2).setCellValue(nullSafe(group.getGroupNameEn()));
                row.createCell(3).setCellValue(nullSafe(group.getDescription()));
                row.createCell(4).setCellValue(String.valueOf(group.isHierarchical()));
                row.createCell(5).setCellValue(group.getMaxLevel() != null ? group.getMaxLevel() : 1);
                row.createCell(6).setCellValue(String.valueOf(group.isSystem()));
                row.createCell(7).setCellValue(group.getSortOrder() != null ? group.getSortOrder() : 0);
            }
            autoSizeColumns(groupSheet, GROUP_HEADERS.length);

            // Sheet 2: 공통코드
            Sheet codeSheet = workbook.createSheet("공통코드");
            writeHeaderRow(codeSheet, CODE_HEADERS, headerStyle);

            // Fetch all codes for the groups in a single query
            Map<UUID, List<CommonCode>> codesByGroup = new HashMap<>();
            if (!groups.isEmpty()) {
                List<UUID> groupIds = groups.stream()
                    .map(CodeGroup::getId)
                    .collect(Collectors.toList());

                List<CommonCode> allCodes = commonCodeRepository.findByCodeGroupIdIn(groupIds);

                codesByGroup = allCodes.stream()
                    .collect(Collectors.groupingBy(code -> code.getCodeGroup().getId()));
            }

            int codeRowIdx = 1;
            for (CodeGroup group : groups) {
                List<CommonCode> codes = codesByGroup.getOrDefault(group.getId(), Collections.emptyList());
                // Sort codes if needed (already sorted by query but list order might not be guaranteed after grouping)
                // However, the query sorted by group ID then sort order.
                // GroupingBy usually preserves order if the stream is ordered, but standard Map doesn't guarantee iteration order.
                // But here we iterate over 'groups' and get from 'codesByGroup'.
                // The list inside the map should preserve order if we collected it that way.
                // But groupingBy returns a Map<K, List<V>>. The List<V> implementation is usually ArrayList.
                // Since the input stream 'allCodes' is sorted by GroupID then SortOrder,
                // the elements for a specific group will appear in the stream in SortOrder.
                // So the list for that group will be sorted.

                for (CommonCode code : codes) {
                    Row row = codeSheet.createRow(codeRowIdx++);
                    row.createCell(0).setCellValue(group.getGroupCode());
                    row.createCell(1).setCellValue(code.getCode());

                    // Hierarchical codes: indent codeName based on level
                    String displayName = code.getCodeName();
                    if (group.isHierarchical() && code.getLevel() != null && code.getLevel() > 1) {
                        String indent = "  ".repeat(code.getLevel() - 1);
                        displayName = indent + displayName;
                    }
                    row.createCell(2).setCellValue(displayName);

                    row.createCell(3).setCellValue(nullSafe(code.getCodeNameEn()));
                    row.createCell(4).setCellValue(nullSafe(code.getDescription()));
                    row.createCell(5).setCellValue(code.getLevel() != null ? code.getLevel() : 1);
                    row.createCell(6).setCellValue(
                        code.getParentCodeId() != null ? code.getParentCodeId().toString() : "");
                    row.createCell(7).setCellValue(nullSafe(code.getExtraValue1()));
                    row.createCell(8).setCellValue(nullSafe(code.getExtraValue2()));
                    row.createCell(9).setCellValue(nullSafe(code.getExtraValue3()));
                    row.createCell(10).setCellValue(
                        code.getEffectiveFrom() != null ? code.getEffectiveFrom().format(DATE_FORMATTER) : "");
                    row.createCell(11).setCellValue(
                        code.getEffectiveTo() != null ? code.getEffectiveTo().format(DATE_FORMATTER) : "");
                    row.createCell(12).setCellValue(
                        code.getSortOrder() != null ? code.getSortOrder() : 0);
                }
            }
            autoSizeColumns(codeSheet, CODE_HEADERS.length);

            return toByteArray(workbook);

        } catch (IOException e) {
            throw new RuntimeException("Excel 엑스포트 중 오류가 발생했습니다", e);
        }
    }

    /**
     * 헤더 스타일 생성 (볼드 폰트)
     */
    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    /**
     * 헤더 행 쓰기
     */
    private void writeHeaderRow(Sheet sheet, String[] headers, CellStyle style) {
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(style);
        }
    }

    /**
     * 열 자동 사이즈 조정
     */
    private void autoSizeColumns(Sheet sheet, int columnCount) {
        for (int i = 0; i < columnCount; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    /**
     * 워크북을 바이트 배열로 변환
     */
    private byte[] toByteArray(XSSFWorkbook workbook) throws IOException {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            workbook.write(out);
            return out.toByteArray();
        }
    }

    /**
     * Excel 행이 비어있는지 확인
     */
    private boolean isEmptyRow(Row row) {
        if (row == null) {
            return true;
        }
        // groupCode (0번 셀)가 비어있으면 빈 행으로 판단
        Cell firstCell = row.getCell(0);
        return firstCell == null || getCellStringValue(firstCell).isEmpty();
    }

    /**
     * 공통코드 행 파싱
     */
    private CodeImportRequest parseCodeRow(Row row) {
        String groupCode = getCellStringValue(row.getCell(0));
        String code = getCellStringValue(row.getCell(1));
        String codeName = getCellStringValue(row.getCell(2));

        if (groupCode.isEmpty() || code.isEmpty() || codeName.isEmpty()) {
            return null;
        }

        // Strip indentation from codeName (hierarchical codes)
        codeName = codeName.stripLeading();

        return CodeImportRequest.builder()
            .groupCode(groupCode)
            .code(code)
            .codeName(codeName)
            .codeNameEn(getCellStringValue(row.getCell(3)))
            .description(getCellStringValue(row.getCell(4)))
            .extraValue1(getCellStringValue(row.getCell(7)))
            .extraValue2(getCellStringValue(row.getCell(8)))
            .extraValue3(getCellStringValue(row.getCell(9)))
            .sortOrder(getCellIntValue(row.getCell(12)))
            .build();
    }

    /**
     * 셀 값을 문자열로 가져오기
     */
    private String getCellStringValue(Cell cell) {
        if (cell == null) {
            return "";
        }
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                // 정수형이면 소수점 없이 반환
                double numVal = cell.getNumericCellValue();
                if (numVal == Math.floor(numVal) && !Double.isInfinite(numVal)) {
                    return String.valueOf((long) numVal);
                }
                return String.valueOf(numVal);
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return cell.getStringCellValue().trim();
                } catch (Exception e) {
                    return String.valueOf(cell.getNumericCellValue());
                }
            case BLANK:
            default:
                return "";
        }
    }

    /**
     * 셀 값을 Integer로 가져오기
     */
    private Integer getCellIntValue(Cell cell) {
        if (cell == null) {
            return null;
        }
        switch (cell.getCellType()) {
            case NUMERIC:
                return (int) cell.getNumericCellValue();
            case STRING:
                String val = cell.getStringCellValue().trim();
                if (val.isEmpty()) {
                    return null;
                }
                try {
                    return Integer.parseInt(val);
                } catch (NumberFormatException e) {
                    return null;
                }
            default:
                return null;
        }
    }

    /**
     * null 안전 문자열 변환
     */
    private String nullSafe(String value) {
        return value != null ? value : "";
    }
}
