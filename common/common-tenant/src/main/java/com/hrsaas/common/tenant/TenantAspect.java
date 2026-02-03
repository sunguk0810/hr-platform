package com.hrsaas.common.tenant;

import com.hrsaas.common.core.exception.ForbiddenException;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

/**
 * Aspect to verify tenant context is set before service method execution.
 */
@Slf4j
@Aspect
@Component
public class TenantAspect {

    @Around("@annotation(requireTenant)")
    public Object verifyTenant(ProceedingJoinPoint joinPoint, RequireTenant requireTenant) throws Throwable {
        if (!TenantContext.hasTenant()) {
            log.error("Tenant context not set for method: {}", joinPoint.getSignature().getName());
            throw new ForbiddenException("TNT_003", "테넌트 컨텍스트가 설정되지 않았습니다.");
        }

        return joinPoint.proceed();
    }
}
