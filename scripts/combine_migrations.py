#!/usr/bin/env python3
import os
import glob

base_dir = "D:/project/2026/hr-platform/services"
output_file = "D:/project/2026/hr-platform/scripts/sample-data/00_migrations_combined.sql"

# Define service order and their migrations
# Format: (service_name, migration_files_in_order)
services_migrations = [
    # 1. Tenant service first (base for all)
    ("tenant-service", [
        "V30__create_schema.sql",
        "V31__create_tenant_tables.sql",
        "V32__enable_rls.sql",
        "V33__create_rls_policies.sql",
        "V34__fix_audit_columns_type.sql",
    ]),
    # 2. MDM service (common codes) - skip V11 seed data (will be in sample data)
    ("mdm-service", [
        "V1__create_schema.sql",
        "V2__create_mdm_tables.sql",
        "V3__enable_rls.sql",
        "V4__create_rls_policies.sql",
        "V10__create_menu_tables.sql",
        # "V11__seed_menu_data.sql",  # Skip - included in sample data
        "V12__add_menu_table_defaults.sql",
    ]),
    # 3. Organization service
    ("organization-service", [
        "V20__create_schema.sql",
        "V21__create_organization_tables.sql",
        "V22__enable_rls.sql",
        "V23__create_rls_policies.sql",
        "V24__create_announcement_tables.sql",
        "V25__create_committee_tables.sql",
        "V26__create_headcount_tables.sql",
    ]),
    # 4. Employee service
    ("employee-service", [
        "V1__create_schema.sql",
        "V2__create_employee_tables.sql",
        "V3__enable_rls.sql",
        "V4__create_rls_policies.sql",
        "V5__create_condolence_tables.sql",
        "V6__create_transfer_tables.sql",
        "V7__fix_audit_columns_type.sql",
        "V8__add_resident_number.sql",
        "V9__add_missing_detail_columns.sql",
    ]),
    # 5. Attendance service
    ("attendance-service", [
        "V1__create_schema.sql",
        "V2__create_attendance_tables.sql",
        "V3__enable_rls.sql",
        "V4__create_rls_policies.sql",
        "V5__fix_overtime_request_columns.sql",
    ]),
    # 6. Approval service
    ("approval-service", [
        "V1__create_schema.sql",
        "V2__create_approval_tables.sql",
        "V3__enable_rls.sql",
        "V4__create_rls_policies.sql",
        "V5__fix_approval_history.sql",
    ]),
    # 7. Notification service
    ("notification-service", [
        "V1__create_schema.sql",
        "V2__create_notification_tables.sql",
        "V3__enable_rls.sql",
        "V4__create_rls_policies.sql",
    ]),
    # 8. File service
    ("file-service", [
        "V1__create_schema.sql",
        "V2__create_file_tables.sql",
        "V3__enable_rls.sql",
        "V4__create_rls_policies.sql",
    ]),
    # 9. Recruitment service
    ("recruitment-service", [
        "V1__create_schema.sql",
        "V2__create_tables.sql",
        "V3__enable_rls.sql",
        "V4__create_rls_policies.sql",
        "V5__fix_audit_columns_type.sql",
    ]),
    # 10. Appointment service
    ("appointment-service", [
        "V1__create_schema.sql",
        "V2__create_appointment_tables.sql",
        "V3__enable_rls.sql",
        "V4__create_rls_policies.sql",
    ]),
    # 11. Certificate service
    ("certificate-service", [
        "V1__create_schema.sql",
        "V2__create_certificate_tables.sql",
        "V3__enable_rls.sql",
        "V4__create_rls_policies.sql",
    ]),
    # 12. Auth service
    ("auth-service", [
        "V20__create_schema.sql",
        "V21__create_auth_tables.sql",
    ]),
]

with open(output_file, 'w', encoding='utf-8') as out:
    out.write("-- ============================================================================\n")
    out.write("-- HR SaaS Platform - Combined Migrations for DataGrip\n")
    out.write("-- Run 00_reset_all.sql FIRST if you need to start fresh\n")
    out.write("-- Then run this file to create all tables\n")
    out.write("-- ============================================================================\n\n")

    for service_name, migrations in services_migrations:
        out.write(f"\n-- ============================================================================\n")
        out.write(f"-- SERVICE: {service_name}\n")
        out.write(f"-- ============================================================================\n")

        migration_dir = os.path.join(base_dir, service_name, "src/main/resources/db/migration")

        for migration in migrations:
            filepath = os.path.join(migration_dir, migration)
            if os.path.exists(filepath):
                out.write(f"\n-- {migration}\n")
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Remove psql commands
                    lines = content.split('\n')
                    for line in lines:
                        if not line.strip().startswith('\\'):
                            out.write(line + '\n')
            else:
                out.write(f"\n-- SKIPPED (not found): {migration}\n")

print(f"Created: {output_file}")
with open(output_file, 'r', encoding='utf-8') as f:
    lines = sum(1 for _ in f)
print(f"Total lines: {lines}")
