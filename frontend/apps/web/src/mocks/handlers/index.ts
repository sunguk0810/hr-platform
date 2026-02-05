import { authHandlers } from './authHandlers';
import { dashboardHandlers } from './dashboardHandlers';
import { employeeHandlers } from './employeeHandlers';
import { mdmHandlers } from './mdmHandlers';
import { organizationHandlers } from './organizationHandlers';
import { attendanceHandlers } from './attendanceHandlers';
import { approvalHandlers } from './approvalHandlers';
import { appointmentHandlers } from './appointmentHandlers';
import { tenantHandlers } from './tenantHandlers';
import { auditHandlers } from './auditHandlers';
import { notificationHandlers } from './notificationHandlers';
import { fileHandlers } from './fileHandlers';
import { announcementHandlers } from './announcementHandlers';
import { certificateHandlers } from './certificateHandlers';
import { recruitmentHandlers } from './recruitmentHandlers';
import { transferHandlers } from './transferHandlers';
import { headcountHandlers } from './headcountHandlers';
import { condolenceHandlers } from './condolenceHandlers';
import { committeeHandlers } from './committeeHandlers';
import { employeeCardHandlers } from './employeeCardHandlers';
import { menuHandlers } from './menuHandlers';
import { profileHandlers } from './profileHandlers';
import { helpHandlers } from './helpHandlers';

export const handlers = [
  ...authHandlers,
  ...dashboardHandlers,
  ...employeeHandlers,
  ...mdmHandlers,
  ...organizationHandlers,
  ...attendanceHandlers,
  ...approvalHandlers,
  ...appointmentHandlers,
  ...tenantHandlers,
  ...auditHandlers,
  ...notificationHandlers,
  ...fileHandlers,
  ...announcementHandlers,
  ...certificateHandlers,
  ...recruitmentHandlers,
  ...transferHandlers,
  ...headcountHandlers,
  ...condolenceHandlers,
  ...committeeHandlers,
  ...employeeCardHandlers,
  ...menuHandlers,
  ...profileHandlers,
  ...helpHandlers,
];
