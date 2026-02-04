package com.hrsaas.common.privacy;

import java.util.UUID;

/**
 * Thread-local context for privacy-related operations.
 * Used to determine whether masking should be applied based on the viewing context.
 */
public final class PrivacyContext {

    private static final ThreadLocal<UUID> VIEWING_EMPLOYEE_ID = new ThreadLocal<>();
    private static final ThreadLocal<UUID> CURRENT_EMPLOYEE_ID = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> SKIP_MASKING = ThreadLocal.withInitial(() -> false);

    private PrivacyContext() {
        // Utility class
    }

    /**
     * Set the ID of the employee whose data is being viewed.
     */
    public static void setViewingEmployeeId(UUID employeeId) {
        VIEWING_EMPLOYEE_ID.set(employeeId);
    }

    /**
     * Get the ID of the employee whose data is being viewed.
     */
    public static UUID getViewingEmployeeId() {
        return VIEWING_EMPLOYEE_ID.get();
    }

    /**
     * Set the ID of the currently logged-in employee.
     */
    public static void setCurrentEmployeeId(UUID employeeId) {
        CURRENT_EMPLOYEE_ID.set(employeeId);
    }

    /**
     * Get the ID of the currently logged-in employee.
     */
    public static UUID getCurrentEmployeeId() {
        return CURRENT_EMPLOYEE_ID.get();
    }

    /**
     * Check if the current user is viewing their own data.
     * If viewing self, masking should not be applied.
     */
    public static boolean isViewingSelf() {
        UUID currentEmployee = CURRENT_EMPLOYEE_ID.get();
        UUID viewing = VIEWING_EMPLOYEE_ID.get();
        return viewing != null && viewing.equals(currentEmployee);
    }

    /**
     * Set flag to skip masking entirely (e.g., for admin users).
     */
    public static void setSkipMasking(boolean skip) {
        SKIP_MASKING.set(skip);
    }

    /**
     * Check if masking should be skipped.
     */
    public static boolean shouldSkipMasking() {
        return SKIP_MASKING.get();
    }

    /**
     * Check if masking should be applied.
     * Masking is NOT applied if:
     * 1. Skip masking flag is set (admin users)
     * 2. User is viewing their own data
     */
    public static boolean shouldApplyMasking() {
        if (shouldSkipMasking()) {
            return false;
        }
        if (isViewingSelf()) {
            return false;
        }
        return true;
    }

    /**
     * Clear all context data. Should be called after request processing.
     */
    public static void clear() {
        VIEWING_EMPLOYEE_ID.remove();
        CURRENT_EMPLOYEE_ID.remove();
        SKIP_MASKING.remove();
    }
}
