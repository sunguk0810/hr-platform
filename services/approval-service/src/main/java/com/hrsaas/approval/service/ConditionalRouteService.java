package com.hrsaas.approval.service;

import com.hrsaas.approval.domain.entity.ConditionalRoute;
import com.hrsaas.approval.repository.ConditionalRouteRepository;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConditionalRouteService {

    private final ConditionalRouteRepository routeRepository;

    @Transactional
    public ConditionalRoute create(ConditionalRoute route) {
        return routeRepository.save(route);
    }

    public List<ConditionalRoute> getByTemplateId(UUID templateId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return routeRepository.findActiveRoutes(tenantId, templateId);
    }

    public List<ConditionalRoute> getAll() {
        UUID tenantId = TenantContext.getCurrentTenant();
        return routeRepository.findAllByTenantId(tenantId);
    }

    @Transactional
    public void delete(UUID id) {
        routeRepository.deleteById(id);
    }

    /**
     * 조건 분기 평가 - 매칭되는 첫 번째 라우트의 target template ID 반환
     */
    public Optional<UUID> evaluateRoutes(UUID templateId, Map<String, String> conditions) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<ConditionalRoute> routes = routeRepository.findActiveRoutes(tenantId, templateId);

        for (ConditionalRoute route : routes) {
            String fieldValue = conditions.get(route.getConditionField());
            if (fieldValue != null && route.evaluate(fieldValue)) {
                log.debug("Conditional route matched: routeId={}, field={}, value={}, targetTemplate={}",
                    route.getId(), route.getConditionField(), fieldValue, route.getTargetTemplateId());
                return Optional.of(route.getTargetTemplateId());
            }
        }
        return Optional.empty();
    }
}
