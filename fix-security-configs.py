#!/usr/bin/env python3
"""
Fix SecurityConfig files to prevent 403 Forbidden errors.
Adds FilterRegistrationBean and requireExplicitSave configuration.
"""

import re
from pathlib import Path

# Services to fix (excluding auth-service which is already fixed)
SERVICES = [
    "tenant-service",
    "organization-service",
    "employee-service",
    "attendance-service",
    "approval-service",
    "mdm-service",
    "notification-service",
    "file-service",
    "appointment-service",
    "certificate-service",
    "recruitment-service"
]

def fix_security_config(file_path):
    """Fix a SecurityConfig.java file."""
    print(f"Processing: {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if already fixed
    if 'FilterRegistrationBean' in content and 'requireExplicitSave' in content:
        print(f"  ✓ Already fixed, skipping")
        return False

    # 1. Add FilterRegistrationBean import
    if 'import org.springframework.boot.web.servlet.FilterRegistrationBean;' not in content:
        # Find the import section and add after other springframework imports
        import_pattern = r'(import org\.springframework\.context\.annotation\.Configuration;)'
        replacement = r'\1\nimport org.springframework.boot.web.servlet.FilterRegistrationBean;'
        content = re.sub(import_pattern, replacement, content)

    # 2. Add FilterRegistrationBean @Bean method after securityFilter() bean
    if 'securityFilterRegistration' not in content:
        # Find securityFilter() bean and add FilterRegistrationBean after it
        bean_pattern = r'(    @Bean\n    public SecurityFilter securityFilter\(\) \{[^}]+\})'
        replacement = r'''\1

    @Bean
    public FilterRegistrationBean<SecurityFilter> securityFilterRegistration(SecurityFilter securityFilter) {
        FilterRegistrationBean<SecurityFilter> registration = new FilterRegistrationBean<>(securityFilter);
        registration.setEnabled(false); // Prevent automatic servlet filter registration
        return registration;
    }'''
        content = re.sub(bean_pattern, replacement, content, flags=re.MULTILINE)

    # 3. Add requireExplicitSave(true) if not present
    if 'requireExplicitSave' not in content:
        # Find sessionManagement and add securityContext after it
        session_pattern = r'(            \.sessionManagement\(session ->\n                session\.sessionCreationPolicy\(SessionCreationPolicy\.STATELESS\)\))'
        replacement = r'''\1
            .securityContext(context -> context
                .requireExplicitSave(true))'''
        content = re.sub(session_pattern, replacement, content, flags=re.MULTILINE)

    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  ✓ Fixed")
    return True

def main():
    """Main function."""
    base_path = Path(__file__).parent / "services"

    fixed_count = 0
    for service in SERVICES:
        config_file = base_path / service / "src/main/java/com/hrsaas" / service.replace("-service", "") / "config/SecurityConfig.java"

        if config_file.exists():
            if fix_security_config(config_file):
                fixed_count += 1
        else:
            print(f"Warning: {config_file} not found")

    print(f"\n✓ Fixed {fixed_count} SecurityConfig files")

if __name__ == "__main__":
    main()
