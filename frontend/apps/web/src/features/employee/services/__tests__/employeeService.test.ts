import { describe, it, expect, vi, beforeEach } from 'vitest';
import { employeeService } from '../employeeService';
import { apiClient } from '@/lib/apiClient';

// Mock apiClient
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('employeeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEmployees', () => {
    it('should fetch employees list without params', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            content: [
              {
                id: '1',
                employeeNumber: 'EMP001',
                name: '홍길동',
                email: 'hong@company.com',
                departmentName: '개발팀',
                positionName: '선임',
                gradeName: 'G3',
                employmentStatus: 'ACTIVE',
                hireDate: '2020-01-01',
              },
            ],
            page: 0,
            size: 10,
            totalElements: 1,
            totalPages: 1,
            first: true,
            last: true,
          },
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await employeeService.getEmployees();

      expect(apiClient.get).toHaveBeenCalledWith('/employees', { params: undefined });
      expect(result.success).toBe(true);
      expect(result.data.content).toHaveLength(1);
    });

    it('should fetch employees with search params', async () => {
      const params = {
        page: 0,
        size: 20,
        keyword: '홍길동',
        departmentId: 'dept-001',
        employmentStatus: 'ACTIVE' as const,
      };
      const mockResponse = {
        data: {
          success: true,
          data: { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true },
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await employeeService.getEmployees(params);

      expect(apiClient.get).toHaveBeenCalledWith('/employees', { params });
    });
  });

  describe('getEmployee', () => {
    it('should fetch single employee by id', async () => {
      const mockEmployee = {
        id: '1',
        employeeNumber: 'EMP001',
        name: '홍길동',
        email: 'hong@company.com',
        departmentId: 'dept-001',
        departmentName: '개발팀',
        hireDate: '2020-01-01',
        employmentStatus: 'ACTIVE',
      };

      const mockResponse = {
        data: {
          success: true,
          data: mockEmployee,
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await employeeService.getEmployee('1');

      expect(apiClient.get).toHaveBeenCalledWith('/employees/1');
      expect(result.data.employeeNumber).toBe('EMP001');
    });
  });

  describe('createEmployee', () => {
    it('should create new employee', async () => {
      const createRequest = {
        employeeNumber: 'EMP002',
        name: '김철수',
        email: 'kim@company.com',
        hireDate: '2024-01-01',
        departmentId: 'dept-001',
      };

      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '2',
            ...createRequest,
            departmentName: '개발팀',
            employmentStatus: 'ACTIVE',
          },
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await employeeService.createEmployee(createRequest);

      expect(apiClient.post).toHaveBeenCalledWith('/employees', createRequest);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('김철수');
    });
  });

  describe('updateEmployee', () => {
    it('should update employee', async () => {
      const updateRequest = {
        name: '홍길동(수정)',
        email: 'hong.updated@company.com',
      };

      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '1',
            employeeNumber: 'EMP001',
            name: '홍길동(수정)',
            email: 'hong.updated@company.com',
            departmentId: 'dept-001',
            departmentName: '개발팀',
            hireDate: '2020-01-01',
            employmentStatus: 'ACTIVE',
          },
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      const result = await employeeService.updateEmployee('1', updateRequest);

      expect(apiClient.put).toHaveBeenCalledWith('/employees/1', updateRequest);
      expect(result.data.name).toBe('홍길동(수정)');
    });
  });

  describe('deleteEmployee', () => {
    it('should delete employee', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: null,
          message: '직원이 삭제되었습니다.',
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.delete).mockResolvedValue(mockResponse);

      const result = await employeeService.deleteEmployee('1');

      expect(apiClient.delete).toHaveBeenCalledWith('/employees/1');
      expect(result.success).toBe(true);
    });
  });

  describe('exportEmployees', () => {
    it('should export employees as blob', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/vnd.ms-excel' });
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockBlob });

      const result = await employeeService.exportEmployees();

      expect(apiClient.get).toHaveBeenCalledWith('/employees/export', {
        params: undefined,
        responseType: 'blob',
      });
      expect(result).toBeInstanceOf(Blob);
    });

    it('should export employees with filter params', async () => {
      const params = { keyword: '개발팀', employmentStatus: 'ACTIVE' as const };
      const mockBlob = new Blob(['test'], { type: 'application/vnd.ms-excel' });
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockBlob });

      await employeeService.exportEmployees(params);

      expect(apiClient.get).toHaveBeenCalledWith('/employees/export', {
        params,
        responseType: 'blob',
      });
    });
  });

  describe('importEmployees', () => {
    it('should import employees from file', async () => {
      const file = new File(['test'], 'employees.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const mockResponse = {
        data: {
          success: true,
          data: { success: 10, failed: 2, errors: ['Row 5: Invalid email'] },
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await employeeService.importEmployees(file);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/employees/import',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result.data.success).toBe(10);
      expect(result.data.failed).toBe(2);
    });
  });

  describe('bulkDelete', () => {
    it('should delete multiple employees', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { deleted: 3 },
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await employeeService.bulkDelete(['1', '2', '3']);

      expect(apiClient.post).toHaveBeenCalledWith('/employees/bulk-delete', { ids: ['1', '2', '3'] });
      expect(result.data.deleted).toBe(3);
    });
  });

  describe('getImportTemplate', () => {
    it('should get import template as blob', async () => {
      const mockBlob = new Blob(['template'], { type: 'application/vnd.ms-excel' });
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockBlob });

      const result = await employeeService.getImportTemplate();

      expect(apiClient.get).toHaveBeenCalledWith('/employees/import/template', {
        responseType: 'blob',
      });
      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('error handling', () => {
    it('should propagate 404 error for non-existent employee', async () => {
      const error = {
        response: {
          status: 404,
          data: {
            success: false,
            error: { code: 'EMP_001', message: '직원을 찾을 수 없습니다.' },
          },
        },
      };

      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(employeeService.getEmployee('nonexistent')).rejects.toEqual(error);
    });

    it('should propagate validation error', async () => {
      const error = {
        response: {
          status: 400,
          data: {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '입력값이 올바르지 않습니다.',
              details: { email: ['올바른 이메일 형식이 아닙니다.'] },
            },
          },
        },
      };

      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(
        employeeService.createEmployee({
          employeeNumber: 'EMP001',
          name: '테스트',
          email: 'invalid-email',
          hireDate: '2024-01-01',
          departmentId: 'dept-001',
        })
      ).rejects.toEqual(error);
    });
  });
});
