export { default as NotificationCenterPage } from './pages/NotificationCenterPage';

// Components
export {
  NotificationItem,
  NotificationGroup,
  NotificationDropdown,
  NotificationSettings as NotificationSettingsComponent,
  type NotificationData,
} from './components';

// Services - NotificationType and NotificationSettings interfaces from service
export {
  notificationService,
  type NotificationType,
  type Notification,
  type NotificationSettings,
  type NotificationSearchParams,
  type UnreadCountResponse,
} from './services/notificationService';
