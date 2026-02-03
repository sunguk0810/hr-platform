package com.hrsaas.common.privacy;

import java.lang.annotation.*;

/**
 * Annotation to mark fields that should be masked in serialization.
 */
@Target({ElementType.FIELD, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Masked {

    /**
     * Type of masking to apply.
     */
    MaskType type() default MaskType.GENERIC;

    /**
     * Number of visible characters at start/end for GENERIC masking.
     */
    int visibleChars() default 2;
}
