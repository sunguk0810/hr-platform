package com.hrsaas.common.core.error;

/**
 * Centralized error code definitions.
 */
public interface ErrorCode {

    // Common errors (CMN_XXX)
    String CMN_001 = "CMN_001"; // Internal server error
    String CMN_002 = "CMN_002"; // Invalid request format
    String CMN_003 = "CMN_003"; // Resource not found
    String CMN_004 = "CMN_004"; // Duplicate resource
    String CMN_005 = "CMN_005"; // Validation failed

    // Authentication errors (AUTH_XXX)
    String AUTH_001 = "AUTH_001"; // Invalid credentials
    String AUTH_002 = "AUTH_002"; // Token expired
    String AUTH_003 = "AUTH_003"; // Token invalid
    String AUTH_004 = "AUTH_004"; // Insufficient permissions
    String AUTH_005 = "AUTH_005"; // Session expired

    // Tenant errors (TNT_XXX)
    String TNT_001 = "TNT_001"; // Tenant not found
    String TNT_002 = "TNT_002"; // Tenant inactive
    String TNT_003 = "TNT_003"; // Tenant access denied
    String TNT_004 = "TNT_004"; // Duplicate tenant code

    // Employee errors (EMP_XXX)
    String EMP_001 = "EMP_001"; // Employee not found
    String EMP_002 = "EMP_002"; // Duplicate employee number
    String EMP_003 = "EMP_003"; // Duplicate email
    String EMP_004 = "EMP_004"; // Invalid employee status

    // Organization errors (ORG_XXX)
    String ORG_001 = "ORG_001"; // Department not found
    String ORG_002 = "ORG_002"; // Invalid hierarchy
    String ORG_003 = "ORG_003"; // Circular reference detected

    // Approval errors (APR_XXX)
    String APR_001 = "APR_001"; // Approval not found
    String APR_002 = "APR_002"; // Invalid state transition
    String APR_003 = "APR_003"; // Not authorized to approve
    String APR_004 = "APR_004"; // Already processed

    // Attendance errors (ATT_XXX)
    String ATT_001 = "ATT_001"; // Leave request not found
    String ATT_002 = "ATT_002"; // Insufficient leave balance
    String ATT_003 = "ATT_003"; // Overlapping leave period

    // MDM errors (MDM_XXX)
    String MDM_001 = "MDM_001"; // Code group not found
    String MDM_002 = "MDM_002"; // Code not found
    String MDM_003 = "MDM_003"; // Duplicate code

    // File errors (FILE_XXX)
    String FILE_001 = "FILE_001"; // File not found
    String FILE_002 = "FILE_002"; // File too large
    String FILE_003 = "FILE_003"; // Invalid file type
    String FILE_004 = "FILE_004"; // Upload failed
}
