package com.hrsaas.mdm.service.impl;

import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.mdm.domain.dto.request.CreateCommonCodeRequest;
import com.hrsaas.mdm.domain.dto.response.CommonCodeResponse;
import com.hrsaas.mdm.domain.entity.CodeGroup;
import com.hrsaas.mdm.domain.entity.CommonCode;
import com.hrsaas.mdm.repository.CodeGroupRepository;
import com.hrsaas.mdm.repository.CommonCodeRepository;
import com.hrsaas.mdm.service.CommonCodeService;
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
public class CommonCodeServiceImpl implements CommonCodeService {

    private final CommonCodeRepository commonCodeRepository;
    private final CodeGroupRepository codeGroupRepository;

    @Override
    @Transactional
    @CacheEvict(value = "mdm:commonCode", allEntries = true)
    public CommonCodeResponse create(CreateCommonCodeRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();

        CodeGroup codeGroup = codeGroupRepository.findById(request.getCodeGroupId())
            .orElseThrow(() -> new NotFoundException("MDM_001", "코드 그룹을 찾을 수 없습니다."));

        if (commonCodeRepository.existsByCodeGroupIdAndCodeAndTenantId(
                request.getCodeGroupId(), request.getCode(), tenantId)) {
            throw new DuplicateException("MDM_003", "이미 존재하는 코드입니다: " + request.getCode());
        }

        CommonCode commonCode = CommonCode.builder()
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

        CommonCode saved = commonCodeRepository.save(commonCode);
        log.info("Common code created: groupCode={}, code={}",
                 codeGroup.getGroupCode(), saved.getCode());

        return CommonCodeResponse.from(saved);
    }

    @Override
    @Cacheable(value = "mdm:commonCode", key = "#groupCode")
    public List<CommonCodeResponse> getByGroupCode(String groupCode) {
        UUID tenantId = TenantContext.getCurrentTenant();

        List<CommonCode> codes = commonCodeRepository.findByGroupCode(groupCode, tenantId);

        return codes.stream()
            .map(CommonCodeResponse::from)
            .toList();
    }

    @Override
    @Cacheable(value = "mdm:commonCode", key = "#groupCode + ':' + #code")
    public CommonCodeResponse getByGroupAndCode(String groupCode, String code) {
        UUID tenantId = TenantContext.getCurrentTenant();

        CommonCode commonCode = commonCodeRepository.findByGroupAndCode(groupCode, code, tenantId)
            .orElseThrow(() -> new NotFoundException("MDM_002",
                String.format("코드를 찾을 수 없습니다: %s.%s", groupCode, code)));

        return CommonCodeResponse.from(commonCode);
    }

    @Override
    @Transactional
    @CacheEvict(value = "mdm:commonCode", allEntries = true)
    public CommonCodeResponse activate(UUID id) {
        CommonCode commonCode = findById(id);
        commonCode.activate();
        CommonCode saved = commonCodeRepository.save(commonCode);
        log.info("Common code activated: id={}", id);
        return CommonCodeResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "mdm:commonCode", allEntries = true)
    public CommonCodeResponse deactivate(UUID id) {
        CommonCode commonCode = findById(id);
        commonCode.deactivate();
        CommonCode saved = commonCodeRepository.save(commonCode);
        log.info("Common code deactivated: id={}", id);
        return CommonCodeResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "mdm:commonCode", allEntries = true)
    public void delete(UUID id) {
        CommonCode commonCode = findById(id);
        commonCodeRepository.delete(commonCode);
        log.info("Common code deleted: id={}", id);
    }

    private CommonCode findById(UUID id) {
        return commonCodeRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("MDM_002", "코드를 찾을 수 없습니다: " + id));
    }
}
