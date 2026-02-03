package com.hrsaas.mdm.service.impl;

import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.mdm.domain.dto.request.CreateCodeGroupRequest;
import com.hrsaas.mdm.domain.dto.response.CodeGroupResponse;
import com.hrsaas.mdm.domain.entity.CodeGroup;
import com.hrsaas.mdm.repository.CodeGroupRepository;
import com.hrsaas.mdm.service.CodeGroupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CodeGroupServiceImpl implements CodeGroupService {

    private final CodeGroupRepository codeGroupRepository;

    @Override
    @Transactional
    @CacheEvict(value = "mdm:codeGroup", allEntries = true)
    public CodeGroupResponse create(CreateCodeGroupRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();

        if (codeGroupRepository.existsByGroupCodeAndTenantId(request.getGroupCode(), tenantId)) {
            throw new DuplicateException("MDM_003", "이미 존재하는 그룹 코드입니다: " + request.getGroupCode());
        }

        CodeGroup codeGroup = CodeGroup.builder()
            .tenantId(tenantId)
            .groupCode(request.getGroupCode())
            .groupName(request.getGroupName())
            .description(request.getDescription())
            .sortOrder(request.getSortOrder())
            .build();

        CodeGroup saved = codeGroupRepository.save(codeGroup);
        log.info("Code group created: groupCode={}", saved.getGroupCode());

        return CodeGroupResponse.from(saved);
    }

    @Override
    @Cacheable(value = "mdm:codeGroup", key = "#groupCode")
    public CodeGroupResponse getByGroupCode(String groupCode) {
        UUID tenantId = TenantContext.getCurrentTenant();

        CodeGroup codeGroup = codeGroupRepository.findByGroupCodeAndTenant(groupCode, tenantId)
            .orElseThrow(() -> new NotFoundException("MDM_001", "코드 그룹을 찾을 수 없습니다: " + groupCode));

        return CodeGroupResponse.fromWithCodes(codeGroup);
    }

    @Override
    public List<CodeGroupResponse> getAll() {
        UUID tenantId = TenantContext.getCurrentTenant();

        List<CodeGroup> codeGroups;
        if (tenantId != null) {
            codeGroups = codeGroupRepository.findAllForTenant(tenantId);
        } else {
            codeGroups = codeGroupRepository.findAllSystemCodeGroups();
        }

        return codeGroups.stream()
            .map(CodeGroupResponse::from)
            .toList();
    }

    @Override
    @Transactional
    @CacheEvict(value = "mdm:codeGroup", allEntries = true)
    public void delete(UUID id) {
        CodeGroup codeGroup = codeGroupRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("MDM_001", "코드 그룹을 찾을 수 없습니다: " + id));

        if (codeGroup.isSystemCode()) {
            throw new IllegalStateException("시스템 코드 그룹은 삭제할 수 없습니다.");
        }

        codeGroupRepository.delete(codeGroup);
        log.info("Code group deleted: id={}", id);
    }
}
