import { Phone, Mail, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MobileCard, MobileCardContent } from '@/components/mobile';

interface EmployeeCardProps {
  id: string;
  name: string;
  employeeNumber?: string;
  departmentName?: string;
  positionName?: string;
  profileImageUrl?: string;
  email?: string;
  phone?: string;
  onClick?: () => void;
}

export function EmployeeCard({
  name,
  employeeNumber,
  departmentName,
  positionName,
  profileImageUrl,
  email,
  phone,
  onClick,
}: EmployeeCardProps) {
  const getInitials = (name: string) => {
    return name.slice(0, 2);
  };

  return (
    <MobileCard onClick={onClick} className="mb-3">
      <MobileCardContent>
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <Avatar className="h-14 w-14">
            <AvatarImage src={profileImageUrl} alt={name} />
            <AvatarFallback className="text-lg">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{name}</h3>
              {positionName && (
                <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                  {positionName}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {departmentName}
              {employeeNumber && <span className="ml-2 font-mono text-xs">({employeeNumber})</span>}
            </p>

            {/* Contact Info */}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="flex items-center gap-1 hover:text-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="h-3.5 w-3.5" />
                  {phone}
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-1 hover:text-primary truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[120px]">{email}</span>
                </a>
              )}
            </div>
          </div>

          {/* Arrow */}
          {onClick && (
            <ChevronRight className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
          )}
        </div>
      </MobileCardContent>
    </MobileCard>
  );
}
