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

        // 1. Group codes by group code for bulk processing
        Set<String> requestedGroupCodes = request.getCodes().stream()
            .map(CodeImportRequest::getGroupCode)
            .filter(StringUtils::hasText)
            .collect(Collectors.toSet());

        // 2. Fetch existing groups
        List<CodeGroup> existingGroups = Collections.emptyList();
        if (!requestedGroupCodes.isEmpty()) {
            existingGroups = codeGroupRepository.findByGroupCodeInAndTenantId(
                requestedGroupCodes, tenantId);
        }

        Map<String, CodeGroup> groupMap = existingGroups.stream()
            .collect(Collectors.toMap(
                CodeGroup::getGroupCode,
                g -> g,
                (existing, replacement) -> existing.getTenantId() != null ? existing : replacement
            ));

        // 3. Create missing groups
        List<CodeGroup> newGroups = new ArrayList<>();
        Set<String> processedGroupCreates = new HashSet<>();

        // We iterate request to find first valid definition for each missing group
        for (CodeImportRequest req : request.getCodes()) {
            String groupCode = req.getGroupCode();
            if (StringUtils.hasText(groupCode) && !groupMap.containsKey(groupCode) && !processedGroupCreates.contains(groupCode)) {
                // Try to create
                if (StringUtils.hasText(req.getGroupName())) {
                    CodeGroup newGroup = CodeGroup.builder()
                        .tenantId(tenantId)
                        .groupCode(groupCode)
                        .groupName(req.getGroupName())
                        .description(req.getGroupDescription())
                        .system(false)
                        .build();
                    newGroups.add(newGroup);
                    processedGroupCreates.add(groupCode);
                    // Add to map temporarily (will update with ID after save)
                    groupMap.put(groupCode, newGroup);
                }
            }
        }

        // 4. Save new groups to get IDs
        int groupsCreated = 0;
        if (!newGroups.isEmpty()) {
            List<CodeGroup> savedGroups = codeGroupRepository.saveAll(newGroups);
            groupsCreated = savedGroups.size();
            log.info("Created {} new code groups", groupsCreated);
        }

        // 5. Fetch existing codes for all relevant groups
        // Only fetch for groups that actually exist (have ID).
        List<UUID> groupIds = groupMap.values().stream()
            .map(CodeGroup::getId)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        Map<UUID, Map<String, CommonCode>> existingCodesMap = new HashMap<>();

        if (!groupIds.isEmpty()) {
            int batchSize = 500;
            for (int i = 0; i < groupIds.size(); i += batchSize) {
                int end = Math.min(i + batchSize, groupIds.size());
                List<UUID> batchIds = groupIds.subList(i, end);
                List<CommonCode> batchCodes = commonCodeRepository.findByCodeGroupIdIn(batchIds);

                for (CommonCode code : batchCodes) {
                    // Filter by tenant visibility
                    if (code.getTenantId() != null && !code.getTenantId().equals(tenantId)) {
                        continue;
                    }

                    Map<String, CommonCode> codeMap = existingCodesMap.computeIfAbsent(
                        code.getCodeGroup().getId(), k -> new HashMap<>());

                    CommonCode current = codeMap.get(code.getCode());

                    // Priority: Tenant Specific > System (Null)
                    if (current == null) {
                        codeMap.put(code.getCode(), code);
                    } else {
                        boolean currentIsSystem = current.getTenantId() == null;
                        boolean newIsSystem = code.getTenantId() == null;

                        if (currentIsSystem && !newIsSystem) {
                            codeMap.put(code.getCode(), code); // Replace system with tenant override
                        }
                    }
                }
            }
        }

        int codesCreated = 0;
        int codesUpdated = 0;
        int codesSkipped = 0;

        Set<CommonCode> dirtyCodes = Collections.newSetFromMap(new IdentityHashMap<>());

        int rowNumber = 0;
        for (CodeImportRequest codeRequest : request.getCodes()) {
            rowNumber++;

            try {
                CodeGroup codeGroup = groupMap.get(codeRequest.getGroupCode());

                if (codeGroup == null) {
                    result.addError(rowNumber, codeRequest.getGroupCode(),
                        codeRequest.getCode(), "새 코드 그룹 생성 시 그룹명이 필요합니다");
                    continue;
                }

                // Check existing code in map
                Map<String, CommonCode> groupCodes = existingCodesMap.computeIfAbsent(codeGroup.getId(), k -> new HashMap<>());
                CommonCode existingCode = groupCodes.get(codeRequest.getCode());

                // Filter by tenantId logic similar to original findExistingCode
                // Original: filter(c -> c.getTenantId() == null || c.getTenantId().equals(tenantId))
                // My bulk fetch `findByCodeGroupIdIn` returns ALL codes for group?
                // Repo method: `WHERE cc.codeGroup.id IN :codeGroupIds AND cc.active = true`
                // It does NOT filter by tenantId in the query!
                // Wait, `findByCodeGroupIdIn` in `CommonCodeRepository`?
                // `SELECT cc FROM CommonCode cc WHERE cc.codeGroup.id IN :codeGroupIds AND cc.active = true ...`
                // It does NOT filter by tenantId.
                // However, codes in a tenant-specific group (if created by tenant) are tenant-specific?
                // Or are codes global?
                // CodeGroup has `tenantId`.
                // CommonCode has `tenantId`.
                // If CodeGroup is system (tenantId=null), CommonCode can be system or tenant-specific (override)?
                // `findByCodeGroupIdIn` implementation:
                // If I am a tenant, and I use a system group, I might see system codes AND my tenant codes?
                // The original `findExistingCode`:
                // `findByCodeGroupId(codeGroupId)` -> returns ALL codes for group.
                // Then `.filter(c -> c.getTenantId() == null || c.getTenantId().equals(tenantId))`
                // So I must apply this filter in memory too!

                // My map `existingCodesMap` should probably handle this.
                // But wait, if I have System Code "C1" and Tenant Code "C1" (override)?
                // `findExistingCode` uses `findFirst()`.
                // Which one comes first? Repository returns `ORDER BY cc.sortOrder ASC`.
                // It doesn't guarantee order between system and tenant code if they have same sort order?
                // Usually tenant override should take precedence?
                // `findExistingCode` implementation:
                /*
                List<CommonCode> codes = commonCodeRepository.findByCodeGroupId(codeGroupId);
                return codes.stream()
                    .filter(c -> c.getCode().equals(code))
                    .filter(c -> c.getTenantId() == null || c.getTenantId().equals(tenantId))
                    .findFirst();
                */
                // If both exist, `findFirst` returns the first one in list.
                // If both exist, that's an issue in data?
                // Assuming only one active code per code value effective for a tenant?
                // But let's stick to the logic: I need to pick the "effective" code.
                // If I put ALL codes in `groupCodes` map (String -> CommonCode), I might overwrite System code with Tenant code?
                // If I process batchCodes, I should respect the same filtering logic.

                // Refinement for Step 5:
                // When populating `existingCodesMap`:
                // Iterate `batchCodes`. Filter relevant ones.
                // If multiple match (System & Tenant), which one do we keep in map?
                // The map key is `codeString`.
                // If I have both, which one does `findFirst` return?
                // Original `findByCodeGroupId` orders by `sortOrder`.
                // If sortOrder is same, arbitrary order.
                // Assuming we want the Tenant one if it exists? Or System?
                // If I assume uniqueness of (GroupId, Code, TenantId), then for a given Tenant,
                // there might be (GroupId, Code, Null) and (GroupId, Code, TenantId).
                // If I am Tenant T1.
                // I see System Code S1.
                // I see Tenant Code T1-S1 (override).
                // `findExistingCode` returns the first one.
                // My map needs to store the one that `findExistingCode` would return.

                // Let's refine the population of `existingCodesMap`.
                // We fetch all codes.
                // For a given (Group, Code), we might have multiple candidates.
                // We filter candidates by `tenantId`.
                // We pick the "first" one.

                // Actually, inside the loop I can check more carefully if I store a List?
                // `Map<UUID, Map<String, List<CommonCode>>>`.

                if (existingCode != null) {
                    // Check if it's the right tenant (already handled if I filter correctly during map population)
                    // ...

                    if (request.isOverwrite()) {
                        // Update
                        updateCommonCode(existingCode, codeRequest);
                        dirtyCodes.add(existingCode);
                        codesUpdated++;
                        log.debug("Code updated: {}.{}", codeRequest.getGroupCode(), codeRequest.getCode());
                    } else {
                        // Skip
                        result.addWarning(rowNumber, codeRequest.getGroupCode(),
                            codeRequest.getCode(), "이미 존재하는 코드입니다 (건너뜀)");
                        codesSkipped++;
                    }
                } else {
                    // Create new
                    CommonCode newCode = createCommonCode(codeGroup, codeRequest, tenantId);

                    // Add to map
                    groupCodes.put(codeRequest.getCode(), newCode);
                    dirtyCodes.add(newCode);
                    codesCreated++;
                    log.debug("Code created: {}.{}", codeRequest.getGroupCode(), codeRequest.getCode());
                }

            } catch (Exception e) {
                log.error("Error importing code at row {}: {}", rowNumber, e.getMessage());
                result.addError(rowNumber, codeRequest.getGroupCode(),
                    codeRequest.getCode(), "임포트 실패: " + e.getMessage());
            }
        }

        // Save dirty codes
        if (!dirtyCodes.isEmpty()) {
            commonCodeRepository.saveAll(dirtyCodes);
        }

        result.setGroupsCreated(groupsCreated);
        result.setGroupsUpdated(0);
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

    // findOrCreateCodeGroup and findExistingCode are replaced by inline bulk logic in importCodes
    // But kept here if needed by other methods (validateImport uses them!)
    // So I must keep them.

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

        // Optimization: Fetch all codes for the groups in batches to avoid N+1 query
        List<UUID> allGroupIds = groups.stream()
            .map(CodeGroup::getId)
            .collect(Collectors.toList());

        Map<UUID, List<CommonCode>> codesByGroupId = new HashMap<>();
        int batchSize = 1000;

        for (int i = 0; i < allGroupIds.size(); i += batchSize) {
            int end = Math.min(i + batchSize, allGroupIds.size());
            List<UUID> batchIds = allGroupIds.subList(i, end);

            if (!batchIds.isEmpty()) {
                List<CommonCode> batchCodes = commonCodeRepository.findByCodeGroupIdIn(batchIds);
                for (CommonCode code : batchCodes) {
                    codesByGroupId.computeIfAbsent(code.getCodeGroup().getId(), k -> new ArrayList<>())
                        .add(code);
                }
            }
        }

        for (CodeGroup group : groups) {
            List<CommonCode> codes = codesByGroupId.getOrDefault(group.getId(), Collections.emptyList());
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
