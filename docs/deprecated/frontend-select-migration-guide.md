# shadcn/ui Select Migration Guide

**Date**: 2026-02-09
**Purpose**: Comprehensive guide for migrating raw HTML `<select>` elements to shadcn/ui Select components

## Table of Contents

1. [Overview](#overview)
2. [shadcn/ui Select Component API](#shadcnui-select-component-api)
3. [Migration Patterns](#migration-patterns)
4. [Reusable Components](#reusable-components)
5. [Common Pitfalls](#common-pitfalls)
6. [Testing Strategy](#testing-strategy)

---

## Overview

### Why Migrate?

shadcn/ui Select (built on Radix UI primitives) provides:

1. **Accessibility**: Built-in ARIA attributes, screen reader support, focus management
2. **Keyboard Navigation**: Arrow keys, type-ahead search, Enter/Escape shortcuts
3. **Consistent Styling**: Matches design system, supports dark mode
4. **Better UX**: Portal-based dropdown (no z-index conflicts), smooth animations
5. **Mobile-Friendly**: Touch-optimized, bottom sheet behavior on mobile

### What Changes?

| Aspect | Raw HTML `<select>` | shadcn/ui `<Select>` |
|--------|---------------------|----------------------|
| Event Handler | `onChange={(e) => setState(e.target.value)}` | `onValueChange={setState}` |
| Options | `<option value="...">` | `<SelectItem value="...">` |
| Placeholder | First `<option>` with empty value | `<SelectValue placeholder="...">` |
| Default Value | `value=""` | `value={undefined}` or omit placeholder |
| Styling | Manual className | Built-in via `SelectTrigger` |
| Grouping | `<optgroup>` | `<SelectGroup>` + `<SelectLabel>` |

---

## shadcn/ui Select Component API

### Basic Structure

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### Component Breakdown

#### `<Select>` (Container)
- **Props**: `value`, `onValueChange`, `defaultValue`, `disabled`, `name`, `required`, `open`, `onOpenChange`
- **Purpose**: Top-level wrapper, manages state

#### `<SelectTrigger>` (Button)
- **Props**: `className`, `asChild`, `disabled`
- **Purpose**: The clickable button that opens the dropdown
- **Styling**: Use Tailwind classes for width, height, etc.

#### `<SelectValue>` (Placeholder Display)
- **Props**: `placeholder`, `className`, `asChild`
- **Purpose**: Shows selected value or placeholder text
- **Note**: Automatically renders selected item's children

#### `<SelectContent>` (Dropdown Portal)
- **Props**: `className`, `position`, `sideOffset`, `alignOffset`
- **Purpose**: The dropdown menu (rendered in a portal)
- **Behavior**: Automatically positions to avoid viewport edges

#### `<SelectItem>` (Option)
- **Props**: `value` (required), `disabled`, `className`, `textValue`
- **Purpose**: Individual selectable option
- **Children**: Can contain icons, badges, or complex layouts

#### `<SelectGroup>` & `<SelectLabel>` (Grouping)
- **Purpose**: Group related options with a non-selectable label
- **Usage**:
  ```tsx
  <SelectGroup>
    <SelectLabel>Group Name</SelectLabel>
    <SelectItem value="item1">Item 1</SelectItem>
    <SelectItem value="item2">Item 2</SelectItem>
  </SelectGroup>
  ```

#### `<SelectSeparator>` (Divider)
- **Purpose**: Visual separator between groups

---

## Migration Patterns

### Pattern A: Simple Filter Select

**Use Case**: Static or few options, search parameter binding

**Before (Raw HTML)**:
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

**After (shadcn/ui Select)**:
```tsx
<Select value={searchState.status} onValueChange={setStatus}>
  <SelectTrigger className="h-10 w-[180px]">
    <SelectValue placeholder={t('common.allStatus')} />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="ACTIVE">{t('common.statusActive')}</SelectItem>
    <SelectItem value="INACTIVE">{t('common.statusInactive')}</SelectItem>
  </SelectContent>
</Select>
```

**Key Changes**:
1. `onChange` → `onValueChange` (direct value, no event object)
2. Remove empty `<option>` → Use `placeholder` prop
3. `<option>` → `<SelectItem>`
4. Add explicit `width` to `SelectTrigger` (no auto-sizing)

**Edge Case**: Nullable values (e.g., "All" option)
```tsx
// If you need to support null/undefined for "All" filter
<Select
  value={searchState.status ?? ''}
  onValueChange={(value) => setStatus(value === '' ? null : value)}
>
  <SelectTrigger className="h-10 w-[180px]">
    <SelectValue placeholder={t('common.allStatus')} />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="">{t('common.allStatus')}</SelectItem>
    <SelectItem value="ACTIVE">{t('common.statusActive')}</SelectItem>
  </SelectContent>
</Select>
```

---

### Pattern B: Dynamic Data Select

**Use Case**: Options from query/API, loading states

**Before (Raw HTML)**:
```tsx
<select
  value={searchState.groupCode}
  onChange={(e) => setGroupCode(e.target.value)}
  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
>
  <option value="">{t('common.allCodeGroups')}</option>
  {codeGroups.map((group) => (
    <option key={group.id} value={group.groupCode}>
      {group.groupName}
    </option>
  ))}
</select>
```

**After (shadcn/ui Select)**:
```tsx
<Select value={searchState.groupCode} onValueChange={setGroupCode}>
  <SelectTrigger className="h-10 w-[220px]">
    <SelectValue placeholder={t('common.allCodeGroups')} />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="">{t('common.allCodeGroups')}</SelectItem>
    {codeGroups.map((group) => (
      <SelectItem key={group.id} value={group.groupCode}>
        {group.groupName}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**With Loading State**:
```tsx
<Select value={searchState.groupCode} onValueChange={setGroupCode} disabled={isLoading}>
  <SelectTrigger className="h-10 w-[220px]">
    {isLoading ? (
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
      </div>
    ) : (
      <SelectValue placeholder={t('common.allCodeGroups')} />
    )}
  </SelectTrigger>
  <SelectContent>
    {!isLoading && (
      <>
        <SelectItem value="">{t('common.allCodeGroups')}</SelectItem>
        {codeGroups.map((group) => (
          <SelectItem key={group.id} value={group.groupCode}>
            {group.groupName}
          </SelectItem>
        ))}
      </>
    )}
  </SelectContent>
</Select>
```

---

### Pattern C: Form Field Select

**Use Case**: Integrated with react-hook-form, validation

**Before (Raw HTML)**:
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
  <option value="HR_MANAGER">{t('role.hrManager')}</option>
</select>
```

**After (shadcn/ui Select without react-hook-form)**:
```tsx
<Select
  value={step.roleName || ''}
  onValueChange={(value) =>
    handleUpdateStep(step.id, {
      roleName: value,
      approverName: value,
    })
  }
>
  <SelectTrigger className="h-9 w-full">
    <SelectValue placeholder={t('role.select')} />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="TEAM_LEADER">{t('role.teamLeader')}</SelectItem>
    <SelectItem value="HR_MANAGER">{t('role.hrManager')}</SelectItem>
  </SelectContent>
</Select>
```

**After (shadcn/ui Select with react-hook-form)**:
```tsx
import { Controller } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

// Inside form component
<FormField
  control={form.control}
  name="roleName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>{t('role.label')}</FormLabel>
      <FormControl>
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder={t('role.select')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TEAM_LEADER">{t('role.teamLeader')}</SelectItem>
            <SelectItem value="HR_MANAGER">{t('role.hrManager')}</SelectItem>
          </SelectContent>
        </Select>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Validation Example (Zod)**:
```tsx
import { z } from 'zod';

const formSchema = z.object({
  roleName: z.string().min(1, { message: t('validation.roleRequired') }),
});

// In component
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    roleName: '',
  },
});
```

---

### Pattern D: Grouped Select

**Use Case**: Options organized by category

**Before (Raw HTML)**:
```tsx
<select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
  <optgroup label="Asia">
    <option value="KR">South Korea</option>
    <option value="JP">Japan</option>
  </optgroup>
  <optgroup label="Europe">
    <option value="UK">United Kingdom</option>
    <option value="FR">France</option>
  </optgroup>
</select>
```

**After (shadcn/ui Select)**:
```tsx
<Select value={selectedCountry} onValueChange={setSelectedCountry}>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder={t('selectCountry')} />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>{t('regions.asia')}</SelectLabel>
      <SelectItem value="KR">South Korea</SelectItem>
      <SelectItem value="JP">Japan</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>{t('regions.europe')}</SelectLabel>
      <SelectItem value="UK">United Kingdom</SelectItem>
      <SelectItem value="FR">France</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

---

## Reusable Components

### FilterSelect Component

**Purpose**: Standardized filter dropdown for search/filter scenarios

**File**: `frontend/apps/web/src/components/common/FilterSelect.tsx`

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface FilterSelectOption {
  value: string;
  label: string;
}

export interface FilterSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: FilterSelectOption[];
  placeholder: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
}

export function FilterSelect({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  triggerClassName = 'h-10 w-[180px]',
  contentClassName,
  disabled = false,
}: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

**Usage**:
```tsx
import { FilterSelect } from '@/components/common/FilterSelect';

<FilterSelect
  value={searchState.status}
  onValueChange={setStatus}
  placeholder={t('common.allStatus')}
  options={[
    { value: 'ACTIVE', label: t('common.statusActive') },
    { value: 'INACTIVE', label: t('common.statusInactive') },
  ]}
/>
```

---

### FormSelect Component

**Purpose**: Integrated with react-hook-form for consistent form field styling

**File**: `frontend/apps/web/src/components/common/FormSelect.tsx`

```tsx
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';

export interface FormSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FormSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  placeholder: string;
  options: FormSelectOption[];
  description?: string;
  disabled?: boolean;
  required?: boolean;
  triggerClassName?: string;
}

export function FormSelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label,
  placeholder,
  options,
  description,
  disabled = false,
  required = false,
  triggerClassName = 'w-full',
}: FormSelectProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SelectTrigger className={triggerClassName}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
```

**Usage**:
```tsx
import { FormSelect } from '@/components/common/FormSelect';
import { useForm } from 'react-hook-form';

const form = useForm({
  defaultValues: {
    roleName: '',
  },
});

<FormSelect
  control={form.control}
  name="roleName"
  label={t('role.label')}
  placeholder={t('role.select')}
  options={[
    { value: 'TEAM_LEADER', label: t('role.teamLeader') },
    { value: 'HR_MANAGER', label: t('role.hrManager') },
  ]}
  required
/>
```

---

## Common Pitfalls

### 1. Empty String vs Undefined for "All" Filter

**Problem**: shadcn/ui Select treats empty string `""` differently than undefined

**Solution**: Use explicit empty string value for "All" option
```tsx
// ✅ Correct
<SelectItem value="">{t('common.all')}</SelectItem>

// ❌ Incorrect (will not show "All" in trigger)
<SelectValue placeholder={t('common.all')} />
```

---

### 2. Width Not Set on SelectTrigger

**Problem**: SelectTrigger doesn't auto-size like native `<select>`

**Solution**: Always set explicit width
```tsx
// ✅ Correct
<SelectTrigger className="w-[180px]">

// ❌ Incorrect (too narrow)
<SelectTrigger>
```

---

### 3. Forgetting to Remove Event Object Access

**Problem**: `onChange` gives event object, `onValueChange` gives value directly

**Solution**: Update handler signature
```tsx
// ❌ Before (will cause error)
<Select onValueChange={(e) => setState(e.target.value)}>

// ✅ After
<Select onValueChange={setState}>
```

---

### 4. Portal z-index Conflicts

**Problem**: SelectContent renders in portal, may have z-index issues in modals/dialogs

**Solution**: Use `position` prop or adjust z-index
```tsx
// Inside a modal with z-50
<SelectContent className="z-[51]">
  {/* items */}
</SelectContent>
```

---

### 5. Type Coercion for Enums

**Problem**: Select values are always strings, may need type assertion

**Solution**: Cast in `onValueChange`
```tsx
type Status = 'ACTIVE' | 'INACTIVE';

<Select onValueChange={(value) => setStatus(value as Status)}>
```

---

### 6. Null/Undefined State Handling

**Problem**: Controlled Select with null value shows console warning

**Solution**: Convert null to empty string or undefined
```tsx
<Select
  value={status ?? ''}
  onValueChange={(value) => setStatus(value === '' ? null : value)}
>
```

---

### 7. Missing Key Props in Dynamic Lists

**Problem**: React warns about keys when mapping over options

**Solution**: Always provide unique key
```tsx
{codeGroups.map((group) => (
  <SelectItem key={group.id} value={group.groupCode}>
    {group.groupName}
  </SelectItem>
))}
```

---

## Testing Strategy

### Unit Testing (Vitest + React Testing Library)

**Testing Raw HTML Select**:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('selects an option', async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn();

  render(
    <select onChange={handleChange}>
      <option value="">All</option>
      <option value="ACTIVE">Active</option>
    </select>
  );

  await user.selectOptions(screen.getByRole('combobox'), 'ACTIVE');
  expect(handleChange).toHaveBeenCalled();
});
```

**Testing shadcn/ui Select**:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('selects an option', async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn();

  render(
    <Select onValueChange={handleChange}>
      <SelectTrigger>
        <SelectValue placeholder="All" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ACTIVE">Active</SelectItem>
      </SelectContent>
    </Select>
  );

  // Click trigger to open
  await user.click(screen.getByRole('combobox'));

  // Click option
  await user.click(screen.getByRole('option', { name: 'Active' }));

  expect(handleChange).toHaveBeenCalledWith('ACTIVE');
});
```

**Note**: Radix Select uses `role="combobox"` for trigger, `role="option"` for items

---

### Accessibility Testing

**Check ARIA Attributes**:
```tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('has no accessibility violations', async () => {
  const { container } = render(
    <Select value="ACTIVE" onValueChange={() => {}}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ACTIVE">Active</SelectItem>
      </SelectContent>
    </Select>
  );

  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

### Visual Regression Testing (Storybook)

**Create Story**:
```tsx
// FilterSelect.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { FilterSelect } from './FilterSelect';

const meta: Meta<typeof FilterSelect> = {
  title: 'Components/FilterSelect',
  component: FilterSelect,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: '',
    placeholder: 'Select status',
    options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
    ],
  },
};

export const WithValue: Story = {
  args: {
    ...Default.args,
    value: 'ACTIVE',
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
};
```

---

## Component Selection Decision Tree

```
Start: Need a dropdown?
│
├─ Is it for filtering/search parameters?
│  └─ YES → Use FilterSelect (or raw Select for one-off)
│
├─ Is it inside a form with validation?
│  └─ YES → Use FormSelect with react-hook-form
│
├─ Does it need search/autocomplete?
│  └─ YES → Use ComboBox component instead (not Select)
│
├─ Does it have many options (100+)?
│  └─ YES → Consider ComboBox with virtualization
│
└─ Default: Use raw shadcn/ui Select components
```

---

## When NOT to Use Select

### Use ComboBox Instead

**Scenario**: User needs to search/filter large list of options

**Example**: Employee selection, department selection with 100+ items

**Component**: `@/components/ui/combobox` (already exists in project)

---

### Use Command Instead

**Scenario**: Command palette, keyboard-driven navigation

**Example**: Quick actions menu, search palette

**Component**: `@/components/ui/command`

---

### Use RadioGroup Instead

**Scenario**: 2-5 mutually exclusive options that should all be visible

**Example**: "Yes/No" toggle, "Male/Female/Other" selection

**Component**: `@/components/ui/radio-group`

---

## Migration Checklist (Per File)

- [ ] Read current file to understand context
- [ ] Identify all `<select>` elements
- [ ] Check if FilterSelect/FormSelect can be used
- [ ] Import shadcn/ui Select components
- [ ] Replace `<select>` with `<Select>` wrapper
- [ ] Replace `<option>` with `<SelectItem>`
- [ ] Change `onChange` → `onValueChange`
- [ ] Remove `.target.value` from handler
- [ ] Add explicit width to `SelectTrigger`
- [ ] Convert empty `<option>` to `placeholder`
- [ ] Test in dev server (visual + functional)
- [ ] Test keyboard navigation (Arrow keys, Enter, Escape)
- [ ] Test accessibility (screen reader if possible)
- [ ] Run `pnpm build` to verify no TypeScript errors
- [ ] Run `pnpm test` if tests exist
- [ ] Commit with detailed message

---

**Document Version**: 1.0
**Last Updated**: 2026-02-09
**Author**: Claude Sonnet 4.5
