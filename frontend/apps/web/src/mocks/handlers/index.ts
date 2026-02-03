import { authHandlers } from './authHandlers';
import { dashboardHandlers } from './dashboardHandlers';
import { employeeHandlers } from './employeeHandlers';
import { mdmHandlers } from './mdmHandlers';
import { organizationHandlers } from './organizationHandlers';
import { attendanceHandlers } from './attendanceHandlers';
import { approvalHandlers } from './approvalHandlers';
import { tenantHandlers } from './tenantHandlers';
import { auditHandlers } from './auditHandlers';

export const handlers = [
  ...authHandlers,
  ...dashboardHandlers,
  ...employeeHandlers,
  ...mdmHandlers,
  ...organizationHandlers,
  ...attendanceHandlers,
  ...approvalHandlers,
  ...tenantHandlers,
  ...auditHandlers,
];
