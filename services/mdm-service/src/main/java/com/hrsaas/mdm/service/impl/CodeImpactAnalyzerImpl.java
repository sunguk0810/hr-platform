package com.hrsaas.mdm.service.impl;

import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.mdm.domain.dto.response.CodeImpactResponse;
import com.hrsaas.mdm.domain.dto.response.CodeImpactResponse.ImpactedResource;
import com.hrsaas.mdm.domain.entity.CommonCode;
import com.hrsaas.mdm.repository.CodeTenantMappingRepository;
import com.hrsaas.mdm.repository.CommonCodeRepository;
import com.hrsaas.mdm.service.CodeImpactAnalyzer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * 코드 변경 영향도 분석 서비스 구현
 *
 * 분석 기준:
 * - 하위 코드 존재 여부 (계층형 코드)
 * - 테넌트별 커스터마이징 존재 여부
 * - 코드가 참조되는 테이블/서비스 (설정 기반)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CodeImpactAnalyzerImpl implements CodeImpactAnalyzer {

    private final CommonCodeRepository commonCodeRepository;
    private final CodeTenantMappingRepository codeTenantMappingRepository;

    /**
     * 코드 그룹별 참조 테이블 매핑
     * 실제 환경에서는 DB 테이블이나 설정 파일에서 관리
     */
    private static final Map<String, List<ImpactedResource>> CODE_USAGE_MAP = new HashMap<>();

    static {
        // 예시: 휴가 유형 코드가 사용되는 곳
        CODE_USAGE_MAP.put("LEAVE_TYPE", List.of(
            ImpactedResource.builder()
                .resourceType("TABLE")
                .resourceName("leave_request")
                .description("휴가 신청 테이블")
                .build(),
            ImpactedResource.builder()
                .resourceType("TABLE")
                .resourceName("leave_balance")
                .description("휴가 잔여 테이블")
                .build(),
            ImpactedResource.builder()
                .resourceType("SERVICE")
                .resourceName("attendance-service")
                .description("근태 관리 서비스")
                .build()
        ));

        // 직급 코드
        CODE_USAGE_MAP.put("GRADE", List.of(
            ImpactedResource.builder()
                .resourceType("TABLE")
                .resourceName("employee")
                .description("직원 테이블")
                .build(),
            ImpactedResource.builder()
                .resourceType("TABLE")
                .resourceName("employee_history")
                .description("인사이력 테이블")
                .build(),
            ImpactedResource.builder()
                .resourceType("SERVICE")
                .resourceName("employee-service")
                .description("직원 관리 서비스")
                .build()
        ));

        // 직책 코드
        CODE_USAGE_MAP.put("POSITION", List.of(
            ImpactedResource.builder()
                .resourceType("TABLE")
                .resourceName("employee")
                .description("직원 테이블")
                .build(),
            ImpactedResource.builder()
                .resourceType("TABLE")
                .resourceName("approval_line")
                .description("결재선 테이블")
                .build(),
            ImpactedResource.builder()
                .resourceType("SERVICE")
                .resourceName("approval-service")
                .description("결재 서비스")
                .build()
        ));

        // 부서 유형
        CODE_USAGE_MAP.put("DEPT_TYPE", List.of(
            ImpactedResource.builder()
                .resourceType("TABLE")
                .resourceName("department")
                .description("부서 테이블")
                .build(),
            ImpactedResource.builder()
                .resourceType("SERVICE")
                .resourceName("organization-service")
                .description("조직 관리 서비스")
                .build()
        ));
    }

    @Override
    public CodeImpactResponse analyzeImpact(UUID codeId) {
        CommonCode code = findById(codeId);
        return buildImpactResponse(code, "CHANGE");
    }

    @Override
    public CodeImpactResponse analyzeDeletionImpact(UUID codeId) {
        CommonCode code = findById(codeId);
        CodeImpactResponse response = buildImpactResponse(code, "DELETE");

        // 삭제 시 추가 경고
        if (response.getChildCodeCount() > 0) {
            response.addRecommendation("하위 코드가 존재합니다. 삭제 시 하위 코드도 함께 삭제됩니다.");
        }

        if (response.getTenantMappingCount() > 0) {
            response.addRecommendation("테넌트별 커스터마이징이 존재합니다. 삭제 시 커스터마이징 설정이 손실됩니다.");
        }

        // 삭제 영향도는 더 높게 설정
        response.setImpactScore(Math.min(100, response.getImpactScore() + 20));
        response.calculateImpactLevel();

        return response;
    }

    @Override
    public CodeImpactResponse analyzeDeprecationImpact(UUID codeId) {
        CommonCode code = findById(codeId);
        CodeImpactResponse response = buildImpactResponse(code, "DEPRECATE");

        response.addRecommendation("코드 폐기 시 신규 사용이 제한됩니다.");
        response.addRecommendation("기존 데이터는 유지되나, 새로운 레코드에서는 사용할 수 없습니다.");

        if (!response.getImpactedResources().isEmpty()) {
            response.addRecommendation("대체 코드를 지정하고 마이그레이션을 계획하세요.");
        }

        return response;
    }

    @Override
    public boolean canChangeStatus(UUID codeId) {
        CodeImpactResponse impact = analyzeImpact(codeId);
        return impact.getImpactLevel() != CodeImpactResponse.ImpactLevel.CRITICAL;
    }

    @Override
    public boolean canDelete(UUID codeId) {
        CodeImpactResponse impact = analyzeDeletionImpact(codeId);

        // 하위 코드가 있거나 영향도가 HIGH 이상이면 삭제 불가
        if (impact.getChildCodeCount() > 0) {
            return false;
        }

        return impact.getImpactLevel() != CodeImpactResponse.ImpactLevel.CRITICAL;
    }

    private CodeImpactResponse buildImpactResponse(CommonCode code, String action) {
        String groupCode = code.getCodeGroup().getGroupCode();

        CodeImpactResponse response = CodeImpactResponse.builder()
            .codeId(code.getId())
            .groupCode(groupCode)
            .code(code.getCode())
            .codeName(code.getCodeName())
            .build();

        // 하위 코드 수 계산
        int childCount = countChildCodes(code.getId());
        response.setChildCodeCount(childCount);

        // 테넌트 매핑 수 계산
        UUID tenantId = TenantContext.getCurrentTenant();
        int tenantMappingCount = countTenantMappings(code.getId(), tenantId);
        response.setTenantMappingCount(tenantMappingCount);

        // 참조 테이블/서비스 추가
        List<ImpactedResource> impactedResources = CODE_USAGE_MAP.getOrDefault(groupCode, Collections.emptyList());
        for (ImpactedResource resource : impactedResources) {
            response.addImpactedResource(resource);
        }

        // 영향도 점수 계산
        int score = calculateImpactScore(childCount, tenantMappingCount, impactedResources.size());
        response.setImpactScore(score);
        response.calculateImpactLevel();

        // 권장 사항 추가
        addRecommendations(response, action);

        return response;
    }

    private int countChildCodes(UUID parentCodeId) {
        // 재귀적으로 하위 코드 수 계산
        UUID tenantId = TenantContext.getCurrentTenant();
        List<CommonCode> allCodes = commonCodeRepository.findActiveByTenantId(tenantId);

        return (int) allCodes.stream()
            .filter(c -> parentCodeId.equals(c.getParentCodeId()))
            .count();
    }

    private int countTenantMappings(UUID codeId, UUID tenantId) {
        if (tenantId == null) {
            return 0;
        }
        return codeTenantMappingRepository.existsByTenantIdAndCommonCodeId(tenantId, codeId) ? 1 : 0;
    }

    private int calculateImpactScore(int childCount, int tenantMappingCount, int resourceCount) {
        int score = 0;

        // 하위 코드: 각 10점
        score += Math.min(30, childCount * 10);

        // 테넌트 매핑: 각 15점
        score += Math.min(30, tenantMappingCount * 15);

        // 참조 리소스: 각 10점
        score += Math.min(40, resourceCount * 10);

        return Math.min(100, score);
    }

    private void addRecommendations(CodeImpactResponse response, String action) {
        if (response.getImpactScore() >= 75) {
            response.addRecommendation("높은 영향도입니다. 변경 전 충분한 테스트를 권장합니다.");
            response.addRecommendation("관련 팀에 사전 공지가 필요합니다.");
        } else if (response.getImpactScore() >= 50) {
            response.addRecommendation("중간 수준의 영향도입니다. 변경 후 모니터링을 권장합니다.");
        }

        if (!response.getImpactedResources().isEmpty()) {
            response.addRecommendation("영향받는 서비스의 데이터 정합성을 확인하세요.");
        }
    }

    private CommonCode findById(UUID id) {
        return commonCodeRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("MDM_002", "코드를 찾을 수 없습니다: " + id));
    }
}
