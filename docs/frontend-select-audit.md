# Frontend Raw HTML Select Element Audit

**Date**: 2026-02-09
**Purpose**: Comprehensive inventory of raw HTML `<select>` elements for migration to shadcn/ui Select component

## Executive Summary

- **Total Raw `<select>` Elements Found**: 30
- **Files Affected**: 15
- **Migration Priority**: High (consistency, accessibility, UX)

## Why Migrate?

The HR SaaS Platform frontend uses shadcn/ui (built on Radix UI primitives) as the primary component library. While most UI components follow this standard, **30 instances of raw HTML `<select>` elements** bypass the design system, causing:

1. **Styling Inconsistency**: Raw `<select>` has browser-default appearance despite custom classes
2. **Accessibility Issues**: Missing Radix UI's built-in ARIA attributes and keyboard navigation
3. **User Experience Gaps**: Inconsistent interaction patterns across dropdowns
4. **Maintainability Burden**: Duplicated styling logic and manual class management

## Inventory by File

### 1. MDM (Master Data Management) - 6 instances

#### `mdm/pages/CommonCodePage.tsx` - 2 selects
**Lines**: 416-437

**Select 1**: Code Group Filter (Line 416)
```tsx
<select
  value={searchState.groupCode}
  onChange={(e) => setGroupCode(e.target.value)}
  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
>
  <option value="">{t('common.allCodeGroups')}</option>
  {codeGroups.map((group) => (
    <option key={group.id} value={group.groupCode}>
      {group.groupName}
    </option>
  ))}
</select>
```
- **Type**: Filter dropdown
- **Complexity**: Simple - static options from API
- **Context**: Master data code group filtering
- **Migration Pattern**: Filter Select (Priority 1)

**Select 2**: Status Filter (Line 428)
```tsx
<select
  value={searchState.status === null ? '' : searchState.status}
  onChange={(e) => setStatus(e.target.value === '' ? null : e.target.value as 'ACTIVE' | 'INACTIVE' | 'DEPRECATED')}
  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
>
  <option value="">{t('common.allStatus')}</option>
  <option value="ACTIVE">{t('common.statusActive')}</option>
  <option value="INACTIVE">{t('common.statusInactive')}</option>
  <option value="DEPRECATED">{t('common.statusDeprecated')}</option>
</select>
```
- **Type**: Filter dropdown
- **Complexity**: Simple - static options
- **Context**: Status filtering
- **Migration Pattern**: Filter Select (Priority 1)

#### `mdm/pages/CodeGroupPage.tsx` - 1 select
**Line**: 142

```tsx
<select
  value={searchState.status === null ? '' : searchState.status}
  onChange={(e) => setStatus(e.target.value === '' ? null : e.target.value as 'ACTIVE' | 'INACTIVE')}
  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
>
  <option value="">{t('common.allStatus')}</option>
  <option value="ACTIVE">{t('common.statusActive')}</option>
  <option value="INACTIVE">{t('common.statusInactive')}</option>
</select>
```
- **Type**: Filter dropdown
- **Complexity**: Simple
- **Migration Pattern**: Filter Select (Priority 1)

#### `mdm/pages/TenantCodePage.tsx` - 2 selects
**Lines**: 139, 151

**Select 1**: Code Group Filter (Line 139)
- **Type**: Filter dropdown
- **Complexity**: Simple - dynamic options from API
- **Migration Pattern**: Filter Select (Priority 1)

**Select 2**: Status Filter (Line 151)
- **Type**: Filter dropdown
- **Complexity**: Simple - static options
- **Migration Pattern**: Filter Select (Priority 1)

---

### 2. Approval Module - 2 instances

#### `approval/pages/ApprovalListPage.tsx` - 1 select
**Line**: 564-573

```tsx
<select
  value={searchState.type}
  onChange={(e) => setType(e.target.value as ApprovalType | '')}
  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
>
  <option value="">{t('approvalListPage.allTypes')}</option>
  {Object.entries(APPROVAL_TYPE_KEYS).map(([value, key]) => (
    <option key={value} value={value}>{t(key)}</option>
  ))}
</select>
```
- **Type**: Filter dropdown
- **Complexity**: Simple - static options from object keys
- **Context**: Approval document type filtering
- **Migration Pattern**: Filter Select (Priority 1)

#### `approval/components/ApprovalLineBuilder.tsx` - 1 select
**Line**: 300-316

```tsx
<select
  value={step.roleName || ''}
  onChange={(e) =>
    handleUpdateStep(step.id, {
      roleName: e.target.value,
      approverName: e.target.value,
    })
  }
  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
>
  <option value="">{t('role.select')}</option>
  <option value="TEAM_LEADER">{t('role.teamLeader')}</option>
  <option value="DEPARTMENT_HEAD">{t('role.departmentHead')}</option>
  <option value="HR_MANAGER">{t('role.hrManager')}</option>
  <option value="CFO">{t('role.cfo')}</option>
  <option value="CEO">{t('role.ceo')}</option>
</select>
```
- **Type**: Form field select
- **Complexity**: Medium - part of approval line builder form
- **Context**: Role selection in approval workflow
- **Migration Pattern**: Form Select (Priority 2)

---

### 3. Attendance Module - 7 instances

#### `attendance/pages/AttendancePage.tsx` - 3 selects
**Lines**: 182, 318, 537

**Select 1**: Department Filter (Line 182)
- **Type**: Filter dropdown
- **Complexity**: Simple - dynamic options from API
- **Migration Pattern**: Filter Select (Priority 1)

**Select 2**: Status Filter (Line 318)
- **Type**: Filter dropdown
- **Complexity**: Simple - static options
- **Migration Pattern**: Filter Select (Priority 1)

**Select 3**: Type Filter (Line 537)
- **Type**: Filter dropdown
- **Complexity**: Simple - static options
- **Migration Pattern**: Filter Select (Priority 1)

#### `attendance/pages/LeaveRequestPage.tsx` - 4 selects
**Lines**: 639, 649, 807, 817

**Select 1**: Leave Type (Line 639)
- **Type**: Form field select
- **Complexity**: Medium - dynamic options from leave policy API
- **Context**: Leave request form
- **Migration Pattern**: Form Select (Priority 2)

**Select 2**: Start Time (Line 649)
- **Type**: Form field select
- **Complexity**: Simple - time slot options
- **Migration Pattern**: Form Select (Priority 2)

**Select 3**: Leave Type in Edit Dialog (Line 807)
- **Type**: Form field select in dialog
- **Complexity**: Medium - dynamic options
- **Migration Pattern**: Form Select (Priority 2)

**Select 4**: End Time (Line 817)
- **Type**: Form field select
- **Complexity**: Simple - time slot options
- **Migration Pattern**: Form Select (Priority 2)

---

### 4. Certificate Module - 3 instances

#### `certificate/components/CertificateRequestList.tsx` - 2 selects
**Lines**: 54, 66

**Select 1**: Certificate Type Filter (Line 54)
- **Type**: Filter dropdown
- **Complexity**: Simple - static options
- **Migration Pattern**: Filter Select (Priority 1)

**Select 2**: Status Filter (Line 66)
- **Type**: Filter dropdown
- **Complexity**: Simple - static options
- **Migration Pattern**: Filter Select (Priority 1)

#### `certificate/pages/CertificateIssueHistoryPage.tsx` - 1 select
**Line**: 137

**Select 1**: Certificate Type Filter
- **Type**: Filter dropdown
- **Complexity**: Simple
- **Migration Pattern**: Filter Select (Priority 1)

---

### 5. Employee Module - 1 instance

#### `employee/pages/EmployeeListPage.tsx` - 1 select
**Line**: 555

```tsx
<select
  value={searchState.status}
  onChange={(e) => setStatus(e.target.value)}
  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
>
  <option value="">{t('common.allStatus')}</option>
  <option value="ACTIVE">{t('common.statusActive')}</option>
  <option value="INACTIVE">{t('common.statusInactive')}</option>
</select>
```
- **Type**: Filter dropdown
- **Complexity**: Simple
- **Migration Pattern**: Filter Select (Priority 1)

---

### 6. Recruitment Module - 7 instances

#### `recruitment/components/InterviewScheduleForm.tsx` - 2 selects
**Lines**: 138, 178

**Select 1**: Interview Type (Line 138)
- **Type**: Form field select
- **Complexity**: Simple - static options
- **Migration Pattern**: Form Select (Priority 2)

**Select 2**: Interviewer Selection (Line 178)
- **Type**: Form field select
- **Complexity**: Medium - dynamic options from employee API
- **Migration Pattern**: Form Select (Priority 2)

#### `recruitment/components/JobPostingForm.tsx` - 3 selects
**Lines**: 188, 208, 225

**Select 1**: Employment Type (Line 188)
- **Type**: Form field select
- **Complexity**: Simple - static options
- **Migration Pattern**: Form Select (Priority 2)

**Select 2**: Experience Level (Line 208)
- **Type**: Form field select
- **Complexity**: Simple - static options
- **Migration Pattern**: Form Select (Priority 2)

**Select 3**: Education Level (Line 225)
- **Type**: Form field select
- **Complexity**: Simple - static options
- **Migration Pattern**: Form Select (Priority 2)

#### `recruitment/pages/ApplicationDetailPage.tsx` - 2 selects
**Lines**: 270, 314

**Select 1**: Interview Stage (Line 270)
- **Type**: Form field select in dialog
- **Complexity**: Simple - static interview stages
- **Migration Pattern**: Form Select (Priority 2)

**Select 2**: Evaluation Score (Line 314)
- **Type**: Form field select
- **Complexity**: Simple - numeric score options
- **Migration Pattern**: Form Select (Priority 2)

#### `recruitment/pages/ApplicationListPage.tsx` - 2 selects
**Lines**: 138, 353

**Select 1**: Application Status Filter (Line 138)
- **Type**: Filter dropdown
- **Complexity**: Simple - static options
- **Migration Pattern**: Filter Select (Priority 1)

**Select 2**: Job Position Filter (Line 353)
- **Type**: Filter dropdown
- **Complexity**: Simple - dynamic options from job posting API
- **Migration Pattern**: Filter Select (Priority 1)

---

### 7. Organization Module - 1 instance

#### `organization/pages/DepartmentListPage.tsx` - 1 select
**Line**: 510

**Select 1**: Department Type Filter
- **Type**: Filter dropdown
- **Complexity**: Simple - static options
- **Migration Pattern**: Filter Select (Priority 1)

---

### 8. Tenant Module - 1 instance

#### `tenant/pages/TenantListPage.tsx` - 1 select
**Line**: 169

**Select 1**: Subscription Plan Filter
- **Type**: Filter dropdown
- **Complexity**: Simple - static options
- **Migration Pattern**: Filter Select (Priority 1)

---

### 9. Announcement Module - 1 instance

#### `announcement/pages/AnnouncementListPage.tsx` - 1 select
**Line**: 251

**Select 1**: Category/Status Filter
- **Type**: Filter dropdown
- **Complexity**: Simple - static options
- **Migration Pattern**: Filter Select (Priority 1)

---

## Summary by Complexity

### Simple (22 instances) - Priority 1
Static options or straightforward dynamic data, no complex logic:
- All MDM filters (6)
- Approval type filter (1)
- Attendance filters (3)
- Certificate filters (3)
- Employee status filter (1)
- Recruitment filters (2)
- Organization filter (1)
- Tenant filter (1)
- Announcement filter (1)
- DepartmentListPage filter (1)
- ApplicationListPage filters (2)

### Medium (8 instances) - Priority 2
Form-integrated, validation, or conditional rendering:
- ApprovalLineBuilder role select (1)
- LeaveRequestPage leave type & time selects (4)
- InterviewScheduleForm selects (2)
- ApplicationDetailPage selects (2)

### Complex (0 instances)
No complex edge cases found (conditional rendering, nested dependencies, special behaviors)

---

## Migration Priority Plan

### Phase 3-A: Priority 1 - Filter Selects (22 instances)
**Estimated Time**: 4-6 hours

**Why First**:
- Simple state management (search parameters)
- No form validation complexity
- Visual improvement immediately visible
- Low risk of breaking existing logic

**Files to migrate**:
1. `mdm/pages/CommonCodePage.tsx` (2 selects)
2. `mdm/pages/CodeGroupPage.tsx` (1 select)
3. `mdm/pages/TenantCodePage.tsx` (2 selects)
4. `approval/pages/ApprovalListPage.tsx` (1 select)
5. `attendance/pages/AttendancePage.tsx` (3 selects)
6. `certificate/components/CertificateRequestList.tsx` (2 selects)
7. `certificate/pages/CertificateIssueHistoryPage.tsx` (1 select)
8. `employee/pages/EmployeeListPage.tsx` (1 select)
9. `recruitment/pages/ApplicationListPage.tsx` (2 selects)
10. `organization/pages/DepartmentListPage.tsx` (1 select)
11. `tenant/pages/TenantListPage.tsx` (1 select)
12. `announcement/pages/AnnouncementListPage.tsx` (1 select)

### Phase 3-B: Priority 2 - Form Field Selects (8 instances)
**Estimated Time**: 3-4 hours

**Why Second**:
- Integrated with react-hook-form (some cases)
- Requires validation preservation
- More complex state management
- Higher user interaction frequency

**Files to migrate**:
1. `approval/components/ApprovalLineBuilder.tsx` (1 select)
2. `attendance/pages/LeaveRequestPage.tsx` (4 selects)
3. `recruitment/components/InterviewScheduleForm.tsx` (2 selects)
4. `recruitment/components/JobPostingForm.tsx` (3 selects)
5. `recruitment/pages/ApplicationDetailPage.tsx` (2 selects)

---

## Technical Notes

### Event Handler Signature Change
```tsx
// OLD: Raw HTML select
onChange={(e) => setState(e.target.value)}

// NEW: shadcn/ui Select
onValueChange={(value) => setState(value)}
```

### Import Pattern
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
```

### Migration Template (Filter Select)
```tsx
// Before
<select
  value={searchState.status}
  onChange={(e) => setStatus(e.target.value)}
  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
>
  <option value="">{t('common.allStatus')}</option>
  <option value="ACTIVE">{t('common.statusActive')}</option>
</select>

// After
<Select value={searchState.status} onValueChange={setStatus}>
  <SelectTrigger className="h-10 w-[180px]">
    <SelectValue placeholder={t('common.allStatus')} />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="ACTIVE">{t('common.statusActive')}</SelectItem>
  </SelectContent>
</Select>
```

---

## Next Steps

1. ✅ **Phase 1 Complete**: Inventory created (this document)
2. ⏭️ **Phase 2**: Create migration guide with patterns
3. ⏭️ **Phase 3-A**: Migrate Priority 1 filter selects (22 instances)
4. ⏭️ **Phase 3-B**: Migrate Priority 2 form selects (8 instances)
5. ⏭️ **Phase 4**: Verification & testing
6. ⏭️ **Phase 5**: Documentation & ESLint rule

---

**Document Version**: 1.0
**Last Updated**: 2026-02-09
**Author**: Claude Sonnet 4.5
