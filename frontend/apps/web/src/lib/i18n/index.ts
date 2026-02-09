import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Korean
import koCommon from './locales/ko/common.json';
import koAuth from './locales/ko/auth.json';
import koDashboard from './locales/ko/dashboard.json';
import koNavigation from './locales/ko/navigation.json';
import koSettings from './locales/ko/settings.json';
import koEmployee from './locales/ko/employee.json';
import koApproval from './locales/ko/approval.json';
import koFile from './locales/ko/file.json';
import koCondolence from './locales/ko/condolence.json';
import koValidation from './locales/ko/validation.json';
import koAccessibility from './locales/ko/accessibility.json';
import koStatus from './locales/ko/status.json';
import koOrganization from './locales/ko/organization.json';
import koCommittee from './locales/ko/committee.json';
import koAnnouncement from './locales/ko/announcement.json';
import koHeadcount from './locales/ko/headcount.json';
import koEmployeeCard from './locales/ko/employeeCard.json';
import koAudit from './locales/ko/audit.json';
import koTransfer from './locales/ko/transfer.json';
import koMenu from './locales/ko/menu.json';
import koAppointment from './locales/ko/appointment.json';
import koCertificate from './locales/ko/certificate.json';
import koHelp from './locales/ko/help.json';
import koNotification from './locales/ko/notification.json';
import koMdm from './locales/ko/mdm.json';

// English
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enNavigation from './locales/en/navigation.json';
import enSettings from './locales/en/settings.json';
import enEmployee from './locales/en/employee.json';
import enApproval from './locales/en/approval.json';
import enFile from './locales/en/file.json';
import enCondolence from './locales/en/condolence.json';
import enValidation from './locales/en/validation.json';
import enAccessibility from './locales/en/accessibility.json';
import enStatus from './locales/en/status.json';
import enOrganization from './locales/en/organization.json';
import enCommittee from './locales/en/committee.json';
import enAnnouncement from './locales/en/announcement.json';
import enHeadcount from './locales/en/headcount.json';
import enEmployeeCard from './locales/en/employeeCard.json';
import enAudit from './locales/en/audit.json';
import enTransfer from './locales/en/transfer.json';
import enMenu from './locales/en/menu.json';
import enAppointment from './locales/en/appointment.json';
import enCertificate from './locales/en/certificate.json';
import enHelp from './locales/en/help.json';
import enNotification from './locales/en/notification.json';
import enMdm from './locales/en/mdm.json';

const resources = {
  ko: {
    common: koCommon,
    auth: koAuth,
    dashboard: koDashboard,
    navigation: koNavigation,
    settings: koSettings,
    employee: koEmployee,
    approval: koApproval,
    file: koFile,
    condolence: koCondolence,
    validation: koValidation,
    accessibility: koAccessibility,
    status: koStatus,
    organization: koOrganization,
    committee: koCommittee,
    announcement: koAnnouncement,
    headcount: koHeadcount,
    employeeCard: koEmployeeCard,
    audit: koAudit,
    transfer: koTransfer,
    menu: koMenu,
    appointment: koAppointment,
    certificate: koCertificate,
    help: koHelp,
    notification: koNotification,
    mdm: koMdm,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    navigation: enNavigation,
    settings: enSettings,
    employee: enEmployee,
    approval: enApproval,
    file: enFile,
    condolence: enCondolence,
    validation: enValidation,
    accessibility: enAccessibility,
    status: enStatus,
    organization: enOrganization,
    committee: enCommittee,
    announcement: enAnnouncement,
    headcount: enHeadcount,
    employeeCard: enEmployeeCard,
    audit: enAudit,
    transfer: enTransfer,
    menu: enMenu,
    appointment: enAppointment,
    certificate: enCertificate,
    help: enHelp,
    notification: enNotification,
    mdm: enMdm,
  },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: 'ko',
  fallbackLng: 'ko',
  ns: [
    'common',
    'auth',
    'dashboard',
    'navigation',
    'settings',
    'employee',
    'approval',
    'file',
    'condolence',
    'validation',
    'accessibility',
    'status',
    'organization',
    'committee',
    'announcement',
    'headcount',
    'employeeCard',
    'audit',
    'transfer',
    'menu',
    'appointment',
    'certificate',
    'help',
    'notification',
    'mdm',
  ],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
