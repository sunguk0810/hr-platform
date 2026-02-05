#!/usr/bin/env python3
import os

scripts = [
    "00_reset_sample_data.sql",
    "01_tenant_seed.sql",
    "02_tenant_policy_feature.sql",
    "03_mdm_code_groups.sql",
    "04_mdm_common_codes.sql",
    "05_organization_grades_positions.sql",
    "06_organization_departments.sql",
    "07_employee_generator.sql",
    "08_employee_execute.sql",
    "09_employee_details_generator.sql",
    "10_attendance_holidays.sql",
    "11_leave_balance_generator.sql",
    "12_attendance_generator.sql",
    "13_leave_overtime_generator.sql",
    "14_approval_templates.sql",
    "15_approval_generator.sql",
    "16_notification_generator.sql",
    "17_file_generator.sql",
    "18_recruitment_generator.sql",
    "19_appointment_generator.sql",
    "20_certificate_generator.sql",
    "21_auth_login_history_generator.sql"
]

base_dir = "D:/project/2026/hr-platform/scripts/sample-data"
output_file = os.path.join(base_dir, "99_combined_all.sql")

with open(output_file, 'w', encoding='utf-8') as out:
    out.write("-- ============================================================================\n")
    out.write("-- HR SaaS Platform - Combined Sample Data Script for DataGrip\n")
    out.write("-- Expected time: 40-60 minutes for full dataset (~75,000 employees)\n")
    out.write("-- ============================================================================\n\n")

    for script in scripts:
        filepath = os.path.join(base_dir, script)
        if os.path.exists(filepath):
            out.write(f"\n-- ============================================================================\n")
            out.write(f"-- FILE: {script}\n")
            out.write(f"-- ============================================================================\n\n")

            with open(filepath, 'r', encoding='utf-8') as f:
                for line in f:
                    stripped = line.lstrip()
                    if not stripped.startswith("\\"):
                        out.write(line)

print(f"Created: {output_file}")
with open(output_file, 'r', encoding='utf-8') as f:
    lines = sum(1 for _ in f)
print(f"Total lines: {lines}")
