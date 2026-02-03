import { http, HttpResponse, delay } from 'msw';
import type { Employee, EmployeeListItem, EmploymentStatus } from '@hr-platform/shared-types';

const mockEmployees: Employee[] = [
  {
    id: 'emp-001',
    tenantId: 'tenant-001',
    employeeNumber: 'EMP2024001',
    name: '홍길동',
    nameEn: 'Gil-dong Hong',
    email: 'hong@example.com',
    mobile: '010-1234-5678',
    birthDate: '1985-03-15',
    gender: 'MALE',
    hireDate: '2020-01-02',
    employmentStatus: 'ACTIVE',
    departmentId: 'dept-001',
    departmentName: '개발팀',
    positionId: 'pos-001',
    positionName: '팀장',
    gradeId: 'grade-001',
    gradeName: '부장',
    managerId: undefined,
    managerName: undefined,
    profileImageUrl: undefined,
    createdAt: '2020-01-02T09:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'emp-002',
    tenantId: 'tenant-001',
    employeeNumber: 'EMP2024002',
    name: '김철수',
    email: 'kim.cs@example.com',
    mobile: '010-2345-6789',
    birthDate: '1990-07-22',
    gender: 'MALE',
    hireDate: '2021-03-15',
    employmentStatus: 'ACTIVE',
    departmentId: 'dept-001',
    departmentName: '개발팀',
    positionId: 'pos-002',
    positionName: '선임',
    gradeId: 'grade-003',
    gradeName: '과장',
    managerId: 'emp-001',
    managerName: '홍길동',
    profileImageUrl: undefined,
    createdAt: '2021-03-15T09:00:00Z',
    updatedAt: '2024-02-10T14:20:00Z',
  },
  {
    id: 'emp-003',
    tenantId: 'tenant-001',
    employeeNumber: 'EMP2024003',
    name: '이영희',
    email: 'lee.yh@example.com',
    mobile: '010-3456-7890',
    birthDate: '1988-11-30',
    gender: 'FEMALE',
    hireDate: '2019-06-01',
    employmentStatus: 'ACTIVE',
    departmentId: 'dept-002',
    departmentName: '인사팀',
    positionId: 'pos-003',
    positionName: '매니저',
    gradeId: 'grade-002',
    gradeName: '차장',
    managerId: undefined,
    managerName: undefined,
    profileImageUrl: undefined,
    createdAt: '2019-06-01T09:00:00Z',
    updatedAt: '2024-01-20T11:00:00Z',
  },
  {
    id: 'emp-004',
    tenantId: 'tenant-001',
    employeeNumber: 'EMP2024004',
    name: '박지민',
    email: 'park.jm@example.com',
    mobile: '010-4567-8901',
    birthDate: '1992-04-18',
    gender: 'FEMALE',
    hireDate: '2022-02-14',
    employmentStatus: 'ON_LEAVE',
    departmentId: 'dept-003',
    departmentName: '재무팀',
    positionId: 'pos-004',
    positionName: '주임',
    gradeId: 'grade-004',
    gradeName: '대리',
    managerId: 'emp-003',
    managerName: '이영희',
    profileImageUrl: undefined,
    createdAt: '2022-02-14T09:00:00Z',
    updatedAt: '2024-03-01T09:00:00Z',
  },
  {
    id: 'emp-005',
    tenantId: 'tenant-001',
    employeeNumber: 'EMP2024005',
    name: '최수진',
    email: 'choi.sj@example.com',
    mobile: '010-5678-9012',
    birthDate: '1983-09-05',
    gender: 'FEMALE',
    hireDate: '2018-04-02',
    employmentStatus: 'ACTIVE',
    departmentId: 'dept-004',
    departmentName: '마케팅팀',
    positionId: 'pos-001',
    positionName: '팀장',
    gradeId: 'grade-001',
    gradeName: '부장',
    managerId: undefined,
    managerName: undefined,
    profileImageUrl: undefined,
    createdAt: '2018-04-02T09:00:00Z',
    updatedAt: '2024-02-28T16:45:00Z',
  },
  {
    id: 'emp-006',
    tenantId: 'tenant-001',
    employeeNumber: 'EMP2024006',
    name: '정민호',
    email: 'jung.mh@example.com',
    mobile: '010-6789-0123',
    birthDate: '1987-12-25',
    gender: 'MALE',
    hireDate: '2020-08-17',
    employmentStatus: 'ACTIVE',
    departmentId: 'dept-001',
    departmentName: '개발팀',
    positionId: 'pos-005',
    positionName: '책임',
    gradeId: 'grade-002',
    gradeName: '차장',
    managerId: 'emp-001',
    managerName: '홍길동',
    profileImageUrl: undefined,
    createdAt: '2020-08-17T09:00:00Z',
    updatedAt: '2024-01-10T13:15:00Z',
  },
  {
    id: 'emp-007',
    tenantId: 'tenant-001',
    employeeNumber: 'EMP2024007',
    name: '강하늘',
    email: 'kang.hn@example.com',
    mobile: '010-7890-1234',
    birthDate: '1991-06-10',
    gender: 'FEMALE',
    hireDate: '2021-11-01',
    employmentStatus: 'ACTIVE',
    departmentId: 'dept-005',
    departmentName: '디자인팀',
    positionId: 'pos-002',
    positionName: '선임',
    gradeId: 'grade-003',
    gradeName: '과장',
    managerId: 'emp-005',
    managerName: '최수진',
    profileImageUrl: undefined,
    createdAt: '2021-11-01T09:00:00Z',
    updatedAt: '2024-02-05T10:00:00Z',
  },
  {
    id: 'emp-008',
    tenantId: 'tenant-001',
    employeeNumber: 'EMP2024008',
    name: '윤서연',
    email: 'yoon.sy@example.com',
    mobile: '010-8901-2345',
    birthDate: '1995-01-28',
    gender: 'FEMALE',
    hireDate: '2023-01-09',
    resignationDate: '2024-02-29',
    employmentStatus: 'RESIGNED',
    departmentId: 'dept-002',
    departmentName: '인사팀',
    positionId: 'pos-004',
    positionName: '주임',
    gradeId: 'grade-005',
    gradeName: '사원',
    managerId: 'emp-003',
    managerName: '이영희',
    profileImageUrl: undefined,
    createdAt: '2023-01-09T09:00:00Z',
    updatedAt: '2024-02-29T18:00:00Z',
  },
  {
    id: 'emp-009',
    tenantId: 'tenant-001',
    employeeNumber: 'EMP2024009',
    name: '임준혁',
    email: 'lim.jh@example.com',
    mobile: '010-9012-3456',
    birthDate: '1980-08-14',
    gender: 'MALE',
    hireDate: '2015-03-02',
    employmentStatus: 'ACTIVE',
    departmentId: 'dept-006',
    departmentName: '영업팀',
    positionId: 'pos-001',
    positionName: '팀장',
    gradeId: 'grade-001',
    gradeName: '부장',
    managerId: undefined,
    managerName: undefined,
    profileImageUrl: undefined,
    createdAt: '2015-03-02T09:00:00Z',
    updatedAt: '2024-03-10T11:30:00Z',
  },
  {
    id: 'emp-010',
    tenantId: 'tenant-001',
    employeeNumber: 'EMP2024010',
    name: '한예진',
    email: 'han.yj@example.com',
    mobile: '010-0123-4567',
    birthDate: '1998-05-20',
    gender: 'FEMALE',
    hireDate: '2024-01-02',
    employmentStatus: 'ACTIVE',
    departmentId: 'dept-001',
    departmentName: '개발팀',
    positionId: 'pos-006',
    positionName: '사원',
    gradeId: 'grade-005',
    gradeName: '사원',
    managerId: 'emp-001',
    managerName: '홍길동',
    profileImageUrl: undefined,
    createdAt: '2024-01-02T09:00:00Z',
    updatedAt: '2024-01-02T09:00:00Z',
  },
];

function toListItem(employee: Employee): EmployeeListItem {
  return {
    id: employee.id,
    employeeNumber: employee.employeeNumber,
    name: employee.name,
    email: employee.email,
    departmentName: employee.departmentName,
    positionName: employee.positionName,
    gradeName: employee.gradeName,
    employmentStatus: employee.employmentStatus,
    hireDate: employee.hireDate,
    profileImageUrl: employee.profileImageUrl,
  };
}

const mockDepartments: Record<string, string> = {
  'dept-001': '개발팀',
  'dept-002': '인사팀',
  'dept-003': '재무팀',
  'dept-004': '마케팅팀',
  'dept-005': '디자인팀',
  'dept-006': '영업팀',
};

const mockGrades: Record<string, string> = {
  'grade-001': '부장',
  'grade-002': '차장',
  'grade-003': '과장',
  'grade-004': '대리',
  'grade-005': '사원',
};

const mockPositions: Record<string, string> = {
  'pos-001': '팀장',
  'pos-002': '선임',
  'pos-003': '매니저',
  'pos-004': '주임',
  'pos-005': '책임',
  'pos-006': '사원',
};

export const employeeHandlers = [
  // Get employees list
  http.get('/api/v1/employees', async ({ request }) => {
    await delay(400);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const keyword = url.searchParams.get('keyword') || '';
    const employmentStatus = url.searchParams.get('employmentStatus') as EmploymentStatus | null;

    let filteredEmployees = [...mockEmployees];

    // Filter by keyword (name or employee number)
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      filteredEmployees = filteredEmployees.filter(
        emp =>
          emp.name.toLowerCase().includes(lowerKeyword) ||
          emp.employeeNumber.toLowerCase().includes(lowerKeyword) ||
          emp.email.toLowerCase().includes(lowerKeyword)
      );
    }

    // Filter by employment status
    if (employmentStatus) {
      filteredEmployees = filteredEmployees.filter(emp => emp.employmentStatus === employmentStatus);
    }

    const totalElements = filteredEmployees.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const end = start + size;
    const content = filteredEmployees.slice(start, end).map(toListItem);

    return HttpResponse.json({
      success: true,
      data: {
        content,
        page,
        size,
        totalElements,
        totalPages,
        first: page === 0,
        last: page >= totalPages - 1,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get employee detail
  http.get('/api/v1/employees/:id', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const employee = mockEmployees.find(emp => emp.id === id);

    if (!employee) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'EMP_001',
            message: '직원을 찾을 수 없습니다.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: employee,
      timestamp: new Date().toISOString(),
    });
  }),

  // Create employee
  http.post('/api/v1/employees', async ({ request }) => {
    await delay(300);

    const body = await request.json() as Record<string, unknown>;

    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      tenantId: 'tenant-001',
      employeeNumber: body.employeeNumber as string,
      name: body.name as string,
      nameEn: body.nameEn as string | undefined,
      email: body.email as string,
      mobile: body.mobile as string | undefined,
      birthDate: body.birthDate as string | undefined,
      gender: body.gender as 'MALE' | 'FEMALE' | undefined,
      hireDate: body.hireDate as string,
      employmentStatus: 'ACTIVE',
      departmentId: body.departmentId as string,
      departmentName: mockDepartments[body.departmentId as string] || '부서',
      positionId: body.positionId as string | undefined,
      positionName: body.positionId ? mockPositions[body.positionId as string] : undefined,
      gradeId: body.gradeId as string | undefined,
      gradeName: body.gradeId ? mockGrades[body.gradeId as string] : undefined,
      managerId: body.managerId as string | undefined,
      managerName: undefined,
      profileImageUrl: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockEmployees.unshift(newEmployee);

    return HttpResponse.json({
      success: true,
      data: newEmployee,
      message: '직원이 등록되었습니다.',
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Update employee
  http.put('/api/v1/employees/:id', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const index = mockEmployees.findIndex(emp => emp.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'EMP_001', message: '직원을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    mockEmployees[index] = {
      ...mockEmployees[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: mockEmployees[index],
      timestamp: new Date().toISOString(),
    });
  }),

  // Delete employee
  http.delete('/api/v1/employees/:id', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockEmployees.findIndex(emp => emp.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'EMP_001', message: '직원을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    mockEmployees.splice(index, 1);

    return HttpResponse.json({
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }),
];
