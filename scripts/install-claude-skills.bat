@echo off
chcp 65001 >nul 2>&1
setlocal

echo === Agent Skills 일괄 설치 ===
echo.
echo 총 11개 저장소에서 17개 스킬 설치
echo 지원 CLI: Claude Code, Codex, Gemini CLI, Cursor, Windsurf 등
echo.

set SUCCESS=0
set FAILED=0

echo [1/11] vercel-labs/agent-skills (4 skills)
echo   composition-patterns, react-best-practices, react-native-skills, web-design-guidelines
call npx -y skills add vercel-labs/agent-skills
if %ERRORLEVEL% EQU 0 (set /a SUCCESS+=1) else (set /a FAILED+=1)
echo.

echo [2/11] vercel-labs/skills (1 skill)
echo   find-skills
call npx -y skills add vercel-labs/skills
if %ERRORLEVEL% EQU 0 (set /a SUCCESS+=1) else (set /a FAILED+=1)
echo.

echo [3/11] pluginagentmarketplace/custom-plugin-java (1 skill)
echo   java-performance
call npx -y skills add pluginagentmarketplace/custom-plugin-java
if %ERRORLEVEL% EQU 0 (set /a SUCCESS+=1) else (set /a FAILED+=1)
echo.

echo [4/11] sickn33/antigravity-awesome-skills (2 skills)
echo   performance-engineer, documentation-templates
call npx -y skills add sickn33/antigravity-awesome-skills
if %ERRORLEVEL% EQU 0 (set /a SUCCESS+=1) else (set /a FAILED+=1)
echo.

echo [5/11] 404kidwiz/claude-supercode-skills (2 skills)
echo   database-optimizer, frontend-ui-ux-engineer
call npx -y skills add 404kidwiz/claude-supercode-skills
if %ERRORLEVEL% EQU 0 (set /a SUCCESS+=1) else (set /a FAILED+=1)
echo.

echo [6/11] majesteitbart/talentmatcher (1 skill)
echo   shadcn-ui-expert
call npx -y skills add majesteitbart/talentmatcher
if %ERRORLEVEL% EQU 0 (set /a SUCCESS+=1) else (set /a FAILED+=1)
echo.

echo [7/11] refoundai/lenny-skills (1 skill)
echo   writing-prds
call npx -y skills add refoundai/lenny-skills
if %ERRORLEVEL% EQU 0 (set /a SUCCESS+=1) else (set /a FAILED+=1)
echo.

echo [8/11] jamesrochabrun/skills (1 skill)
echo   prd-generator
call npx -y skills add jamesrochabrun/skills
if %ERRORLEVEL% EQU 0 (set /a SUCCESS+=1) else (set /a FAILED+=1)
echo.

echo [9/11] github/awesome-copilot (1 skill)
echo   prd
call npx -y skills add github/awesome-copilot
if %ERRORLEVEL% EQU 0 (set /a SUCCESS+=1) else (set /a FAILED+=1)
echo.

echo [10/11] davila7/claude-code-templates (1 skill)
echo   quality-documentation-manager
call npx -y skills add davila7/claude-code-templates
if %ERRORLEVEL% EQU 0 (set /a SUCCESS+=1) else (set /a FAILED+=1)
echo.

echo [11/11] onewave-ai/claude-skills (1 skill)
echo   technical-writer
call npx -y skills add onewave-ai/claude-skills
if %ERRORLEVEL% EQU 0 (set /a SUCCESS+=1) else (set /a FAILED+=1)
echo.

echo === 설치 완료 ===
echo 성공: %SUCCESS% / 실패: %FAILED% / 총: 11
echo.
echo 설치 확인: npx skills list

endlocal
pause
