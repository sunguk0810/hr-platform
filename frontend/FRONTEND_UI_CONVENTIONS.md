# Frontend UI/UX Conventions Guide

> HR SaaS Platform 프론트엔드 UI/UX 표준 컨벤션 가이드.
> [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines) 기반 + 프로젝트 실제 코드 분석 결과 반영.

---

## 목차

1. [접근성 (Accessibility)](#1-접근성-accessibility)
2. [페이지 유형별 표준 패턴](#2-페이지-유형별-표준-패턴)
3. [로딩 & 에러 처리](#3-로딩--에러-처리)
4. [폼 검증 UX](#4-폼-검증-ux)
5. [i18n (다국어)](#5-i18n-다국어)
6. [성능](#6-성능)
7. [타이포그래피 & 콘텐츠](#7-타이포그래피--콘텐츠)
8. [다크 모드 & 반응형](#8-다크-모드--반응형)
9. [안티패턴 체크리스트](#9-안티패턴-체크리스트)

---

## 공통 컴포넌트 참조표

새로운 페이지를 만들 때 아래 표에서 용도에 맞는 컴포넌트를 선택한다.

| 용도 | 컴포넌트 | import 경로 |
|------|---------|------------|
| 페이지 제목 + 액션 | `PageHeader` | `@/components/common` |
| 전체 페이지 로딩 | `PageLoader` | `@/components/common` |
| 오버레이 로딩 | `SpinnerOverlay` | `@/components/common` |
| 확인 다이얼로그 | `ConfirmDialog` | `@/components/common` |
| 빈 상태 | `EmptyState` | `@/components/common` |
| 에러 페이지 | `ErrorPage` | `@/components/common/Error` |
| 에러 토스트 (함수) | `showErrorToast` | `@/components/common/Error` |
| 에러 토스트 (훅) | `useErrorToast` | `@/components/common/Error` |
| 에러 바운더리 | `ErrorBoundary` | `@/components/common` |
| 상태 뱃지 | `StatusBadge` | `@/components/common` |
| 도메인별 상태 뱃지 | `ApprovalStatusBadge`, `EmploymentStatusBadge`, ... | `@/components/common/StatusBadge` |
| 스켈레톤 로딩 | `Skeleton`, `SkeletonTable`, `SkeletonCard`, `SkeletonText`, `SkeletonAvatar` | `@/components/common` |
| 인라인 스피너 | `InlineSpinner` | `@/components/common/SpinnerOverlay` |
| 데이터 테이블 | `DataTable` | `@/components/common/DataTable` |
| 테이블 페이지네이션 | `DataTablePagination` | `@/components/common/DataTable` |
| 심플 페이지네이션 | `Pagination` | `@/components/common` |
| 가상 스크롤 | `VirtualizedList` | `@/components/common` |
| 무한 스크롤 + 가상화 | `InfiniteVirtualList` | `@/components/common/InfiniteVirtualList` |
| 이미지 최적화 | `OptimizedImage` | `@/components/common` |
| 권한 가드 | `PermissionGate` | `@/components/common` |
| 개인정보 마스킹 | `MaskedField` | `@/components/common` |
| 날짜 선택 | `DatePicker` | `@/components/common` |
| 기간 선택 | `DateRangePicker` | `@/components/common` |
| 시간 선택 | `TimePicker` | `@/components/common/Form` |
| 검색 | `SearchInput` | `@/components/common/Search` |
| 파일 업로드 | `FileUpload`, `ImageUpload` | `@/components/common/FileUpload` |
| 폼 섹션/행 | `FormSection`, `FormRow`, `FormActions` | `@/components/common/Form` |
| 폼 필드 (RHF) | `FormField` | `@/components/common/Form` |
| 폼 필드 (래퍼) | `FormInput`, `FormTextarea` | `@/components/common/Form` |
| 콤보박스 | `ComboBox`, `MultiComboBox` | `@/components/common/Form` |
| 이미지 뷰어 | `Lightbox` | `@/components/common/Lightbox` |

> **원칙**: 커스텀 구현 전에 반드시 위 표를 확인하고 기존 컴포넌트를 사용한다.

---

## 1. 접근성 (Accessibility)

**목표**: WCAG 2.1 AA 준수

### 1.1 키보드 네비게이션

모든 인터랙티브 요소는 키보드로 접근 가능해야 한다.

```tsx
// Bad - 키보드 접근 불가
<div onClick={() => navigate('/employees')}>직원 목록</div>

// Good - 키보드 접근 가능 + 시맨틱 HTML
<Link to="/employees">{t('employee.list')}</Link>

// Good - 버튼 역할이면 <button> 사용
<Button onClick={handleDelete}>{t('common.delete')}</Button>
```

**규칙**:
- 클릭 이벤트가 있는 `<div>`, `<span>` 금지 → `<button>`, `<a>`, `<Link>` 사용
- 모든 `<button>`은 기본적으로 키보드 접근 가능
- 커스텀 인터랙티브 요소에는 `role`, `tabIndex`, `onKeyDown` 필수

### 1.2 포커스 관리

프로젝트에 이미 글로벌 focus-visible 스타일이 설정되어 있다 (`globals.css`).

```css
/* 이미 적용됨 - 추가 설정 불필요 */
:focus-visible {
  @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
}
```

**추가 규칙**:
- 모달 열릴 때 첫 번째 포커스 가능 요소로 포커스 이동 (Radix UI Dialog 자동 처리)
- 모달 닫힐 때 트리거 요소로 포커스 복원 (Radix UI Dialog 자동 처리)
- 포커스 트랩: 모달 내부에서 Tab이 순환 (Radix UI Dialog 자동 처리)
- `outline: none` 단독 사용 금지 → 반드시 대체 포커스 표시 필요

```tsx
// Bad - 포커스 표시 제거
<button className="outline-none">저장</button>

// Good - focus-visible은 globals.css에서 처리됨
<button>저장</button>

// Good - 커스텀 포커스 스타일이 필요한 경우
<button className="focus-visible:ring-2 focus-visible:ring-primary">저장</button>
```

### 1.3 ARIA 레이블

```tsx
// Bad - 아이콘 버튼에 라벨 없음
<Button variant="ghost" size="icon" onClick={handleEdit}>
  <Pencil className="h-4 w-4" />
</Button>

// Good - 스크린 리더에서 "수정" 으로 읽힘
<Button
  variant="ghost"
  size="icon"
  onClick={handleEdit}
  aria-label={t('common.edit')}
>
  <Pencil className="h-4 w-4" />
</Button>
```

**필수 ARIA 속성**:

| 요소 | 필수 속성 |
|------|----------|
| 아이콘 버튼 | `aria-label` |
| 로딩 영역 | `aria-busy="true"`, `aria-live="polite"` |
| 검색 결과 카운트 | `aria-live="polite"` |
| 토글 버튼 | `aria-pressed` |
| 확장/축소 | `aria-expanded` |
| 필수 입력 | `aria-required="true"` (또는 HTML `required`) |
| 에러 메시지 | `aria-describedby` → 에러 메시지 ID 연결 |
| 테이블 | `role="table"` 또는 시맨틱 `<table>` |
| 탭 | `role="tablist"`, `role="tab"`, `role="tabpanel"` (Radix UI Tabs 자동 처리) |

### 1.4 시맨틱 HTML

```tsx
// Bad
<div className="text-2xl font-bold">직원 목록</div>

// Good
<h1 className="text-2xl font-bold">{t('employee.list')}</h1>
```

**시맨틱 태그 규칙**:
- 페이지 제목: `<h1>` (PageHeader 컴포넌트가 처리)
- 섹션 제목: `<h2>`, `<h3>` 순서대로 (건너뛰기 금지)
- 네비게이션: `<nav>`
- 리스트: `<ul>` / `<ol>`
- 테이블: `<table>` (DataTable 컴포넌트가 처리)
- 폼: `<form>`
- 메인 콘텐츠: `<main>`

### 1.5 Skip Navigation

프로젝트에 `SkipNavigation` 컴포넌트가 이미 구현되어 있다. 메인 레이아웃에 포함되어 있으므로 추가 작업 불필요.

### 1.6 prefers-reduced-motion

`globals.css`에 글로벌 설정이 있다. 커스텀 애니메이션 추가 시 반드시 적용.

```tsx
// Bad - 모션 감소 설정 무시
<motion.div animate={{ x: 100 }} transition={{ duration: 0.5 }}>

// Good - motion-safe에서만 애니메이션
<motion.div
  animate={{ x: 100 }}
  transition={{ duration: 0.5 }}
  className="motion-reduce:transform-none motion-reduce:transition-none"
>

// Good - Tailwind 유틸리티
<div className="motion-safe:animate-bounce">
```

---

## 2. 페이지 유형별 표준 패턴

### 2.1 목록 페이지 (List Page)

모든 목록 페이지는 아래 구조를 따른다.

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PageHeader, EmptyState, PermissionGate } from '@/components/common';
import { DataTable } from '@/components/common/DataTable';
import { showErrorToast } from '@/components/common/Error';
import { useEmployees } from '@/features/employee/hooks/useEmployees';

export function EmployeeListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [sorting, setSorting] = useState([]);

  const { data, isLoading, isError, error, refetch } = useEmployees({
    page: pagination.pageIndex,
    size: pagination.pageSize,
    sort: sorting,
  });

  // 에러 처리
  if (isError) {
    return (
      <ErrorPage
        title={t('common.error')}
        description={error?.message}
        showRetryButton
        onRetry={refetch}
      />
    );
  }

  const columns = [/* ... */];

  return (
    <div>
      {/* 1. 페이지 헤더 */}
      <PageHeader
        title={t('employee.title')}
        description={t('employee.list')}
        actions={
          <PermissionGate permissions={['EMPLOYEE_CREATE']}>
            <Button onClick={() => navigate('/employees/new')}>
              <Plus className="mr-2 h-4 w-4" />
              {t('employee.create')}
            </Button>
          </PermissionGate>
        }
      />

      {/* 2. 데이터 테이블 */}
      <DataTable
        columns={columns}
        data={data?.content ?? []}
        loading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        pageCount={data?.totalPages ?? 0}
        sorting={sorting}
        onSortingChange={setSorting}
        enableExport
        exportFileName="employees"
        emptyMessage={t('common.noData')}
        onRowClick={(row) => navigate(`/employees/${row.id}`)}
      />
    </div>
  );
}
```

**목록 페이지 체크리스트**:
- [ ] `PageHeader` 사용
- [ ] `DataTable` 사용 (단순 목록은 `<table>` 허용)
- [ ] 로딩 → `DataTable`의 `loading` prop 사용 (내부적으로 `DataTableSkeleton` 렌더)
- [ ] 에러 → `ErrorPage` + 재시도 버튼
- [ ] 빈 상태 → `DataTable`의 `emptyMessage` 또는 `EmptyState`
- [ ] 페이지네이션 → `DataTable`의 서버 사이드 페이지네이션
- [ ] 권한 → `PermissionGate`로 생성/수정/삭제 버튼 가드
- [ ] 모든 문자열 → `t()` 함수 사용

### 2.2 폼 페이지 (Form Page)

```tsx
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common';
import { Form, FormField, FormSection, FormRow, FormActions } from '@/components/common/Form';
import { showErrorToast } from '@/components/common/Error';
import { useCreateEmployee } from '@/features/employee/hooks/useEmployees';

const schema = z.object({
  name: z.string().min(1, '필수 입력 항목입니다'),
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  departmentId: z.string().min(1, '부서를 선택해주세요'),
});

type FormValues = z.infer<typeof schema>;

export function EmployeeCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createMutation = useCreateEmployee();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', departmentId: '' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await createMutation.mutateAsync(values);
      navigate('/employees');
    } catch (error) {
      showErrorToast(error);
    }
  };

  return (
    <div>
      <PageHeader title={t('employee.create')} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FormSection title={t('employee.basicInfo')}>
            <FormRow cols={2}>
              <FormField name="name" label={t('employee.name')} required>
                {(field) => <Input {...field} />}
              </FormField>
              <FormField name="email" label={t('employee.email')} required>
                {(field) => <Input {...field} type="email" />}
              </FormField>
            </FormRow>
          </FormSection>

          <FormActions align="right">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t('common.loading') : t('common.save')}
            </Button>
          </FormActions>
        </form>
      </Form>
    </div>
  );
}
```

**폼 페이지 체크리스트**:
- [ ] `react-hook-form` + `zod` 유효성 검증
- [ ] `FormSection` / `FormRow` / `FormActions` 레이아웃
- [ ] 서밋 버튼 로딩 상태 표시 (`isPending`)
- [ ] 서밋 에러 → `showErrorToast()` (alert 금지)
- [ ] 취소 시 확인 대화상자 (폼 dirty 체크)
- [ ] `noValidate` 속성으로 브라우저 기본 검증 비활성화

### 2.3 상세 페이지 (Detail Page)

```tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader, PageLoader, ConfirmDialog, PermissionGate } from '@/components/common';
import { ErrorPage } from '@/components/common/Error';
import { EmploymentStatusBadge } from '@/components/common/StatusBadge';
import { useEmployee, useDeleteEmployee } from '@/features/employee/hooks/useEmployees';

export function EmployeeDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: employee, isLoading, isError, error, refetch } = useEmployee(id!);
  const deleteMutation = useDeleteEmployee();

  if (isLoading) return <PageLoader />;

  if (isError) {
    return (
      <ErrorPage
        title={t('common.error')}
        description={error?.message}
        showRetryButton
        onRetry={refetch}
      />
    );
  }

  if (!employee) {
    return (
      <ErrorPage
        statusCode={404}
        title="데이터를 찾을 수 없습니다"
        showBackButton
        showHomeButton
      />
    );
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id!);
      navigate('/employees');
    } catch (error) {
      showErrorToast(error);
    }
  };

  return (
    <div>
      <PageHeader
        title={employee.name}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Button>
            <PermissionGate permissions={['EMPLOYEE_UPDATE']}>
              <Button onClick={() => navigate(`/employees/${id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />
                {t('common.edit')}
              </Button>
            </PermissionGate>
            <PermissionGate permissions={['EMPLOYEE_DELETE']}>
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('common.delete')}
              </Button>
            </PermissionGate>
          </>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('employee.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label={t('employee.name')} value={employee.name} />
            <DetailRow label={t('employee.status')}>
              <EmploymentStatusBadge status={employee.status} />
            </DetailRow>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t('common.delete')}
        description="이 직원 정보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        variant="destructive"
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
```

**상세 페이지 체크리스트**:
- [ ] 로딩 → `PageLoader`
- [ ] 에러 → `ErrorPage` + 재시도
- [ ] 404 → `ErrorPage` statusCode=404
- [ ] 삭제 → `ConfirmDialog` 사용 (window.confirm 금지)
- [ ] 권한 → `PermissionGate`
- [ ] 뒤로 가기 → `navigate(-1)`

### 2.4 모달/다이얼로그

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Good - Radix UI Dialog 사용
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{t('employee.create')}</DialogTitle>
      <DialogDescription>새 직원 정보를 입력하세요.</DialogDescription>
    </DialogHeader>

    {/* 폼 내용 */}

    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        {t('common.cancel')}
      </Button>
      <Button onClick={handleSubmit} disabled={isPending}>
        {t('common.save')}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**모달 규칙**:
- Radix UI `Dialog` 컴포넌트 사용 (접근성 자동 처리)
- 파괴적 작업 → `ConfirmDialog` 컴포넌트 사용
- 에러 발생 시 모달 닫지 않고 인라인 에러 표시
- ESC 키로 닫기 가능 (Radix 기본 동작)
- 모달 배경 클릭으로 닫기 가능

---

## 3. 로딩 & 에러 처리

### 3.1 로딩 상태

상황에 따라 적절한 로딩 컴포넌트를 선택한다.

| 상황 | 컴포넌트 | 사용법 |
|------|---------|-------|
| 페이지 초기 로딩 | `PageLoader` | `if (isLoading) return <PageLoader />` |
| 테이블 데이터 로딩 | `DataTable` `loading` prop | `<DataTable loading={isLoading} />` |
| 폼 제출 중 | `Button` `disabled` | `<Button disabled={isPending}>` |
| 섹션 로딩 | `SkeletonCard` / `SkeletonTable` | 데이터 영역만 스켈레톤 |
| 오버레이 로딩 | `SpinnerOverlay` | 기존 UI 위에 오버레이 |
| 인라인 로딩 | `InlineSpinner` | 텍스트 옆 소형 스피너 |

```tsx
// Bad - 텍스트만 표시
if (isLoading) return <div>로딩중...</div>;

// Good - PageLoader 사용
if (isLoading) return <PageLoader />;

// Good - 테이블 스켈레톤
<DataTable columns={columns} data={data} loading={isLoading} />

// Good - 섹션별 스켈레톤
{isLoading ? <SkeletonTable rows={5} /> : <EmployeeTable data={data} />}
```

**로딩 규칙**:
- 300ms 미만의 로딩은 인디케이터 불필요 (React Query의 `placeholderData` 활용)
- 스켈레톤은 실제 레이아웃과 유사하게 표시
- 제출 버튼은 로딩 중 `disabled` + 텍스트 변경

### 3.2 에러 처리

```tsx
// Bad - alert 사용
try {
  await mutation.mutateAsync(data);
} catch (error) {
  alert('오류가 발생했습니다');  // 금지
}

// Bad - 에러 무시
try {
  await mutation.mutateAsync(data);
} catch (error) {
  console.error(error);  // 사용자에게 피드백 없음
}

// Good - 토스트 알림
import { showErrorToast } from '@/components/common/Error';

try {
  await mutation.mutateAsync(data);
  navigate('/list');
} catch (error) {
  showErrorToast(error);  // 사용자에게 토스트로 에러 표시
}
```

**에러 처리 매트릭스**:

| 상황 | 처리 방법 |
|------|----------|
| 페이지 데이터 로드 실패 | `ErrorPage` + 재시도 버튼 |
| 폼 제출 실패 | `showErrorToast()` (모달 닫지 않음) |
| 네트워크 에러 | 토스트 + 재시도 안내 |
| 404 Not Found | `ErrorPage` statusCode=404 |
| 403 Forbidden | `ErrorPage` statusCode=403 |
| 500 Server Error | `ErrorPage` statusCode=500 |
| React 렌더링 에러 | `ErrorBoundary` (글로벌 래핑) |

### 3.3 데이터 갱신

```tsx
// Bad - 전체 페이지 리로드
window.location.reload();

// Good - React Query 캐시 무효화
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const handleSuccess = () => {
  queryClient.invalidateQueries({ queryKey: ['employees'] });
};
```

**규칙**: `window.location.reload()` 사용 금지. 항상 `queryClient.invalidateQueries()` 사용.

---

## 4. 폼 검증 UX

### 4.1 기본 패턴: react-hook-form + Zod

프로젝트의 모든 폼은 이 조합을 사용한다.

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. 스키마 정의
const schema = z.object({
  name: z.string()
    .min(1, '이름을 입력해주세요')
    .max(50, '50자 이내로 입력해주세요'),
  email: z.string()
    .email('올바른 이메일 형식이 아닙니다'),
  salary: z.number()
    .min(0, '0 이상 입력해주세요')
    .optional(),
});

type FormValues = z.infer<typeof schema>;

// 2. 폼 초기화
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { name: '', email: '' },
  mode: 'onBlur',  // blur 시 검증 (즉시 검증은 피함)
});
```

### 4.2 에러 표시 방식

```tsx
// Bad - alert로 검증 에러 표시
const handleSubmit = (data) => {
  if (!data.name) {
    alert('이름을 입력해주세요');  // 금지
    return;
  }
};

// Good - FormField가 인라인 에러 메시지 표시
<FormField name="name" label="이름" required>
  {(field) => <Input {...field} placeholder="이름 입력..." />}
</FormField>
// → 에러 시 필드 아래에 빨간 텍스트 표시
```

### 4.3 폼 제출 UX

```tsx
// Good - 제출 버튼 상태 관리
<Button
  type="submit"
  disabled={!form.formState.isValid || createMutation.isPending}
>
  {createMutation.isPending ? (
    <>
      <InlineSpinner size="sm" className="mr-2" />
      저장 중...
    </>
  ) : (
    '저장'
  )}
</Button>
```

### 4.4 금지 패턴

| 금지 | 대체 |
|------|------|
| `alert()` | `showErrorToast()` |
| `window.confirm()` | `ConfirmDialog` |
| 브라우저 기본 검증 | `<form noValidate>` + Zod |
| `form.handleSubmit` 내 수동 검증 | Zod 스키마에 통합 |
| 커스텀 `useState` 에러 관리 | react-hook-form `formState.errors` |

### 4.5 수정 폼의 Dirty Check

```tsx
// Good - 수정 사항 있을 때만 저장 가능 + 이탈 방지
const { formState: { isDirty } } = form;

// 페이지 이탈 방지
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isDirty) e.preventDefault();
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isDirty]);

// 뒤로 가기 시 확인
const handleCancel = () => {
  if (isDirty) {
    setShowCancelDialog(true);
  } else {
    navigate(-1);
  }
};
```

---

## 5. i18n (다국어)

### 5.1 현재 설정

- 라이브러리: `i18next` + `react-i18next`
- 언어: 한국어(ko), 영어(en)
- 기본 언어: 한국어(ko)
- 번역 파일: `src/lib/i18n.ts` (인라인)

### 5.2 사용법

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('employee.title')}</h1>
      <p>{t('dashboard.greeting', { name: user.name })}</p>
      <p>{t('dashboard.approvals.description', { count: 5 })}</p>
    </div>
  );
}
```

### 5.3 네임스페이스

현재 정의된 11개 네임스페이스:

| 네임스페이스 | 용도 |
|-------------|------|
| `common` | 공통 UI (저장, 취소, 삭제, 로딩 등) |
| `auth` | 로그인/로그아웃 |
| `dashboard` | 대시보드, 출퇴근, 연차, 결재 대기 |
| `navigation` | 메뉴 항목 |
| `settings` | 설정 페이지 |
| `employee` | 인사정보 |
| `approval` | 전자결재 |
| `file` | 파일 관리 |
| `condolence` | 경조비 |
| `validation` | 폼 검증 메시지 |
| `accessibility` | 접근성 라벨 |

### 5.4 키 네이밍 컨벤션

```
{namespace}.{section}.{key}

예시:
employee.title          → "인사정보"
employee.list           → "직원 목록"
common.save             → "저장"
common.loading          → "로딩중..."
validation.required     → "필수 입력 항목입니다"
dashboard.greeting      → "안녕하세요, {{name}}님"
```

**규칙**:
- 소문자 camelCase
- 최대 3단계 깊이 (`namespace.section.key`)
- 상태(status) 값은 UPPER_CASE: `condolence.statuses.APPROVED`
- 보간 변수는 `{{변수명}}` 형식
- 복수형은 `_plural` 접미사 또는 `count` 보간

### 5.5 하드코딩 금지 규칙

```tsx
// Bad - 하드코딩
<Button>삭제</Button>
<p>데이터가 없습니다</p>
<th>이름</th>

// Good - i18n 키 사용
<Button>{t('common.delete')}</Button>
<p>{t('common.noData')}</p>
<th>{t('employee.name')}</th>
```

**예외** (하드코딩 허용):
- 고유명사: 회사명, 제품명
- 기술 용어: URL, API 경로
- 테스트/스토리 파일

### 5.6 StatusBadge와 i18n

도메인별 상태 뱃지 컴포넌트(`ApprovalStatusBadge`, `EmploymentStatusBadge` 등)는 내부적으로 상태 라벨을 관리한다. 향후 i18n 적용 시 이 라벨들이 `t()` 함수로 교체될 예정.

```tsx
// 현재 - 컴포넌트 내부에서 한국어 라벨 관리
<ApprovalStatusBadge status="PENDING" />  // → "대기중" 표시

// 향후 - i18n 키로 교체 예정
// 내부 구현이 t('approval.status.PENDING')으로 변경
```

---

## 6. 성능

### 6.1 가상 스크롤

50개 이상의 아이템을 렌더할 가능성이 있는 목록에는 가상 스크롤 적용.

```tsx
import { VirtualizedList } from '@/components/common';

// Good - 대량 데이터에 가상 스크롤
<VirtualizedList
  items={employees}
  estimateSize={64}
  overscan={5}
  renderItem={(employee) => <EmployeeRow employee={employee} />}
/>

// Good - 무한 스크롤 + 가상화
import { InfiniteVirtualList } from '@/components/common/InfiniteVirtualList';

<InfiniteVirtualList
  items={allItems}
  renderItem={(item) => <ItemCard item={item} />}
  hasMore={hasNextPage}
  isLoading={isFetchingNextPage}
  onLoadMore={fetchNextPage}
  estimateSize={80}
/>
```

**기준**:
- 20개 이하: 일반 렌더링
- 20-50개: 페이지네이션 권장
- 50개 이상: `VirtualizedList` 또는 페이지네이션 필수

### 6.2 이미지 최적화

```tsx
import { OptimizedImage } from '@/components/common';

// Good - lazy loading + 스켈레톤 + 에러 핸들링
<OptimizedImage
  src={employee.profileImage}
  alt={employee.name}
  aspectRatio="square"
  objectFit="cover"
  className="h-10 w-10 rounded-full"
/>

// Bad - 기본 img 태그
<img src={employee.profileImage} />
```

**이미지 규칙**:
- 항상 `OptimizedImage` 사용 (lazy loading, 에러 핸들링 내장)
- `alt` 속성 필수 (장식 이미지는 `alt=""`)
- `width`/`height` 또는 `aspectRatio` 명시 (레이아웃 시프트 방지)

### 6.3 CSS 성능

```tsx
// Bad - transition: all은 모든 속성에 GPU 레이어 생성
<div className="transition-all duration-200">

// Good - 필요한 속성만 지정
<div className="transition-colors duration-200">
<div className="transition-opacity duration-200">
<div className="transition-transform duration-200">
```

**규칙**:
- `transition-all` 사용 금지 → `transition-colors`, `transition-opacity`, `transition-transform` 등 개별 속성 지정
- 숫자 컬럼에 `font-variant-numeric: tabular-nums` 적용 (Tailwind: `tabular-nums`)
- 제목에 `text-wrap: balance` 적용 (Tailwind: `text-balance`)
- 터치 디바이스에 `touch-action: manipulation` 적용 (300ms 딜레이 제거)

### 6.4 React Query 최적화

```tsx
// Good - 적절한 staleTime 설정
const { data } = useQuery({
  queryKey: ['employees', filters],
  queryFn: () => fetchEmployees(filters),
  staleTime: 5 * 60 * 1000,  // 5분 동안 fresh
  gcTime: 10 * 60 * 1000,    // 10분 후 가비지 컬렉션
});

// Good - 마우스 호버 시 prefetch
const queryClient = useQueryClient();

const handleHover = (employeeId: string) => {
  queryClient.prefetchQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => fetchEmployee(employeeId),
    staleTime: 60 * 1000,
  });
};

<tr onMouseEnter={() => handleHover(employee.id)}>
```

**staleTime 가이드라인**:
| 데이터 유형 | staleTime |
|-----------|-----------|
| 거의 변하지 않는 데이터 (코드, 메뉴) | 30분 |
| 자주 변하지 않는 데이터 (조직, 직원) | 5분 |
| 자주 변하는 데이터 (결재, 알림) | 1분 |
| 실시간 데이터 (출퇴근) | 0 (항상 refetch) |

### 6.5 코드 스플리팅

라우터에서 `React.lazy()`로 페이지 단위 코드 스플리팅이 이미 적용되어 있다.

```tsx
// routes/config.ts - 이미 적용됨
const EmployeeListPage = lazy(() => import('@/features/employee/pages/EmployeeListPage'));
```

새 페이지 추가 시 반드시 `lazy()` import 사용.

---

## 7. 타이포그래피 & 콘텐츠

### 7.1 텍스트 오버플로우

긴 텍스트는 말줄임표(`…`)로 처리한다.

```tsx
// Good - 한 줄 말줄임
<span className="truncate">{employee.name}</span>

// Good - 여러 줄 말줄임 (2줄)
<p className="line-clamp-2">{description}</p>

// Good - 테이블 셀 너비 제한 + 말줄임
<td className="max-w-[200px] truncate" title={employee.email}>
  {employee.email}
</td>
```

**규칙**:
- 테이블 셀의 긴 텍스트는 `truncate` + `title` 속성
- 카드 설명은 `line-clamp-2` 또는 `line-clamp-3`
- `title` 속성으로 전체 텍스트 확인 가능하게

### 7.2 숫자 표시

```tsx
// Good - 숫자 정렬을 위한 tabular-nums
<td className="text-right tabular-nums">
  {salary.toLocaleString()}원
</td>

// Good - 날짜 형식 통일
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

<span>{format(new Date(createdAt), 'yyyy.MM.dd', { locale: ko })}</span>
<span>{format(new Date(createdAt), 'yyyy.MM.dd HH:mm', { locale: ko })}</span>
```

**날짜 형식 표준**:

| 용도 | 형식 | 예시 |
|------|------|------|
| 목록 날짜 | `yyyy.MM.dd` | 2026.02.09 |
| 상세 날짜 | `yyyy.MM.dd HH:mm` | 2026.02.09 14:30 |
| 상대 시간 | `formatDistanceToNow` | 3시간 전 |

### 7.3 제목 텍스트

```tsx
// Good - 제목에 text-balance 적용
<h1 className="text-2xl font-bold text-balance">{title}</h1>

// Good - 설명 텍스트에 text-pretty 적용
<p className="text-muted-foreground text-pretty">{description}</p>
```

### 7.4 빈 값 표시

```tsx
// Bad - 아무것도 표시하지 않음
<td>{employee.phone}</td>  // undefined 시 빈 셀

// Good - 대시로 빈 값 표시
<td>{employee.phone || '—'}</td>

// Good - 유틸 함수
function displayValue(value?: string | null, fallback = '—'): string {
  return value?.trim() || fallback;
}
```

---

## 8. 다크 모드 & 반응형

### 8.1 다크 모드

프로젝트는 CSS 변수 기반 다크 모드를 사용한다 (class-based, `globals.css`에 정의).

```tsx
// Good - CSS 변수 사용 (자동으로 다크 모드 대응)
<div className="bg-background text-foreground">
<div className="bg-card text-card-foreground">
<div className="bg-muted text-muted-foreground">
<div className="border-border">

// Bad - 하드코딩 색상 (다크 모드 미대응)
<div className="bg-white text-gray-900">
<div className="bg-gray-100 text-gray-600">
<div style={{ backgroundColor: '#ffffff' }}>
```

**시맨틱 색상 변수**:

| 변수 | 용도 |
|------|------|
| `background` / `foreground` | 페이지 배경 / 기본 텍스트 |
| `card` / `card-foreground` | 카드 배경 / 카드 텍스트 |
| `muted` / `muted-foreground` | 비활성 배경 / 보조 텍스트 |
| `primary` / `primary-foreground` | 주 액션 색 |
| `secondary` / `secondary-foreground` | 보조 액션 색 |
| `destructive` / `destructive-foreground` | 위험 액션 색 (삭제 등) |
| `accent` / `accent-foreground` | 강조 색 |
| `border` | 테두리 |
| `input` | 입력 필드 테두리 |
| `ring` | 포커스 링 |

**규칙**:
- `bg-white`, `text-black`, `bg-gray-*` 등 Tailwind 기본 색상 직접 사용 금지
- 반드시 시맨틱 변수 사용 (`bg-background`, `text-foreground`, `bg-muted` 등)
- 인라인 `style={{ color: '#...', backgroundColor: '#...' }}` 금지
- 다크 모드 전용 스타일이 필요한 경우: `dark:` 접두사 사용

### 8.2 반응형 디자인

**브레이크포인트 (Tailwind 기본)**:

| 접두사 | 최소 너비 | 기기 |
|--------|---------|------|
| `sm` | 640px | 모바일 (가로) |
| `md` | 768px | 태블릿 |
| `lg` | 1024px | 데스크톱 |
| `xl` | 1280px | 와이드 |
| `2xl` | 1400px | 울트라와이드 (컨테이너 max-width) |

```tsx
// Good - 모바일 우선 반응형
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {items.map(item => <Card key={item.id} />)}
</div>

// Good - 폼 레이아웃 반응형
<FormRow cols={2}>  // FormRow 컴포넌트 내부에서 md:grid-cols-2 처리
  <FormField name="name" />
  <FormField name="email" />
</FormRow>

// Good - DataTable 모바일 카드 뷰
<DataTable
  columns={columns}
  data={data}
  enableMobileCard
  mobileCardRenderer={(row) => <MobileEmployeeCard employee={row} />}
/>
```

**반응형 규칙**:
- 모바일 우선 (mobile-first) → `md:`, `lg:` 접두사로 확장
- `DataTable`의 `enableMobileCard` prop 활용
- 사이드바: 모바일에서 `sheet`로 변환
- 폼: 모바일에서 1컬럼, 데스크톱에서 2컬럼 (`FormRow cols={2}`)

### 8.3 useMediaQuery 훅

```tsx
import { useMediaQuery } from '@/hooks/useMediaQuery';

function MyComponent() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');

  return isMobile ? <MobileView /> : <DesktopView />;
}
```

---

## 9. 안티패턴 체크리스트

코드 리뷰 및 셀프 체크용 빠른 참조.

### 9.1 절대 금지 (Critical)

| # | 안티패턴 | 대체 | 검색 패턴 |
|---|---------|------|----------|
| 1 | `alert()` | `showErrorToast()` | `alert(` |
| 2 | `window.confirm()` | `ConfirmDialog` | `confirm(` |
| 3 | `window.location.reload()` | `queryClient.invalidateQueries()` | `location.reload` |
| 4 | `console.log()` (프로덕션) | 삭제 또는 로거 사용 | `console.log` |
| 5 | 하드코딩 한국어 문자열 | `t()` 함수 | 한글 문자 in `.tsx` |
| 6 | `<div onClick>` | `<button>` 또는 `<Button>` | `<div onClick` |
| 7 | 인라인 `style={{ color: '#...' }}` | Tailwind CSS 변수 | `style={{` |

### 9.2 강력 권고 (High)

| # | 안티패턴 | 대체 |
|---|---------|------|
| 8 | `transition-all` | `transition-colors`, `transition-opacity`, `transition-transform` |
| 9 | `bg-white`, `text-black` | `bg-background`, `text-foreground` (시맨틱 변수) |
| 10 | `catch(e) { console.error(e) }` | `catch(e) { showErrorToast(e) }` |
| 11 | 빈 `catch` 블록 | 에러 로깅 또는 사용자 알림 |
| 12 | `<img>` 태그 직접 사용 | `<OptimizedImage>` |
| 13 | 아이콘 버튼에 `aria-label` 없음 | `aria-label={t('...')}` 추가 |
| 14 | `outline-none` (대체 없이) | `focus-visible:ring-2` |
| 15 | `useEffect` 내 데이터 페칭 | `useQuery` |

### 9.3 권장 사항 (Medium)

| # | 안티패턴 | 대체 |
|---|---------|------|
| 16 | 100+ 아이템 일반 렌더링 | `VirtualizedList` 또는 페이지네이션 |
| 17 | 빈 상태 미처리 | `EmptyState` 컴포넌트 |
| 18 | 로딩 상태 미처리 | `PageLoader` 또는 `SkeletonTable` |
| 19 | 수동 `useState` 폼 관리 | `react-hook-form` + `zod` |
| 20 | 날짜 직접 포맷 | `date-fns` `format()` |

### 9.4 기존 코드베이스 현황 (참조)

현재 코드베이스에서 발견된 안티패턴 현황:

| 안티패턴 | 발견 건수 | 주요 위치 |
|---------|----------|----------|
| `alert()` | 7건 | recruitment 폼, tenant 비교, 스토리 |
| `window.confirm()` | 5건 | settings, attendance, recruitment, approval |
| `window.location.reload()` | 4건 | employee 목록, tenant 전환 |
| `console.log` (비테스트) | 6건 | notification 훅, websocket, main |
| 하드코딩 한국어 | ~989건 | 거의 모든 feature 페이지 |
| `t()` 사용 | ~33건 | dashboard 위젯, 접근성 (전체의 ~3%) |
| `transition-all` | 25개 파일 | approval, mobile, UI 컴포넌트 |
| 인라인 `style={{}}` | 35개 파일 | approval, mdm, attendance, org chart |

> **i18n 적용률**: 약 3% (33건 / 989건). Phase 2~4에서 순차 적용 예정.

### 9.5 PR 리뷰 체크리스트

새 코드 작성 또는 기존 코드 수정 시:

```
접근성:
  □ 아이콘 버튼에 aria-label 있는가?
  □ 모달은 Radix UI Dialog를 사용하는가?
  □ 시맨틱 HTML 태그를 사용하는가?
  □ 키보드로 모든 기능 접근 가능한가?

i18n:
  □ 모든 사용자 노출 문자열에 t() 사용했는가?
  □ 새 키를 i18n 파일에 추가했는가?
  □ ko/en 양쪽 번역이 있는가?

로딩/에러:
  □ useQuery의 isLoading 상태를 처리했는가?
  □ useQuery의 isError 상태를 처리했는가?
  □ 뮤테이션의 isPending으로 버튼 비활성화했는가?
  □ catch에서 사용자에게 에러 알림하는가?

성능:
  □ transition-all 대신 개별 속성을 지정했는가?
  □ img 대신 OptimizedImage를 사용했는가?
  □ 대량 목록에 가상 스크롤/페이지네이션이 있는가?

스타일:
  □ bg-white/text-black 대신 시맨틱 변수를 사용했는가?
  □ 인라인 style 대신 Tailwind 클래스를 사용했는가?
  □ 반응형 대응이 되어 있는가?

폼:
  □ react-hook-form + zod를 사용했는가?
  □ alert() 대신 showErrorToast()를 사용했는가?
  □ confirm() 대신 ConfirmDialog를 사용했는가?
  □ window.location.reload() 대신 invalidateQueries()를 사용했는가?
```

---

## 부록: Tailwind 유틸리티 빠른 참조

### 자주 사용하는 유틸리티 클래스

```tsx
// 텍스트 말줄임
className="truncate"              // 한 줄 말줄임
className="line-clamp-2"          // 2줄 말줄임

// 숫자 정렬
className="tabular-nums"          // 숫자 등폭

// 텍스트 래핑
className="text-balance"          // 제목 균형 래핑
className="text-pretty"           // 본문 예쁜 래핑

// 반응형
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// 다크 모드
className="bg-background text-foreground"

// 애니메이션 (모션 감소 대응)
className="motion-safe:animate-bounce"
className="motion-reduce:transition-none"

// 스크롤바
className="scrollbar-thin"        // 얇은 스크롤바

// 터치
className="touch-manipulation"    // 터치 300ms 딜레이 제거
```
