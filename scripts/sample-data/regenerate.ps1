$files = @(
    '00_reset_sample_data.sql',
    '01_tenants.sql',
    '02_mdm_codes.sql',
    '03_mdm_menus.sql',
    '04_organization.sql',
    '05_employees.sql',
    '06_auth.sql',
    '07_attendance.sql',
    '08_approvals.sql',
    '09_org_extras.sql',
    '10_recruitment.sql',
    '11_appointments_certificates.sql',
    '12_notifications_files.sql'
)

$output = "-- PRD 기반 샘플 데이터 v2.0 - 통합 파일`n"
$output += "-- 생성일: $(Get-Date -Format 'yyyy-MM-dd HH:mm')`n"
$output += "-- 실행: psql -h localhost -p 15432 -U hr_saas -d hr_saas -f 99_combined_all.sql`n"

$num = 0
foreach ($f in $files) {
    $num++
    $output += "`n`n-- ================================================`n"
    $output += "-- [$num/13] $f`n"
    $output += "-- ================================================`n"
    $output += Get-Content $f -Raw -Encoding UTF8
}

# UTF-8 without BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText('99_combined_all.sql', $output, $utf8NoBom)
Write-Host "✓ Generated 99_combined_all.sql ($([Math]::Round((Get-Item '99_combined_all.sql').Length / 1KB, 1)) KB)"
