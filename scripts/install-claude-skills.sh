#!/bin/bash
# Claude Code Skills 일괄 설치 스크립트
# 생성일: 2026-02-10
# 총 17개 스킬

set -e

echo "=== Claude Code Skills 일괄 설치 ==="
echo ""

# Skills 목록 (source -> skill name 매핑)
declare -A SKILLS=(
  # Vercel Labs - Agent Skills (4개)
  ["vercel-labs/agent-skills#composition-patterns"]="vercel-composition-patterns"
  ["vercel-labs/agent-skills#react-best-practices"]="vercel-react-best-practices"
  ["vercel-labs/agent-skills#react-native-skills"]="vercel-react-native-skills"
  ["vercel-labs/agent-skills#web-design-guidelines"]="web-design-guidelines"

  # Vercel Labs - Skills (1개)
  ["vercel-labs/skills#find-skills"]="find-skills"

  # Java/Performance (3개)
  ["pluginagentmarketplace/custom-plugin-java"]="java-performance"
  ["sickn33/antigravity-awesome-skills#performance-engineer"]="performance-engineer"
  ["404kidwiz/claude-supercode-skills#database-optimizer"]="database-optimizer"

  # Frontend (2개)
  ["majesteitbart/talentmatcher#shadcn-ui-expert"]="shadcn-ui-expert"
  ["404kidwiz/claude-supercode-skills#frontend-ui-ux-engineer"]="frontend-ui-ux-engineer"

  # PRD/Documentation (5개)
  ["refoundai/lenny-skills#writing-prds"]="writing-prds"
  ["jamesrochabrun/skills#prd-generator"]="prd-generator"
  ["github/awesome-copilot#prd"]="prd"
  ["davila7/claude-code-templates#quality-documentation-manager"]="quality-documentation-manager"
  ["sickn33/antigravity-awesome-skills#documentation-templates"]="documentation-templates"

  # Technical Writing (1개)
  ["onewave-ai/claude-skills#technical-writer"]="technical-writer"
)

# 설치 명령어 목록
INSTALL_COMMANDS=(
  # Vercel Labs - Agent Skills
  "claude skill add vercel-labs/agent-skills"
  # Vercel Labs - Skills
  "claude skill add vercel-labs/skills"
  # Java Performance
  "claude skill add pluginagentmarketplace/custom-plugin-java"
  # Performance Engineer + Documentation Templates
  "claude skill add sickn33/antigravity-awesome-skills"
  # Database Optimizer + Frontend UI/UX Engineer
  "claude skill add 404kidwiz/claude-supercode-skills"
  # shadcn UI Expert
  "claude skill add majesteitbart/talentmatcher"
  # Writing PRDs
  "claude skill add refoundai/lenny-skills"
  # PRD Generator
  "claude skill add jamesrochabrun/skills"
  # PRD (GitHub Official)
  "claude skill add github/awesome-copilot"
  # Quality Documentation Manager
  "claude skill add davila7/claude-code-templates"
  # Technical Writer
  "claude skill add onewave-ai/claude-skills"
)

echo "설치할 스킬 저장소: ${#INSTALL_COMMANDS[@]}개"
echo ""

# 카테고리별 정리 출력
echo "📦 카테고리별 스킬 목록:"
echo ""
echo "  [Frontend/UI]"
echo "    - shadcn-ui-expert          (majesteitbart/talentmatcher)"
echo "    - frontend-ui-ux-engineer   (404kidwiz/claude-supercode-skills)"
echo "    - vercel-composition-patterns (vercel-labs/agent-skills)"
echo "    - vercel-react-best-practices (vercel-labs/agent-skills)"
echo "    - vercel-react-native-skills  (vercel-labs/agent-skills)"
echo "    - web-design-guidelines       (vercel-labs/agent-skills)"
echo ""
echo "  [Backend/Performance]"
echo "    - java-performance          (pluginagentmarketplace/custom-plugin-java)"
echo "    - performance-engineer      (sickn33/antigravity-awesome-skills)"
echo "    - database-optimizer        (404kidwiz/claude-supercode-skills)"
echo ""
echo "  [PRD/Product]"
echo "    - prd                       (github/awesome-copilot)"
echo "    - prd-generator             (jamesrochabrun/skills)"
echo "    - writing-prds              (refoundai/lenny-skills)"
echo ""
echo "  [Documentation]"
echo "    - technical-writer              (onewave-ai/claude-skills)"
echo "    - documentation-templates       (sickn33/antigravity-awesome-skills)"
echo "    - quality-documentation-manager (davila7/claude-code-templates)"
echo ""
echo "  [Utility]"
echo "    - find-skills               (vercel-labs/skills)"
echo ""

# 설치 실행
echo "=== 설치 시작 ==="
echo ""

for cmd in "${INSTALL_COMMANDS[@]}"; do
  repo=$(echo "$cmd" | awk '{print $NF}')
  echo "▶ Installing from: $repo"
  if $cmd; then
    echo "  ✓ 완료"
  else
    echo "  ✗ 실패 (수동 설치 필요: $cmd)"
  fi
  echo ""
done

echo "=== 설치 완료 ==="
echo ""
echo "설치 확인: claude skill list"
