import { http, HttpResponse, delay } from 'msw';
import type { Department, DepartmentTreeNode, Position, Grade } from '@hr-platform/shared-types';

const mockDepartments: Department[] = [
  {
    id: 'dept-001',
    tenantId: 'tenant-001',
    code: 'DEV',
    name: '개발본부',
    nameEn: 'Development Division',
    parentId: undefined,
    parentName: undefined,
    level: 1,
    sortOrder: 1,
    managerId: 'emp-001',
    managerName: '홍길동',
    status: 'ACTIVE',
    employeeCount: 25,
    createdAt: '2020-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dept-002',
    tenantId: 'tenant-001',
    code: 'DEV-FE',
    name: '프론트엔드팀',
    nameEn: 'Frontend Team',
    parentId: 'dept-001',
    parentName: '개발본부',
    level: 2,
    sortOrder: 1,
    managerId: 'emp-002',
    managerName: '김철수',
    status: 'ACTIVE',
    employeeCount: 8,
    createdAt: '2020-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dept-003',
    tenantId: 'tenant-001',
    code: 'DEV-BE',
    name: '백엔드팀',
    nameEn: 'Backend Team',
    parentId: 'dept-001',
    parentName: '개발본부',
    level: 2,
    sortOrder: 2,
    managerId: 'emp-006',
    managerName: '정민호',
    status: 'ACTIVE',
    employeeCount: 10,
    createdAt: '2020-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dept-004',
    tenantId: 'tenant-001',
    code: 'DEV-QA',
    name: 'QA팀',
    nameEn: 'QA Team',
    parentId: 'dept-001',
    parentName: '개발본부',
    level: 2,
    sortOrder: 3,
    managerId: undefined,
    managerName: undefined,
    status: 'ACTIVE',
    employeeCount: 5,
    createdAt: '2021-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dept-005',
    tenantId: 'tenant-001',
    code: 'HR',
    name: '인사팀',
    nameEn: 'HR Team',
    parentId: undefined,
    parentName: undefined,
    level: 1,
    sortOrder: 2,
    managerId: 'emp-003',
    managerName: '이영희',
    status: 'ACTIVE',
    employeeCount: 6,
    createdAt: '2020-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dept-006',
    tenantId: 'tenant-001',
    code: 'FIN',
    name: '재무팀',
    nameEn: 'Finance Team',
    parentId: undefined,
    parentName: undefined,
    level: 1,
    sortOrder: 3,
    managerId: undefined,
    managerName: undefined,
    status: 'ACTIVE',
    employeeCount: 4,
    createdAt: '2020-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dept-007',
    tenantId: 'tenant-001',
    code: 'MKT',
    name: '마케팅본부',
    nameEn: 'Marketing Division',
    parentId: undefined,
    parentName: undefined,
    level: 1,
    sortOrder: 4,
    managerId: 'emp-005',
    managerName: '최수진',
    status: 'ACTIVE',
    employeeCount: 12,
    createdAt: '2020-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dept-008',
    tenantId: 'tenant-001',
    code: 'MKT-DG',
    name: '디지털마케팅팀',
    nameEn: 'Digital Marketing Team',
    parentId: 'dept-007',
    parentName: '마케팅본부',
    level: 2,
    sortOrder: 1,
    managerId: undefined,
    managerName: undefined,
    status: 'ACTIVE',
    employeeCount: 5,
    createdAt: '2021-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dept-009',
    tenantId: 'tenant-001',
    code: 'MKT-BR',
    name: '브랜드팀',
    nameEn: 'Brand Team',
    parentId: 'dept-007',
    parentName: '마케팅본부',
    level: 2,
    sortOrder: 2,
    managerId: 'emp-007',
    managerName: '강하늘',
    status: 'ACTIVE',
    employeeCount: 4,
    createdAt: '2021-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dept-010',
    tenantId: 'tenant-001',
    code: 'SALES',
    name: '영업팀',
    nameEn: 'Sales Team',
    parentId: undefined,
    parentName: undefined,
    level: 1,
    sortOrder: 5,
    managerId: 'emp-009',
    managerName: '임준혁',
    status: 'ACTIVE',
    employeeCount: 8,
    createdAt: '2020-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockPositions: Position[] = [
  { id: 'pos-001', tenantId: 'tenant-001', code: 'TL', name: '팀장', nameEn: 'Team Leader', sortOrder: 1, description: '팀을 이끄는 리더', createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
  { id: 'pos-002', tenantId: 'tenant-001', code: 'SR', name: '선임', nameEn: 'Senior', sortOrder: 2, description: '경력 직원', createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
  { id: 'pos-003', tenantId: 'tenant-001', code: 'MG', name: '매니저', nameEn: 'Manager', sortOrder: 3, description: '관리자', createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
  { id: 'pos-004', tenantId: 'tenant-001', code: 'JR', name: '주임', nameEn: 'Junior', sortOrder: 4, description: '주니어 직원', createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
  { id: 'pos-005', tenantId: 'tenant-001', code: 'PL', name: '책임', nameEn: 'Principal', sortOrder: 5, description: '책임 직원', createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
  { id: 'pos-006', tenantId: 'tenant-001', code: 'ST', name: '사원', nameEn: 'Staff', sortOrder: 6, description: '일반 사원', createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
];

const mockGrades: Grade[] = [
  { id: 'grade-001', tenantId: 'tenant-001', code: 'G1', name: '부장', nameEn: 'Director', level: 1, sortOrder: 1, description: '부장급', createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
  { id: 'grade-002', tenantId: 'tenant-001', code: 'G2', name: '차장', nameEn: 'Deputy Director', level: 2, sortOrder: 2, description: '차장급', createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
  { id: 'grade-003', tenantId: 'tenant-001', code: 'G3', name: '과장', nameEn: 'Manager', level: 3, sortOrder: 3, description: '과장급', createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
  { id: 'grade-004', tenantId: 'tenant-001', code: 'G4', name: '대리', nameEn: 'Assistant Manager', level: 4, sortOrder: 4, description: '대리급', createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
  { id: 'grade-005', tenantId: 'tenant-001', code: 'G5', name: '사원', nameEn: 'Staff', level: 5, sortOrder: 5, description: '사원급', createdAt: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' },
];

function buildDepartmentTree(departments: Department[]): DepartmentTreeNode[] {
  const nodeMap = new Map<string, DepartmentTreeNode>();
  const roots: DepartmentTreeNode[] = [];

  // Create nodes
  departments.forEach(dept => {
    nodeMap.set(dept.id, {
      id: dept.id,
      code: dept.code,
      name: dept.name,
      level: dept.level,
      sortOrder: dept.sortOrder,
      employeeCount: dept.employeeCount,
      children: [],
    });
  });

  // Build tree
  departments.forEach(dept => {
    const node = nodeMap.get(dept.id)!;
    if (dept.parentId) {
      const parent = nodeMap.get(dept.parentId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  // Sort children
  const sortChildren = (nodes: DepartmentTreeNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    nodes.forEach(node => sortChildren(node.children));
  };
  sortChildren(roots);

  return roots;
}

export const organizationHandlers = [
  // Get organization tree
  http.get('/api/v1/departments/tree', async () => {
    await delay(300);

    const tree = buildDepartmentTree(mockDepartments);

    return HttpResponse.json({
      success: true,
      data: tree,
      timestamp: new Date().toISOString(),
    });
  }),

  // Get departments list
  http.get('/api/v1/departments', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '20', 10);
    const keyword = url.searchParams.get('keyword') || '';
    const status = url.searchParams.get('status');

    let filtered = [...mockDepartments];

    if (keyword) {
      const lower = keyword.toLowerCase();
      filtered = filtered.filter(
        d => d.code.toLowerCase().includes(lower) ||
             d.name.toLowerCase().includes(lower)
      );
    }

    if (status) {
      filtered = filtered.filter(d => d.status === status);
    }

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size);

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

  // Get department detail
  http.get('/api/v1/departments/:id', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const department = mockDepartments.find(d => d.id === id);

    if (!department) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'ORG_001', message: '부서를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: department,
      timestamp: new Date().toISOString(),
    });
  }),

  // Create department
  http.post('/api/v1/departments', async ({ request }) => {
    await delay(300);

    const body = await request.json() as Record<string, unknown>;
    const parentDept = body.parentId ? mockDepartments.find(d => d.id === body.parentId) : null;

    const newDepartment: Department = {
      id: `dept-${Date.now()}`,
      tenantId: 'tenant-001',
      code: body.code as string,
      name: body.name as string,
      nameEn: body.nameEn as string | undefined,
      parentId: body.parentId as string | undefined,
      parentName: parentDept?.name,
      level: parentDept ? parentDept.level + 1 : 1,
      sortOrder: (body.sortOrder as number) || mockDepartments.length + 1,
      managerId: body.managerId as string | undefined,
      managerName: undefined,
      status: 'ACTIVE',
      employeeCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockDepartments.push(newDepartment);

    return HttpResponse.json({
      success: true,
      data: newDepartment,
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Update department
  http.put('/api/v1/departments/:id', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const index = mockDepartments.findIndex(d => d.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'ORG_001', message: '부서를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    mockDepartments[index] = {
      ...mockDepartments[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: mockDepartments[index],
      timestamp: new Date().toISOString(),
    });
  }),

  // Delete department
  http.delete('/api/v1/departments/:id', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockDepartments.findIndex(d => d.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'ORG_001', message: '부서를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Check for child departments
    const hasChildren = mockDepartments.some(d => d.parentId === id);
    if (hasChildren) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'ORG_002', message: '하위 부서가 존재하여 삭제할 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    mockDepartments.splice(index, 1);

    return HttpResponse.json({
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }),

  // Get positions
  http.get('/api/v1/positions', async () => {
    await delay(200);

    return HttpResponse.json({
      success: true,
      data: mockPositions,
      timestamp: new Date().toISOString(),
    });
  }),

  // Create position
  http.post('/api/v1/positions', async ({ request }) => {
    await delay(300);

    const body = await request.json() as Record<string, unknown>;

    const newPosition: Position = {
      id: `pos-${Date.now()}`,
      tenantId: 'tenant-001',
      code: body.code as string,
      name: body.name as string,
      nameEn: body.nameEn as string | undefined,
      sortOrder: (body.sortOrder as number) || mockPositions.length + 1,
      description: body.description as string | undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockPositions.push(newPosition);

    return HttpResponse.json({
      success: true,
      data: newPosition,
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Update position
  http.put('/api/v1/positions/:id', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const index = mockPositions.findIndex(p => p.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'ORG_003', message: '직책을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    mockPositions[index] = {
      ...mockPositions[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: mockPositions[index],
      timestamp: new Date().toISOString(),
    });
  }),

  // Delete position
  http.delete('/api/v1/positions/:id', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockPositions.findIndex(p => p.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'ORG_003', message: '직책을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    mockPositions.splice(index, 1);

    return HttpResponse.json({
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }),

  // Get grades
  http.get('/api/v1/grades', async () => {
    await delay(200);

    return HttpResponse.json({
      success: true,
      data: mockGrades,
      timestamp: new Date().toISOString(),
    });
  }),

  // Create grade
  http.post('/api/v1/grades', async ({ request }) => {
    await delay(300);

    const body = await request.json() as Record<string, unknown>;

    const newGrade: Grade = {
      id: `grade-${Date.now()}`,
      tenantId: 'tenant-001',
      code: body.code as string,
      name: body.name as string,
      nameEn: body.nameEn as string | undefined,
      level: (body.level as number) || mockGrades.length + 1,
      sortOrder: (body.sortOrder as number) || mockGrades.length + 1,
      description: body.description as string | undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockGrades.push(newGrade);

    return HttpResponse.json({
      success: true,
      data: newGrade,
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Update grade
  http.put('/api/v1/grades/:id', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const index = mockGrades.findIndex(g => g.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'ORG_004', message: '직급을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    mockGrades[index] = {
      ...mockGrades[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: mockGrades[index],
      timestamp: new Date().toISOString(),
    });
  }),

  // Delete grade
  http.delete('/api/v1/grades/:id', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockGrades.findIndex(g => g.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'ORG_004', message: '직급을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    mockGrades.splice(index, 1);

    return HttpResponse.json({
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }),

  // Organization History
  http.get('/api/v1/departments/history', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '20', 10);
    const departmentId = url.searchParams.get('departmentId');
    const eventType = url.searchParams.get('eventType');

    // Generate mock history data
    const mockHistory = [
      {
        id: 'hist-001',
        type: 'department_created',
        date: '2024-01-15T09:00:00Z',
        title: 'QA팀 신설',
        description: '개발본부 산하에 QA팀이 신설되었습니다.',
        departmentId: 'dept-004',
        departmentName: 'QA팀',
        actor: { id: 'emp-001', name: '홍길동' },
      },
      {
        id: 'hist-002',
        type: 'department_renamed',
        date: '2024-01-10T14:30:00Z',
        title: '프론트엔드팀 명칭 변경',
        description: '웹개발팀에서 프론트엔드팀으로 명칭이 변경되었습니다.',
        departmentId: 'dept-002',
        departmentName: '프론트엔드팀',
        previousValue: '웹개발팀',
        newValue: '프론트엔드팀',
        actor: { id: 'emp-001', name: '홍길동' },
      },
      {
        id: 'hist-003',
        type: 'employee_transferred',
        date: '2024-01-08T10:00:00Z',
        title: '직원 부서 이동',
        description: '김철수님이 백엔드팀에서 프론트엔드팀으로 이동하였습니다.',
        departmentId: 'dept-002',
        departmentName: '프론트엔드팀',
        previousValue: '백엔드팀',
        newValue: '프론트엔드팀',
        actor: { id: 'emp-003', name: '이영희' },
      },
      {
        id: 'hist-004',
        type: 'employee_joined',
        date: '2024-01-05T09:00:00Z',
        title: '신규 입사',
        description: '한예진님이 개발본부 프론트엔드팀에 입사하였습니다.',
        departmentId: 'dept-002',
        departmentName: '프론트엔드팀',
        actor: { id: 'emp-003', name: '이영희' },
      },
      {
        id: 'hist-005',
        type: 'department_moved',
        date: '2024-01-02T11:00:00Z',
        title: '부서 이관',
        description: 'QA팀이 개발본부에서 품질관리본부로 이관되었습니다.',
        departmentId: 'dept-004',
        departmentName: 'QA팀',
        previousValue: '개발본부',
        newValue: '품질관리본부',
        actor: { id: 'emp-001', name: '홍길동' },
      },
      {
        id: 'hist-006',
        type: 'employee_left',
        date: '2023-12-31T18:00:00Z',
        title: '퇴사',
        description: '최수진님이 마케팅팀에서 퇴사하였습니다.',
        departmentId: 'dept-006',
        departmentName: '마케팅팀',
        actor: { id: 'emp-003', name: '이영희' },
      },
    ];

    let filtered = [...mockHistory];

    if (departmentId) {
      filtered = filtered.filter(h => h.departmentId === departmentId);
    }

    if (eventType) {
      filtered = filtered.filter(h => h.type === eventType);
    }

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size);

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

  // Department History
  http.get('/api/v1/departments/:id/history', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const department = mockDepartments.find(d => d.id === id);

    if (!department) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'ORG_001', message: '부서를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Generate mock history for specific department
    const mockHistory = [
      {
        id: `hist-${id}-001`,
        type: 'department_created',
        date: department.createdAt,
        title: `${department.name} 생성`,
        description: `${department.name}이(가) 생성되었습니다.`,
        departmentId: id,
        departmentName: department.name,
        actor: { id: 'emp-001', name: '홍길동' },
      },
    ];

    return HttpResponse.json({
      success: true,
      data: mockHistory,
      timestamp: new Date().toISOString(),
    });
  }),

  // Get department employees
  http.get('/api/v1/departments/:id/employees', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const department = mockDepartments.find(d => d.id === id);

    if (!department) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'ORG_001', message: '부서를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Mock employees for each department
    const departmentEmployees: Record<string, Array<{ id: string; name: string; employeeNumber: string; positionName: string; gradeName: string; departmentName: string; departmentId: string; profileImageUrl?: string }>> = {
      'dept-001': [
        { id: 'emp-001', name: '홍길동', employeeNumber: 'EMP-2020-001', positionName: '팀장', gradeName: '부장', departmentName: '개발본부', departmentId: 'dept-001' },
        { id: 'emp-010', name: '윤서준', employeeNumber: 'EMP-2021-010', positionName: '선임', gradeName: '차장', departmentName: '개발본부', departmentId: 'dept-001' },
      ],
      'dept-002': [
        { id: 'emp-002', name: '김철수', employeeNumber: 'EMP-2020-002', positionName: '팀장', gradeName: '과장', departmentName: '프론트엔드팀', departmentId: 'dept-002' },
        { id: 'emp-011', name: '한예진', employeeNumber: 'EMP-2023-011', positionName: '사원', gradeName: '사원', departmentName: '프론트엔드팀', departmentId: 'dept-002' },
        { id: 'emp-012', name: '조민기', employeeNumber: 'EMP-2022-012', positionName: '주임', gradeName: '대리', departmentName: '프론트엔드팀', departmentId: 'dept-002' },
      ],
      'dept-003': [
        { id: 'emp-006', name: '정민호', employeeNumber: 'EMP-2020-006', positionName: '팀장', gradeName: '과장', departmentName: '백엔드팀', departmentId: 'dept-003' },
        { id: 'emp-013', name: '송유진', employeeNumber: 'EMP-2021-013', positionName: '선임', gradeName: '대리', departmentName: '백엔드팀', departmentId: 'dept-003' },
        { id: 'emp-014', name: '남기훈', employeeNumber: 'EMP-2022-014', positionName: '사원', gradeName: '사원', departmentName: '백엔드팀', departmentId: 'dept-003' },
      ],
      'dept-004': [
        { id: 'emp-015', name: '오세영', employeeNumber: 'EMP-2021-015', positionName: '선임', gradeName: '대리', departmentName: 'QA팀', departmentId: 'dept-004' },
        { id: 'emp-016', name: '권다은', employeeNumber: 'EMP-2023-016', positionName: '사원', gradeName: '사원', departmentName: 'QA팀', departmentId: 'dept-004' },
      ],
      'dept-005': [
        { id: 'emp-003', name: '이영희', employeeNumber: 'EMP-2019-003', positionName: '팀장', gradeName: '부장', departmentName: '인사팀', departmentId: 'dept-005' },
        { id: 'emp-004', name: '박지민', employeeNumber: 'EMP-2021-004', positionName: '선임', gradeName: '과장', departmentName: '인사팀', departmentId: 'dept-005' },
        { id: 'emp-017', name: '황민서', employeeNumber: 'EMP-2022-017', positionName: '주임', gradeName: '대리', departmentName: '인사팀', departmentId: 'dept-005' },
      ],
      'dept-006': [
        { id: 'emp-018', name: '서지현', employeeNumber: 'EMP-2020-018', positionName: '매니저', gradeName: '과장', departmentName: '재무팀', departmentId: 'dept-006' },
        { id: 'emp-019', name: '전우성', employeeNumber: 'EMP-2022-019', positionName: '사원', gradeName: '사원', departmentName: '재무팀', departmentId: 'dept-006' },
      ],
      'dept-007': [
        { id: 'emp-005', name: '최수진', employeeNumber: 'EMP-2019-005', positionName: '팀장', gradeName: '부장', departmentName: '마케팅본부', departmentId: 'dept-007' },
        { id: 'emp-020', name: '배진우', employeeNumber: 'EMP-2021-020', positionName: '선임', gradeName: '차장', departmentName: '마케팅본부', departmentId: 'dept-007' },
      ],
      'dept-008': [
        { id: 'emp-021', name: '안소희', employeeNumber: 'EMP-2022-021', positionName: '선임', gradeName: '대리', departmentName: '디지털마케팅팀', departmentId: 'dept-008' },
        { id: 'emp-022', name: '노태민', employeeNumber: 'EMP-2023-022', positionName: '사원', gradeName: '사원', departmentName: '디지털마케팅팀', departmentId: 'dept-008' },
      ],
      'dept-009': [
        { id: 'emp-007', name: '강하늘', employeeNumber: 'EMP-2020-007', positionName: '팀장', gradeName: '과장', departmentName: '브랜드팀', departmentId: 'dept-009' },
        { id: 'emp-023', name: '문지원', employeeNumber: 'EMP-2021-023', positionName: '선임', gradeName: '대리', departmentName: '브랜드팀', departmentId: 'dept-009' },
      ],
      'dept-010': [
        { id: 'emp-009', name: '임준혁', employeeNumber: 'EMP-2019-009', positionName: '팀장', gradeName: '부장', departmentName: '영업팀', departmentId: 'dept-010' },
        { id: 'emp-008', name: '윤서연', employeeNumber: 'EMP-2020-008', positionName: '선임', gradeName: '과장', departmentName: '영업팀', departmentId: 'dept-010' },
        { id: 'emp-024', name: '유재현', employeeNumber: 'EMP-2022-024', positionName: '주임', gradeName: '대리', departmentName: '영업팀', departmentId: 'dept-010' },
      ],
    };

    const employees = departmentEmployees[id as string] || [];

    return HttpResponse.json({
      success: true,
      data: employees,
      timestamp: new Date().toISOString(),
    });
  }),

  // Get department reorg impact analysis
  http.get('/api/v1/organizations/departments/:id/impact', async ({ params, request }) => {
    await delay(400);

    const { id } = params;
    const url = new URL(request.url);
    const changeType = url.searchParams.get('changeType') || 'delete';

    const department = mockDepartments.find(d => d.id === id);

    if (!department) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'ORG_001', message: '부서를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Generate mock affected employees based on the department
    const mockEmployees = [
      {
        id: 'emp-101',
        name: '김민수',
        employeeNumber: 'EMP-2020-001',
        currentDepartment: department.name,
        newDepartment: changeType === 'delete' ? '미정' : changeType === 'merge' ? '통합부서' : department.name,
        position: '과장',
      },
      {
        id: 'emp-102',
        name: '박지영',
        employeeNumber: 'EMP-2020-002',
        currentDepartment: department.name,
        newDepartment: changeType === 'delete' ? '미정' : changeType === 'merge' ? '통합부서' : department.name,
        position: '대리',
      },
      {
        id: 'emp-103',
        name: '이승훈',
        employeeNumber: 'EMP-2021-003',
        currentDepartment: department.name,
        newDepartment: changeType === 'delete' ? '-' : changeType === 'merge' ? '통합부서' : department.name,
        position: '팀장',
      },
      {
        id: 'emp-104',
        name: '정수현',
        employeeNumber: 'EMP-2022-004',
        currentDepartment: department.name,
        newDepartment: changeType === 'delete' ? '미정' : changeType === 'merge' ? '통합부서' : department.name,
        position: '사원',
      },
      {
        id: 'emp-105',
        name: '한예진',
        employeeNumber: 'EMP-2023-005',
        currentDepartment: department.name,
        newDepartment: changeType === 'delete' ? '미정' : changeType === 'merge' ? '통합부서' : department.name,
        position: '사원',
      },
    ];

    // Limit employees based on department employee count (capped at our mock list size)
    const count = Math.min(department.employeeCount, mockEmployees.length);
    const employees = mockEmployees.slice(0, count);

    return HttpResponse.json({
      success: true,
      data: {
        affectedCount: count,
        employees,
      },
      timestamp: new Date().toISOString(),
    });
  }),
];
