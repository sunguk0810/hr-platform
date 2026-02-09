import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Handle, Position, NodeProps } from 'reactflow';
import { Building2, Users, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface DepartmentNodeData {
  type: 'department';
  name: string;
  code: string;
  managerName?: string;
  managerImage?: string;
  employeeCount: number;
  level: number;
}

export interface EmployeeNodeData {
  type: 'employee';
  name: string;
  employeeNumber: string;
  position: string;
  profileImage?: string;
  department: string;
}

export type OrgNodeData = DepartmentNodeData | EmployeeNodeData;

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const OrgChartNode = memo(({ data, selected }: NodeProps<OrgNodeData>) => {
  if (data.type === 'department') {
    return <DepartmentNode data={data} selected={selected} />;
  }
  return <EmployeeNode data={data} selected={selected} />;
});

OrgChartNode.displayName = 'OrgChartNode';

interface DepartmentNodeProps {
  data: DepartmentNodeData;
  selected?: boolean;
}

function DepartmentNode({ data, selected }: DepartmentNodeProps) {
  const { t } = useTranslation('organization');
  const { t: tCommon } = useTranslation('common');
  const levelColors = [
    'bg-primary text-primary-foreground',
    'bg-blue-500 text-white',
    'bg-green-500 text-white',
    'bg-amber-500 text-white',
    'bg-purple-500 text-white',
  ];

  const colorClass = levelColors[data.level % levelColors.length];

  return (
    <div
      className={cn(
        'relative min-w-[180px] rounded-lg border bg-card shadow-sm transition-shadow',
        selected && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-2 !border-background !bg-muted-foreground"
      />

      {/* Header */}
      <div className={cn('rounded-t-lg px-3 py-2', colorClass)}>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span className="text-sm font-medium truncate">{data.name}</span>
        </div>
        <span className="text-xs opacity-80">{data.code}</span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {data.managerName && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={data.managerImage} alt={data.managerName} />
              <AvatarFallback className="text-[10px]">
                {getInitials(data.managerName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{data.managerName}</p>
              <p className="text-[10px] text-muted-foreground">{t('orgChart.head')}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>{data.employeeCount}{tCommon('unit.person')}</span>
        </div>
      </div>

      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-2 !border-background !bg-muted-foreground"
      />
    </div>
  );
}

interface EmployeeNodeProps {
  data: EmployeeNodeData;
  selected?: boolean;
}

function EmployeeNode({ data, selected }: EmployeeNodeProps) {
  return (
    <div
      className={cn(
        'relative min-w-[150px] rounded-lg border bg-card p-3 shadow-sm transition-shadow',
        selected && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-2 !border-background !bg-muted-foreground"
      />

      <div className="flex flex-col items-center gap-2">
        <Avatar className="h-10 w-10">
          <AvatarImage src={data.profileImage} alt={data.name} />
          <AvatarFallback>
            {data.profileImage ? <User className="h-5 w-5" /> : getInitials(data.name)}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-xs text-muted-foreground">{data.position}</p>
          <p className="text-[10px] text-muted-foreground">{data.department}</p>
        </div>
      </div>

      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-2 !border-background !bg-muted-foreground"
      />
    </div>
  );
}

export default OrgChartNode;
