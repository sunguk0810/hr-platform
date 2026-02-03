package com.hrsaas.common.tenant;

import java.lang.annotation.*;

/**
 * Annotation to mark methods that require tenant context.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequireTenant {
}
