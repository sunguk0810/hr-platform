# Claude Code Skills 일괄 설치 스크립트 (PowerShell)
# 생성일: 2026-02-10
# 총 17개 스킬 (11개 저장소)

Write-Host "=== Claude Code Skills 일괄 설치 ===" -ForegroundColor Cyan
Write-Host ""

# 저장소별 설치 명령어
$repos = @(
    @{ Name = "vercel-labs/agent-skills";             Skills = "composition-patterns, react-best-practices, react-native-skills, web-design-guidelines" }
    @{ Name = "vercel-labs/skills";                    Skills = "find-skills" }
    @{ Name = "pluginagentmarketplace/custom-plugin-java"; Skills = "java-performance" }
    @{ Name = "sickn33/antigravity-awesome-skills";    Skills = "performance-engineer, documentation-templates" }
    @{ Name = "404kidwiz/claude-supercode-skills";     Skills = "database-optimizer, frontend-ui-ux-engineer" }
    @{ Name = "majesteitbart/talentmatcher";           Skills = "shadcn-ui-expert" }
    @{ Name = "refoundai/lenny-skills";                Skills = "writing-prds" }
    @{ Name = "jamesrochabrun/skills";                 Skills = "prd-generator" }
    @{ Name = "github/awesome-copilot";                Skills = "prd" }
    @{ Name = "davila7/claude-code-templates";         Skills = "quality-documentation-manager" }
    @{ Name = "onewave-ai/claude-skills";              Skills = "technical-writer" }
)

Write-Host "카테고리별 스킬 목록:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  [Frontend/UI]" -ForegroundColor Green
Write-Host "    - shadcn-ui-expert, frontend-ui-ux-engineer"
Write-Host "    - vercel-composition-patterns, vercel-react-best-practices"
Write-Host "    - vercel-react-native-skills, web-design-guidelines"
Write-Host ""
Write-Host "  [Backend/Performance]" -ForegroundColor Green
Write-Host "    - java-performance, performance-engineer, database-optimizer"
Write-Host ""
Write-Host "  [PRD/Product]" -ForegroundColor Green
Write-Host "    - prd, prd-generator, writing-prds"
Write-Host ""
Write-Host "  [Documentation]" -ForegroundColor Green
Write-Host "    - technical-writer, documentation-templates, quality-documentation-manager"
Write-Host ""
Write-Host "  [Utility]" -ForegroundColor Green
Write-Host "    - find-skills"
Write-Host ""

Write-Host "=== 설치 시작 ($($repos.Count)개 저장소) ===" -ForegroundColor Cyan
Write-Host ""

$success = 0
$failed = 0

foreach ($repo in $repos) {
    Write-Host "▶ Installing from: $($repo.Name)" -ForegroundColor White
    Write-Host "  Skills: $($repo.Skills)" -ForegroundColor DarkGray

    try {
        claude skill add $repo.Name
        Write-Host "  ✓ 완료" -ForegroundColor Green
        $success++
    }
    catch {
        Write-Host "  ✗ 실패: $_" -ForegroundColor Red
        $failed++
    }
    Write-Host ""
}

Write-Host "=== 설치 완료 ===" -ForegroundColor Cyan
Write-Host "성공: $success / 실패: $failed / 총: $($repos.Count)" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
Write-Host ""
Write-Host "설치 확인: claude skill list" -ForegroundColor DarkGray
