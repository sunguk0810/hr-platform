package com.hrsaas.mdm.service.impl;

import com.hrsaas.common.cache.CacheNames;
import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.mdm.domain.dto.request.CreateCommonCodeRequest;
import com.hrsaas.mdm.domain.dto.request.UpdateCommonCodeRequest;
import com.hrsaas.mdm.domain.dto.response.CodeTreeResponse;
import com.hrsaas.mdm.domain.dto.response.CommonCodeResponse;
import com.hrsaas.mdm.domain.entity.CodeGroup;
import com.hrsaas.mdm.domain.entity.CommonCode;
import com.hrsaas.mdm.domain.event.CommonCodeCreatedEvent;
import com.hrsaas.mdm.domain.event.CommonCodeUpdatedEvent;
import com.hrsaas.mdm.repository.CodeGroupRepository;
import com.hrsaas.mdm.repository.CommonCodeRepository;
import com.hrsaas.mdm.service.CommonCodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommonCodeServiceImpl implements CommonCodeService {

    private final CommonCodeRepository commonCodeRepository;
    private final CodeGroupRepository codeGroupRepository;
    private final EventPublisher eventPublisher;

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.COMMON_CODE, allEntries = true)
    public CommonCodeResponse create(CreateCommonCodeRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();

        CodeGroup codeGroup = codeGroupRepository.findById(request.getCodeGroupId())
            .orElseThrow(() -> new NotFoundException("MDM_001", "코드 그룹을 찾을 수 없습니다."));

        if (commonCodeRepository.existsByCodeGroupIdAndCodeAndTenantId(
                request.getCodeGroupId(), request.getCode(), tenantId)) {
            throw new DuplicateException("MDM_003", "이미 존재하는 코드입니다: " + request.getCode());
        }

        Integer level = 1;
        if (request.getParentCodeId() != null) {
            CommonCode parentCode = commonCodeRepository.findById(request.getParentCodeId())
                .orElseThrow(() -> new NotFoundException("MDM_002", "상위 코드를 찾을 수 없습니다."));
            level = parentCode.getLevel() + 1;
        }

        CommonCode commonCode = CommonCode.builder()
            .codeGroup(codeGroup)
            .tenantId(tenantId)
            .parentCodeId(request.getParentCodeId())
            .level(level)
            .code(request.getCode())
            .codeName(request.getCodeName())
            .codeNameEn(request.getCodeNameEn())
            .description(request.getDescription())
            .extraValue1(request.getExtraValue1())
            .extraValue2(request.getExtraValue2())
            .extraValue3(request.getExtraValue3())
            .extraJson(request.getExtraJson())
            .defaultCode(request.getDefaultCode() != null && request.getDefaultCode())
            .effectiveFrom(request.getEffectiveFrom())
            .effectiveTo(request.getEffectiveTo())
            .sortOrder(request.getSortOrder())
            .build();

        CommonCode saved = commonCodeRepository.save(commonCode);

        // Publish event
        eventPublisher.publish(CommonCodeCreatedEvent.of(saved));

        log.info("Common code created: groupCode={}, code={}",
                 codeGroup.getGroupCode(), saved.getCode());

        return CommonCodeResponse.from(saved);
    }

    @Override
    @Cacheable(value = CacheNames.COMMON_CODE, key = "'id:' + #id")
    public CommonCodeResponse getById(UUID id) {
        CommonCode code = findById(id);
        return CommonCodeResponse.from(code);
    }

    @Override
    @Cacheable(value = CacheNames.COMMON_CODE, key = "#groupCode")
    public List<CommonCodeResponse> getByGroupCode(String groupCode) {
        UUID tenantId = TenantContext.getCurrentTenant();

        List<CommonCode> codes = commonCodeRepository.findByGroupCode(groupCode, tenantId);

        return codes.stream()
            .map(CommonCodeResponse::from)
            .toList();
    }

    @Override
    @Cacheable(value = CacheNames.COMMON_CODE, key = "#groupCode + ':' + #code")
    public CommonCodeResponse getByGroupAndCode(String groupCode, String code) {
        UUID tenantId = TenantContext.getCurrentTenant();

        CommonCode commonCode = commonCodeRepository.findByGroupAndCode(groupCode, code, tenantId)
            .orElseThrow(() -> new NotFoundException("MDM_002",
                String.format("코드를 찾을 수 없습니다: %s.%s", groupCode, code)));

        return CommonCodeResponse.from(commonCode);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.COMMON_CODE, allEntries = true)
    public CommonCodeResponse update(UUID id, UpdateCommonCodeRequest request) {
        CommonCode commonCode = findById(id);

        commonCode.update(
            request.getCodeName(),
            request.getCodeNameEn(),
            request.getDescription(),
            request.getExtraValue1(),
            request.getExtraValue2(),
            request.getExtraValue3(),
            request.getExtraJson(),
            request.getDefaultCode(),
            request.getEffectiveFrom(),
            request.getEffectiveTo(),
            request.getSortOrder()
        );

        if (request.getStatus() != null) {
            switch (request.getStatus()) {
                case ACTIVE -> commonCode.activate();
                case INACTIVE -> commonCode.deactivate();
                case DEPRECATED -> commonCode.deprecate();
            }
        }

        if (request.getParentCodeId() != null) {
            CommonCode parentCode = commonCodeRepository.findById(request.getParentCodeId())
                .orElseThrow(() -> new NotFoundException("MDM_002", "상위 코드를 찾을 수 없습니다."));
            commonCode.setParent(parentCode);
        }

        CommonCode saved = commonCodeRepository.save(commonCode);

        // Publish event
        eventPublisher.publish(CommonCodeUpdatedEvent.of(saved));

        log.info("Common code updated: id={}", id);
        return CommonCodeResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.COMMON_CODE, allEntries = true)
    public CommonCodeResponse activate(UUID id) {
        CommonCode commonCode = findById(id);
        commonCode.activate();
        CommonCode saved = commonCodeRepository.save(commonCode);
        log.info("Common code activated: id={}", id);
        return CommonCodeResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.COMMON_CODE, allEntries = true)
    public CommonCodeResponse deactivate(UUID id) {
        CommonCode commonCode = findById(id);
        commonCode.deactivate();
        CommonCode saved = commonCodeRepository.save(commonCode);
        log.info("Common code deactivated: id={}", id);
        return CommonCodeResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.COMMON_CODE, allEntries = true)
    public CommonCodeResponse deprecate(UUID id) {
        CommonCode commonCode = findById(id);
        commonCode.deprecate();
        CommonCode saved = commonCodeRepository.save(commonCode);
        log.info("Common code deprecated: id={}", id);
        return CommonCodeResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.COMMON_CODE, allEntries = true)
    public void delete(UUID id) {
        CommonCode commonCode = findById(id);
        commonCodeRepository.delete(commonCode);
        log.info("Common code deleted: id={}", id);
    }

    @Override
    @Cacheable(value = "mdm:codeTree", key = "#groupCode")
    public List<CodeTreeResponse> getCodeTree(String groupCode) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<CommonCode> allCodes = commonCodeRepository.findByGroupCode(groupCode, tenantId);

        // Build tree structure
        Map<UUID, CodeTreeResponse> codeMap = allCodes.stream()
            .collect(Collectors.toMap(CommonCode::getId, CodeTreeResponse::from));

        List<CodeTreeResponse> rootNodes = new ArrayList<>();

        for (CommonCode code : allCodes) {
            CodeTreeResponse node = codeMap.get(code.getId());
            if (code.getParentCodeId() == null) {
                rootNodes.add(node);
            } else {
                CodeTreeResponse parent = codeMap.get(code.getParentCodeId());
                if (parent != null) {
                    parent.addChild(node);
                } else {
                    // Parent not found, treat as root
                    rootNodes.add(node);
                }
            }
        }

        return rootNodes;
    }

    private CommonCode findById(UUID id) {
        return commonCodeRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("MDM_002", "코드를 찾을 수 없습니다: " + id));
    }
}
