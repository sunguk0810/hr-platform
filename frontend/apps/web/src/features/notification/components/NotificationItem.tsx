import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Bell,
  FileText,
  Calendar,
  AlertCircle,
  Info,
  CheckCircle,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type NotificationType =
  | 'APPROVAL_REQUEST'
  | 'APPROVAL_RESULT'
  | 'LEAVE_REQUEST'
  | 'LEAVE_RESULT'
  | 'ANNOUNCEMENT'
  | 'SYSTEM'
  | 'REMINDER';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  link?: string;
  sender?: {
    name: string;
    profileImage?: string;
  };
  metadata?: Record<string, unknown>;
}

interface NotificationItemProps {
  notification: NotificationData;
  onClick?: (notification: NotificationData) => void;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  className?: string;
}

const typeIcons: Record<NotificationType, React.ReactNode> = {
  APPROVAL_REQUEST: <FileText className="h-5 w-5 text-blue-500" />,
  APPROVAL_RESULT: <CheckCircle className="h-5 w-5 text-green-500" />,
  LEAVE_REQUEST: <Calendar className="h-5 w-5 text-amber-500" />,
  LEAVE_RESULT: <Calendar className="h-5 w-5 text-green-500" />,
  ANNOUNCEMENT: <Bell className="h-5 w-5 text-purple-500" />,
  SYSTEM: <Info className="h-5 w-5 text-gray-500" />,
  REMINDER: <AlertCircle className="h-5 w-5 text-orange-500" />,
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function NotificationItem({
  notification,
  onClick,
  onMarkAsRead,
  onDelete,
  showActions = true,
  className,
}: NotificationItemProps) {
  const timeAgo = formatDistanceToNow(notification.createdAt, {
    addSuffix: true,
    locale: ko,
  });

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead?.(notification.id);
    }
    onClick?.(notification);
  };

  return (
    <div
      className={cn(
        'group relative flex gap-3 rounded-lg p-3 transition-colors',
        !notification.isRead && 'bg-primary/5',
        onClick && 'cursor-pointer hover:bg-muted/50',
        className
      )}
      onClick={handleClick}
    >
      {/* Icon or Avatar */}
      <div className="shrink-0">
        {notification.sender ? (
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={notification.sender.profileImage}
              alt={notification.sender.name}
            />
            <AvatarFallback>
              {getInitials(notification.sender.name)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            {typeIcons[notification.type]}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium', !notification.isRead && 'font-semibold')}>
              {notification.title}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
              {notification.message}
            </p>
          </div>

          {/* Unread indicator */}
          {!notification.isRead && (
            <span className="shrink-0 mt-1.5 h-2 w-2 rounded-full bg-primary" />
          )}
        </div>

        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          {notification.sender && (
            <span className="text-xs text-muted-foreground">
              · {notification.sender.name}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead?.(notification.id);
              }}
              title="읽음 표시"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(notification.id);
            }}
            title="삭제"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default NotificationItem;
