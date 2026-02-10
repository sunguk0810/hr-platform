# Deprecated Scripts

⚠️ **DO NOT USE THESE SCRIPTS**

These scripts have been superseded by newer, more feature-rich versions.

---

## Deprecated Files

### `start-local.sh` / `start-local.bat`
**Status**: Deprecated (2026-02-10)

**Replaced by**: `start-services.ps1` / `start-services.bat`

**Why deprecated**:
- Limited functionality (infrastructure only)
- No dev mode support (hot reload)
- No resource limit support
- Hardcoded wait times instead of health checks

**Migration**:
```bash
# Old way
./scripts/start-local.sh

# New way
.\scripts\start-services.ps1 -DevMode
```

---

### `stop-local.sh` / `stop-local.bat`
**Status**: Deprecated (2026-02-10)

**Replaced by**: `stop-services.ps1` / `stop-services.bat`

**Why deprecated**:
- Limited functionality
- No volume cleanup option
- Less informative output

**Migration**:
```bash
# Old way
./scripts/stop-local.sh

# New way
.\scripts\stop-services.ps1
```

---

## Why Keep Deprecated Scripts?

These files are kept in the `deprecated/` folder for:
1. **Reference** - Understanding the evolution of tooling
2. **Compatibility** - Temporary compatibility period
3. **Migration** - Helps teams migrate to new scripts

**Removal Timeline**: These files will be permanently deleted in **March 2026**.

---

## Migration Guide

If you have documentation or CI/CD pipelines referencing these scripts:

### Update Scripts

| Old Script | New Script | Notes |
|------------|------------|-------|
| `scripts/start-local.sh` | `scripts/start-services.ps1` | Add `-DevMode` for hot reload |
| `scripts/stop-local.sh` | `scripts/stop-services.ps1` | Add `-Down` to remove volumes |

### Update Documentation

Search for references in:
- README files
- Onboarding guides
- CI/CD pipeline configs
- Team wiki/documentation

### Update CI/CD

```yaml
# Old
- name: Start services
  run: ./scripts/start-local.sh

# New
- name: Start services
  run: |
    pwsh -File ./scripts/start-services.ps1 -NoBuild
```

---

For questions, see `scripts/README.md` or ask the DevOps team.
