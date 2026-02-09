import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TenantStatusBadge } from '@/components/common/StatusBadge';
import { Building2, Users, Briefcase, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import type { TenantListItem, TenantDetail } from '@hr-platform/shared-types';

export interface TenantCardProps {
  tenant: TenantListItem | TenantDetail;
  onClick?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export function TenantCard({ tenant, onClick, onViewDetails, className }: TenantCardProps) {
  const detail = tenant as TenantDetail;
  const hasBranding = 'branding' in tenant;

  return (
    <Card
      className={cn(
        'transition-shadow hover:shadow-md',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {hasBranding && detail.logoUrl ? (
              <OptimizedImage
                src={detail.logoUrl}
                alt={tenant.name}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div
                className="h-12 w-12 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: hasBranding
                    ? detail.branding?.primaryColor || '#3B82F6'
                    : '#3B82F6',
                }}
              >
                <Building2 className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h3 className="font-semibold">{tenant.name}</h3>
              <p className="text-sm text-muted-foreground">{tenant.code}</p>
            </div>
          </div>
          <TenantStatusBadge status={tenant.status} />
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{tenant.employeeCount}명</span>
          </div>
          {'departmentCount' in tenant && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span>{(tenant as TenantDetail).departmentCount}개 부서</span>
            </div>
          )}
        </div>
        {tenant.adminEmail && (
          <p className="mt-2 text-sm text-muted-foreground truncate">
            {tenant.adminEmail}
          </p>
        )}
      </CardContent>
      {onViewDetails && (
        <CardFooter className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
          >
            상세 보기
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
