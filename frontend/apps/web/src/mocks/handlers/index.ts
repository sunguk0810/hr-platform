import { isMockEnabled } from '../../lib/featureFlags';
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
import { employeeNumberRuleHandlers } from './employeeNumberRuleHandlers';
import { myInfoChangeHandlers } from './myInfoChangeHandlers';
import { fileUploadPolicyHandlers } from './fileUploadPolicyHandlers';
import { notificationChannelHandlers } from './notificationChannelHandlers';

export function getActiveHandlers() {
  const handlers: any[] = [];

  if (isMockEnabled('auth')) handlers.push(...authHandlers);
  if (isMockEnabled('dashboard')) handlers.push(...dashboardHandlers);
  if (isMockEnabled('employee')) handlers.push(...employeeHandlers);
  if (isMockEnabled('mdm')) handlers.push(...mdmHandlers);
  if (isMockEnabled('organization')) handlers.push(...organizationHandlers);
  if (isMockEnabled('attendance')) handlers.push(...attendanceHandlers);
  if (isMockEnabled('approval')) handlers.push(...approvalHandlers);
  if (isMockEnabled('appointment')) handlers.push(...appointmentHandlers);
  if (isMockEnabled('tenant')) handlers.push(...tenantHandlers);
  if (isMockEnabled('audit')) handlers.push(...auditHandlers);
  if (isMockEnabled('notification')) handlers.push(...notificationHandlers);
  if (isMockEnabled('file')) handlers.push(...fileHandlers);
  if (isMockEnabled('announcement')) handlers.push(...announcementHandlers);
  if (isMockEnabled('certificate')) handlers.push(...certificateHandlers);
  if (isMockEnabled('recruitment')) handlers.push(...recruitmentHandlers);
  if (isMockEnabled('transfer')) handlers.push(...transferHandlers);
  if (isMockEnabled('headcount')) handlers.push(...headcountHandlers);
  if (isMockEnabled('condolence')) handlers.push(...condolenceHandlers);
  if (isMockEnabled('committee')) handlers.push(...committeeHandlers);
  if (isMockEnabled('employee_card')) handlers.push(...employeeCardHandlers);
  if (isMockEnabled('menu')) handlers.push(...menuHandlers);
  if (isMockEnabled('profile')) handlers.push(...profileHandlers);
  if (isMockEnabled('help')) handlers.push(...helpHandlers);
  if (isMockEnabled('employee_number_rule')) handlers.push(...employeeNumberRuleHandlers);
  if (isMockEnabled('my_info_change')) handlers.push(...myInfoChangeHandlers);
  if (isMockEnabled('file_upload_policy')) handlers.push(...fileUploadPolicyHandlers);
  if (isMockEnabled('notification_channel')) handlers.push(...notificationChannelHandlers);

  return handlers;
}

// Backward compatibility
export const handlers = getActiveHandlers();
