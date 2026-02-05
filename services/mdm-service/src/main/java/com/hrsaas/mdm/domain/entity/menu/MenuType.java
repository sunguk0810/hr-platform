package com.hrsaas.mdm.domain.entity.menu;

/**
 * Types of menu items.
 */
public enum MenuType {
    /**
     * Internal application route
     */
    INTERNAL,

    /**
     * External URL link
     */
    EXTERNAL,

    /**
     * Visual divider between menu sections
     */
    DIVIDER,

    /**
     * Section header (non-clickable)
     */
    HEADER
}
