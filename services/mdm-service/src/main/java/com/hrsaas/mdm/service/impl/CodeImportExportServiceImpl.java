package com.hrsaas.mdm.service.impl;

import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.mdm.domain.dto.request.CodeImportBatchRequest;
import com.hrsaas.mdm.domain.dto.request.CodeImportRequest;
import com.hrsaas.mdm.domain.dto.response.CodeExportResponse;
import com.hrsaas.mdm.domain.dto.response.CodeExportResponse.CodeExportData;
import com.hrsaas.mdm.domain.dto.response.CodeExportResponse.CodeGroupExportData;
import com.hrsaas.mdm.domain.dto.response.ImportResultResponse;
import com.hrsaas.mdm.domain.entity.CodeGroup;
import com.hrsaas.mdm.domain.entity.CommonCode;
import com.hrsaas.mdm.repository.CodeGroupRepository;
import com.hrsaas.mdm.repository.CommonCodeRepository;
import com.hrsaas.mdm.service.CodeImportExportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CodeImportExportServiceImpl implements CodeImportExportService {

    private static final String EXPORT_VERSION = "1.0";

    private final CodeGroupRepository codeGroupRepository;
    private final CommonCodeRepository commonCodeRepository;

    @Override
    @Transactional
    @CacheEvict(value = {"mdm:commonCode", "mdm:codeGroup"}, allEntries = true)
    public ImportResultResponse importCodes(CodeImportBatchRequest request) {
        log.info("Starting code import: {} codes, overwrite={}",
                 request.getCodes().size(), request.isOverwrite());

        if (request.isValidateOnly()) {
            return validateImport(request);
        }

        UUID tenantId = TenantContext.getCurrentTenant();
        ImportResultResponse result = ImportResultResponse.builder()
            .totalRequested(request.getCodes().size())
            .importedAt(Instant.now())
            .build();

        // 그룹별로 코드 분류
        Map<String, List<CodeImportRequest>> codesByGroup = request.getCodes().stream()
            .collect(Collectors.groupingBy(CodeImportRequest::getGroupCode));

        int groupsCreated = 0;
        int groupsUpdated = 0;
        int codesCreated = 0;
        int codesUpdated = 0;
        int codesSkipped = 0;

        int rowNumber = 0;
        for (CodeImportRequest codeRequest : request.getCodes()) {
            rowNumber++;

            try {
                // 코드 그룹 찾기 또는 생성
                CodeGroup codeGroup = findOrCreateCodeGroup(
                    codeRequest, tenantId, result, rowNumber);

                if (codeGroup == null) {
                    continue;
                }

                // 기존 코드 확인
                Optional<CommonCode> existingCode = findExistingCode(
                    codeGroup.getId(), codeRequest.getCode(), tenantId);

                if (existingCode.isPresent()) {
                    if (request.isOverwrite()) {
                        // 기존 코드 업데이트
                        updateCommonCode(existingCode.get(), codeRequest);
                        commonCodeRepository.save(existingCode.get());
                        codesUpdated++;
                        log.debug("Code updated: {}.{}", codeRequest.getGroupCode(), codeRequest.getCode());
                    } else {
                        // 덮어쓰기 안함 - 건너뛰기
                        result.addWarning(rowNumber, codeRequest.getGroupCode(),
                            codeRequest.getCode(), "이미 존재하는 코드입니다 (건너뜀)");
                        codesSkipped++;
                    }
                } else {
                    // 새 코드 생성
                    CommonCode newCode = createCommonCode(codeGroup, codeRequest, tenantId);
                    commonCodeRepository.save(newCode);
                    codesCreated++;
                    log.debug("Code created: {}.{}", codeRequest.getGroupCode(), codeRequest.getCode());
                }

            } catch (Exception e) {
                log.error("Error importing code at row {}: {}", rowNumber, e.getMessage());
                result.addError(rowNumber, codeRequest.getGroupCode(),
                    codeRequest.getCode(), "임포트 실패: " + e.getMessage());
            }
        }

        // 그룹 생성/업데이트 카운트
        result.setGroupsCreated(groupsCreated);
        result.setGroupsUpdated(groupsUpdated);
        result.setCodesCreated(codesCreated);
        result.setCodesUpdated(codesUpdated);
        result.setCodesSkipped(codesSkipped);
        result.setSuccess(!result.hasErrors());

        log.info("Code import completed: created={}, updated={}, skipped={}, errors={}",
                 codesCreated, codesUpdated, codesSkipped,
                 result.getErrors() != null ? result.getErrors().size() : 0);

        return result;
    }

    @Override
    public ImportResultResponse validateImport(CodeImportBatchRequest request) {
        log.info("Validating code import: {} codes", request.getCodes().size());

        UUID tenantId = TenantContext.getCurrentTenant();
        ImportResultResponse result = ImportResultResponse.builder()
            .totalRequested(request.getCodes().size())
            .importedAt(Instant.now())
            .build();

        int rowNumber = 0;
        int potentialCreates = 0;
        int potentialUpdates = 0;
        int potentialSkips = 0;

        Set<String> processedCodes = new HashSet<>();

        for (CodeImportRequest codeRequest : request.getCodes()) {
            rowNumber++;

            // 필수 필드 검증
            if (!StringUtils.hasText(codeRequest.getGroupCode())) {
                result.addError(rowNumber, codeRequest.getGroupCode(),
                    codeRequest.getCode(), "코드 그룹 코드가 비어있습니다");
                continue;
            }

            if (!StringUtils.hasText(codeRequest.getCode())) {
                result.addError(rowNumber, codeRequest.getGroupCode(),
                    codeRequest.getCode(), "코드가 비어있습니다");
                continue;
            }

            if (!StringUtils.hasText(codeRequest.getCodeName())) {
                result.addError(rowNumber, codeRequest.getGroupCode(),
                    codeRequest.getCode(), "코드명이 비어있습니다");
                continue;
            }

            // 중복 검사 (요청 내)
            String codeKey = codeRequest.getGroupCode() + "." + codeRequest.getCode();
            if (processedCodes.contains(codeKey)) {
                result.addWarning(rowNumber, codeRequest.getGroupCode(),
                    codeRequest.getCode(), "요청 내 중복된 코드입니다");
                potentialSkips++;
                continue;
            }
            processedCodes.add(codeKey);

            // 기존 코드 확인
            Optional<CodeGroup> existingGroup = codeGroupRepository.findByGroupCodeAndTenant(
                codeRequest.getGroupCode(), tenantId);

            if (existingGroup.isPresent()) {
                Optional<CommonCode> existingCode = findExistingCode(
                    existingGroup.get().getId(), codeRequest.getCode(), tenantId);

                if (existingCode.isPresent()) {
                    if (request.isOverwrite()) {
                        potentialUpdates++;
                    } else {
                        result.addWarning(rowNumber, codeRequest.getGroupCode(),
                            codeRequest.getCode(), "이미 존재하는 코드입니다 (건너뜀 예정)");
                        potentialSkips++;
                    }
                } else {
                    potentialCreates++;
                }
            } else {
                potentialCreates++;
            }
        }

        result.setCodesCreated(potentialCreates);
        result.setCodesUpdated(potentialUpdates);
        result.setCodesSkipped(potentialSkips);
        result.setSuccess(!result.hasErrors());

        log.info("Import validation completed: potential creates={}, updates={}, skips={}, errors={}",
                 potentialCreates, potentialUpdates, potentialSkips,
                 result.getErrors() != null ? result.getErrors().size() : 0);

        return result;
    }

    @Override
    public CodeExportResponse exportAll() {
        log.info("Exporting all codes");

        UUID tenantId = TenantContext.getCurrentTenant();
        List<CodeGroup> groups = codeGroupRepository.findAllForTenant(tenantId);

        return buildExportResponse(groups);
    }

    @Override
    public CodeExportResponse exportByGroups(List<String> groupCodes) {
        log.info("Exporting codes for groups: {}", groupCodes);

        UUID tenantId = TenantContext.getCurrentTenant();
        List<CodeGroup> groups = new ArrayList<>();

        for (String groupCode : groupCodes) {
            codeGroupRepository.findByGroupCodeAndTenant(groupCode, tenantId)
                .ifPresent(groups::add);
        }

        return buildExportResponse(groups);
    }

    @Override
    public CodeExportResponse exportSystemCodes() {
        log.info("Exporting system codes only");

        List<CodeGroup> groups = codeGroupRepository.findAllSystemCodeGroups();

        return buildExportResponse(groups);
    }

    private CodeGroup findOrCreateCodeGroup(CodeImportRequest request, UUID tenantId,
                                             ImportResultResponse result, int rowNumber) {
        Optional<CodeGroup> existing = codeGroupRepository.findByGroupCodeAndTenant(
            request.getGroupCode(), tenantId);

        if (existing.isPresent()) {
            return existing.get();
        }

        // 그룹명이 없으면 에러
        if (!StringUtils.hasText(request.getGroupName())) {
            result.addError(rowNumber, request.getGroupCode(), request.getCode(),
                "새 코드 그룹 생성 시 그룹명이 필요합니다");
            return null;
        }

        // 새 그룹 생성
        CodeGroup newGroup = CodeGroup.builder()
            .tenantId(tenantId)
            .groupCode(request.getGroupCode())
            .groupName(request.getGroupName())
            .description(request.getGroupDescription())
            .system(false)
            .build();

        CodeGroup saved = codeGroupRepository.save(newGroup);
        log.debug("Code group created: {}", request.getGroupCode());

        return saved;
    }

    private Optional<CommonCode> findExistingCode(UUID codeGroupId, String code, UUID tenantId) {
        List<CommonCode> codes = commonCodeRepository.findByCodeGroupId(codeGroupId);
        return codes.stream()
            .filter(c -> c.getCode().equals(code))
            .filter(c -> c.getTenantId() == null || c.getTenantId().equals(tenantId))
            .findFirst();
    }

    private CommonCode createCommonCode(CodeGroup codeGroup, CodeImportRequest request, UUID tenantId) {
        return CommonCode.builder()
            .codeGroup(codeGroup)
            .tenantId(tenantId)
            .code(request.getCode())
            .codeName(request.getCodeName())
            .codeNameEn(request.getCodeNameEn())
            .description(request.getDescription())
            .extraValue1(request.getExtraValue1())
            .extraValue2(request.getExtraValue2())
            .extraValue3(request.getExtraValue3())
            .sortOrder(request.getSortOrder())
            .build();
    }

    private void updateCommonCode(CommonCode code, CodeImportRequest request) {
        code.setCodeName(request.getCodeName());
        code.setCodeNameEn(request.getCodeNameEn());
        code.setDescription(request.getDescription());
        code.setExtraValue1(request.getExtraValue1());
        code.setExtraValue2(request.getExtraValue2());
        code.setExtraValue3(request.getExtraValue3());
        if (request.getSortOrder() != null) {
            code.setSortOrder(request.getSortOrder());
        }
    }

    private CodeExportResponse buildExportResponse(List<CodeGroup> groups) {
        int totalCodes = 0;
        List<CodeGroupExportData> groupDataList = new ArrayList<>();

        for (CodeGroup group : groups) {
            List<CommonCode> codes = commonCodeRepository.findByCodeGroupId(group.getId());
            totalCodes += codes.size();

            List<CodeExportData> codeDataList = codes.stream()
                .map(code -> CodeExportData.builder()
                    .code(code.getCode())
                    .codeName(code.getCodeName())
                    .codeNameEn(code.getCodeNameEn())
                    .description(code.getDescription())
                    .extraValue1(code.getExtraValue1())
                    .extraValue2(code.getExtraValue2())
                    .extraValue3(code.getExtraValue3())
                    .sortOrder(code.getSortOrder())
                    .build())
                .toList();

            CodeGroupExportData groupData = CodeGroupExportData.builder()
                .groupCode(group.getGroupCode())
                .groupName(group.getGroupName())
                .description(group.getDescription())
                .system(group.isSystem())
                .sortOrder(group.getSortOrder())
                .codes(codeDataList)
                .build();

            groupDataList.add(groupData);
        }

        return CodeExportResponse.builder()
            .exportVersion(EXPORT_VERSION)
            .exportedAt(Instant.now())
            .totalGroups(groups.size())
            .totalCodes(totalCodes)
            .groups(groupDataList)
            .build();
    }
}
