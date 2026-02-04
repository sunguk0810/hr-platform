export { default as EmployeeListPage } from './pages/EmployeeListPage';
export { default as EmployeeDetailPage } from './pages/EmployeeDetailPage';
export { default as RecordCardPage } from './pages/RecordCardPage';
export { default as PrivacyAccessLogPage } from './pages/PrivacyAccessLogPage';

// Employee Detail Components
export * from './components/EmployeeDetail';
export { ChangeRequestForm } from './components/ChangeRequestForm';
export { PersonnelCard, type PersonnelCardData } from './components/PersonnelCard';

// SDD 정합성 컴포넌트
export { ResignationDialog } from './components/ResignationDialog';
export { TransferDialog } from './components/TransferDialog';
export { TransferList } from './components/TransferList';
export { UnmaskDialog } from './components/UnmaskDialog';
export { EmployeeHistory } from './components/EmployeeHistory';
export { RecordCard } from './components/RecordCard';

// PRD FR-EMP-002: 개인정보 조회 관련
export { PrivacyAccessRequestDialog } from './components/PrivacyAccessRequestDialog';
export { ConcurrentPositionList } from './components/EmployeeDetail/ConcurrentPositionList';
export { ConcurrentPositionDialog } from './components/EmployeeDetail/ConcurrentPositionDialog';

// Hooks
export * from './hooks/useEmployees';

// Services
export { employeeService } from './services/employeeService';
