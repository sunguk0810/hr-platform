import { useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Position,
  MarkerType,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export type ApprovalLineStatus = 'WAITING' | 'APPROVED' | 'REJECTED' | 'SKIPPED' | 'CURRENT';
export type ApprovalExecutionType = 'SEQUENTIAL' | 'PARALLEL' | 'AGREEMENT';
export type ParallelCompletionCondition = 'ALL' | 'ANY' | 'MAJORITY';

export interface ApprovalLineItem {
  id: string;
  order: number;
  type: 'DRAFT' | 'APPROVAL' | 'AGREEMENT' | 'REFERENCE';
  approverName: string;
  approverPosition?: string;
  approverDepartmentName?: string;
  approverImage?: string;
  status: ApprovalLineStatus;
  comment?: string;
  completedAt?: Date;
  /** Execution type - sequential (default), parallel, or agreement */
  executionType?: ApprovalExecutionType;
  /** Group ID for parallel/agreement steps - steps with same groupId execute together */
  parallelGroupId?: string;
  /** Completion condition for parallel steps */
  parallelCompletionCondition?: ParallelCompletionCondition;
  /** SDD 4.6 대결 관련 필드 */
  delegatorId?: string;
  delegatorName?: string;
  delegatedAt?: string;
  /** SDD 4.7 전결 관련 필드 */
  directApproved?: boolean;
}

interface ApprovalLineFlowProps {
  steps: ApprovalLineItem[];
  onStepClick?: (step: ApprovalLineItem) => void;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

const statusColors: Record<ApprovalLineStatus, { bg: string; border: string; text: string }> = {
  WAITING: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-600' },
  CURRENT: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-600' },
  APPROVED: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-600' },
  REJECTED: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-600' },
  SKIPPED: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-400' },
};

const statusLabels: Record<ApprovalLineStatus, string> = {
  WAITING: '대기',
  CURRENT: '진행 중',
  APPROVED: '승인',
  REJECTED: '반려',
  SKIPPED: '건너뜀',
};

const typeLabels: Record<string, string> = {
  DRAFT: '기안',
  APPROVAL: '결재',
  AGREEMENT: '합의',
  REFERENCE: '참조',
};

const executionTypeLabels: Record<ApprovalExecutionType, string> = {
  SEQUENTIAL: '순차',
  PARALLEL: '병렬',
  AGREEMENT: '합의',
};

const completionConditionLabels: Record<ParallelCompletionCondition, string> = {
  ALL: '전원 승인',
  ANY: '1인 승인',
  MAJORITY: '과반수 승인',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface ApprovalLineNodeData extends ApprovalLineItem {
  onClick?: () => void;
  isParallel?: boolean;
  parallelCount?: number;
  completionCondition?: ParallelCompletionCondition;
  /** 대결 처리 여부 */
  isDelegated?: boolean;
  /** 전결 처리 여부 */
  isDirectApproved?: boolean;
}

function ApprovalLineNode({ data }: { data: ApprovalLineNodeData }) {
  const colors = statusColors[data.status];
  const isParallel = data.executionType === 'PARALLEL' || data.executionType === 'AGREEMENT';
  const isDelegated = data.delegatorName || data.isDelegated;
  const isDirectApproved = data.directApproved || data.isDirectApproved;

  return (
    <button
      onClick={data.onClick}
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all w-[120px]',
        colors.bg,
        colors.border,
        data.onClick && 'cursor-pointer hover:shadow-md',
        isParallel && 'ring-2 ring-offset-2 ring-purple-300',
        isDelegated && 'ring-2 ring-offset-2 ring-indigo-300',
        isDirectApproved && 'ring-2 ring-offset-2 ring-teal-300'
      )}
    >
      <div className="relative">
        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
          <AvatarImage src={data.approverImage} alt={data.approverName} />
          <AvatarFallback>{getInitials(data.approverName)}</AvatarFallback>
        </Avatar>
        {data.status === 'CURRENT' && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center">
            <span className="absolute h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative h-3 w-3 rounded-full bg-blue-500" />
          </span>
        )}
        {isParallel && (
          <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-[10px] text-white font-medium">
            {data.parallelCount || '∥'}
          </span>
        )}
        {/* 대결 표시 */}
        {isDelegated && (
          <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[8px] text-white font-medium" title="대결">
            대
          </span>
        )}
        {/* 전결 표시 */}
        {isDirectApproved && (
          <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-[8px] text-white font-medium" title="전결">
            전
          </span>
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium truncate w-full">{data.approverName}</p>
        {data.approverPosition && (
          <p className="text-xs text-muted-foreground truncate w-full">
            {data.approverPosition}
          </p>
        )}
        {/* 대결 시 원 결재자 표시 */}
        {data.delegatorName && (
          <p className="text-[10px] text-indigo-600 truncate w-full">
            (원: {data.delegatorName})
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1">
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
          {typeLabels[data.type]}
        </span>
        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', colors.text, colors.bg)}>
          {statusLabels[data.status]}
        </span>
        {isParallel && data.completionCondition && (
          <span className="rounded bg-purple-100 text-purple-700 px-1.5 py-0.5 text-[10px]">
            {completionConditionLabels[data.completionCondition]}
          </span>
        )}
        {/* 대결/전결 배지 */}
        {isDelegated && !isParallel && (
          <span className="rounded bg-indigo-100 text-indigo-700 px-1.5 py-0.5 text-[10px]">
            대결
          </span>
        )}
        {isDirectApproved && !isDelegated && (
          <span className="rounded bg-teal-100 text-teal-700 px-1.5 py-0.5 text-[10px]">
            전결
          </span>
        )}
      </div>
    </button>
  );
}

// Fork/Join node for parallel execution visualization
function ParallelMarkerNode({ data }: { data: { type: 'fork' | 'join'; label?: string } }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-full border-2',
        data.type === 'fork' ? 'bg-purple-50 border-purple-400' : 'bg-purple-50 border-purple-400'
      )}
    >
      <span className="text-xs text-purple-600 font-medium">
        {data.type === 'fork' ? '▼' : '▲'}
      </span>
    </div>
  );
}

const nodeTypes = {
  approvalLine: ApprovalLineNode,
  parallelMarker: ParallelMarkerNode,
};

interface ParallelGroup {
  groupId: string;
  steps: ApprovalLineItem[];
  condition: ParallelCompletionCondition;
  executionType: ApprovalExecutionType;
}

function ApprovalLineFlowInner({
  steps,
  onStepClick,
  direction = 'horizontal',
  className,
}: ApprovalLineFlowProps) {
  const sortedSteps = useMemo(
    () => [...steps].sort((a, b) => a.order - b.order),
    [steps]
  );

  // Group parallel steps
  const parallelGroups = useMemo(() => {
    const parallelGroupsMap = new Map<string, ParallelGroup>();

    sortedSteps.forEach((step) => {
      if (step.parallelGroupId && (step.executionType === 'PARALLEL' || step.executionType === 'AGREEMENT')) {
        const existing = parallelGroupsMap.get(step.parallelGroupId);
        if (existing) {
          existing.steps.push(step);
        } else {
          parallelGroupsMap.set(step.parallelGroupId, {
            groupId: step.parallelGroupId,
            steps: [step],
            condition: step.parallelCompletionCondition || 'ALL',
            executionType: step.executionType,
          });
        }
      }
    });

    return Array.from(parallelGroupsMap.values());
  }, [sortedSteps]);

  const { nodes, edges } = useMemo(() => {
    const isHorizontal = direction === 'horizontal';
    const nodeSpacing = isHorizontal ? 180 : 150;
    const parallelSpacing = isHorizontal ? 140 : 130;

    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];

    let currentPosition = 0;
    let previousNodeIds: string[] = [];

    // Process steps in order, handling parallel groups
    const processedGroups = new Set<string>();
    let stepIndex = 0;

    for (const step of sortedSteps) {
      // Check if this step is part of a parallel group
      const parallelGroup = step.parallelGroupId
        ? parallelGroups.find((g) => g.groupId === step.parallelGroupId)
        : null;

      if (parallelGroup && !processedGroups.has(parallelGroup.groupId)) {
        processedGroups.add(parallelGroup.groupId);

        const groupSteps = parallelGroup.steps;
        const groupCount = groupSteps.length;

        // Add fork node
        const forkNodeId = `fork-${parallelGroup.groupId}`;
        flowNodes.push({
          id: forkNodeId,
          type: 'parallelMarker',
          position: isHorizontal
            ? { x: currentPosition * nodeSpacing, y: 60 }
            : { x: 60, y: currentPosition * nodeSpacing },
          data: { type: 'fork', label: executionTypeLabels[parallelGroup.executionType] },
          sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
          targetPosition: isHorizontal ? Position.Left : Position.Top,
        });

        // Connect previous nodes to fork
        previousNodeIds.forEach((prevId) => {
          const prevStep = sortedSteps.find((s) => s.id === prevId);
          const isCompleted = prevStep?.status === 'APPROVED' || prevStep?.status === 'SKIPPED';

          flowEdges.push({
            id: `${prevId}-${forkNodeId}`,
            source: prevId,
            target: forkNodeId,
            type: 'smoothstep',
            animated: prevStep?.status === 'CURRENT',
            style: {
              stroke: isCompleted ? '#22c55e' : '#d1d5db',
              strokeWidth: 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isCompleted ? '#22c55e' : '#d1d5db',
            },
          });
        });

        currentPosition += 0.5;

        // Add parallel step nodes
        const parallelNodeIds: string[] = [];
        groupSteps.forEach((parallelStep, idx) => {
          const offset = (idx - (groupCount - 1) / 2) * parallelSpacing;

          flowNodes.push({
            id: parallelStep.id,
            type: 'approvalLine',
            position: isHorizontal
              ? { x: currentPosition * nodeSpacing, y: offset }
              : { x: offset, y: currentPosition * nodeSpacing },
            data: {
              ...parallelStep,
              onClick: onStepClick ? () => onStepClick(parallelStep) : undefined,
              isParallel: true,
              parallelCount: groupCount,
              completionCondition: parallelGroup.condition,
            } as ApprovalLineNodeData,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
          });

          parallelNodeIds.push(parallelStep.id);

          // Connect fork to parallel node
          flowEdges.push({
            id: `${forkNodeId}-${parallelStep.id}`,
            source: forkNodeId,
            target: parallelStep.id,
            type: 'smoothstep',
            style: {
              stroke: '#a855f7',
              strokeWidth: 2,
              strokeDasharray: '5,5',
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#a855f7',
            },
          });
        });

        currentPosition += 1;

        // Add join node
        const joinNodeId = `join-${parallelGroup.groupId}`;
        flowNodes.push({
          id: joinNodeId,
          type: 'parallelMarker',
          position: isHorizontal
            ? { x: currentPosition * nodeSpacing, y: 60 }
            : { x: 60, y: currentPosition * nodeSpacing },
          data: { type: 'join', label: completionConditionLabels[parallelGroup.condition] },
          sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
          targetPosition: isHorizontal ? Position.Left : Position.Top,
        });

        // Connect parallel nodes to join
        parallelNodeIds.forEach((parallelId) => {
          const parallelStep = groupSteps.find((s) => s.id === parallelId);
          const isCompleted = parallelStep?.status === 'APPROVED' || parallelStep?.status === 'SKIPPED';

          flowEdges.push({
            id: `${parallelId}-${joinNodeId}`,
            source: parallelId,
            target: joinNodeId,
            type: 'smoothstep',
            animated: parallelStep?.status === 'CURRENT',
            style: {
              stroke: isCompleted ? '#22c55e' : '#a855f7',
              strokeWidth: 2,
              strokeDasharray: isCompleted ? undefined : '5,5',
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isCompleted ? '#22c55e' : '#a855f7',
            },
          });
        });

        previousNodeIds = [joinNodeId];
        currentPosition += 0.5;
      } else if (!step.parallelGroupId) {
        // Regular sequential step
        flowNodes.push({
          id: step.id,
          type: 'approvalLine',
          position: isHorizontal
            ? { x: currentPosition * nodeSpacing, y: 0 }
            : { x: 0, y: currentPosition * nodeSpacing },
          data: {
            ...step,
            onClick: onStepClick ? () => onStepClick(step) : undefined,
          } as ApprovalLineNodeData,
          sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
          targetPosition: isHorizontal ? Position.Left : Position.Top,
        });

        // Connect to previous nodes
        previousNodeIds.forEach((prevId) => {
          const prevNode = flowNodes.find((n) => n.id === prevId);
          const isMarkerNode = prevNode?.type === 'parallelMarker';

          let prevStep: ApprovalLineItem | undefined;
          if (!isMarkerNode) {
            prevStep = sortedSteps.find((s) => s.id === prevId);
          }

          const isCompleted = isMarkerNode || prevStep?.status === 'APPROVED' || prevStep?.status === 'SKIPPED';

          flowEdges.push({
            id: `${prevId}-${step.id}`,
            source: prevId,
            target: step.id,
            type: 'smoothstep',
            animated: prevStep?.status === 'CURRENT',
            style: {
              stroke: isCompleted ? '#22c55e' : '#d1d5db',
              strokeWidth: 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isCompleted ? '#22c55e' : '#d1d5db',
            },
          });
        });

        previousNodeIds = [step.id];
        currentPosition += 1;
      }

      stepIndex++;
    }

    return { nodes: flowNodes, edges: flowEdges };
  }, [sortedSteps, parallelGroups, direction, onStepClick]);

  const [reactFlowNodes] = useNodesState(nodes);
  const [reactFlowEdges] = useEdgesState(edges);

  const containerStyle = useMemo(() => {
    const isHorizontal = direction === 'horizontal';
    const hasParallel = parallelGroups.length > 0;
    const maxParallelCount = Math.max(1, ...parallelGroups.map((g) => g.steps.length));

    // Calculate dimensions based on content
    const nodeCount = sortedSteps.length + parallelGroups.length * 2; // Include fork/join nodes
    const width = isHorizontal ? nodeCount * 180 + 100 : maxParallelCount * 150 + 100;
    const height = isHorizontal ? (hasParallel ? maxParallelCount * 150 : 180) : nodeCount * 150 + 100;

    return { width: Math.max(width, 400), height: Math.max(height, 180) };
  }, [direction, sortedSteps.length, parallelGroups]);

  // 대결/전결 단계가 있는지 확인
  const hasDelegated = sortedSteps.some((s) => s.delegatorName);
  const hasDirectApproved = sortedSteps.some((s) => s.directApproved);
  const hasSpecialSteps = parallelGroups.length > 0 || hasDelegated || hasDirectApproved;

  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      {/* Legend for special execution types */}
      {hasSpecialSteps && (
        <div className="flex flex-wrap items-center gap-4 mb-3 text-xs text-muted-foreground">
          {parallelGroups.length > 0 && (
            <>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span>병렬/합의 결재</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-0.5 bg-purple-400" style={{ borderTop: '2px dashed #a855f7' }} />
                <span>병렬 흐름</span>
              </div>
            </>
          )}
          {hasDelegated && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-indigo-500" />
              <span>대결</span>
            </div>
          )}
          {hasDirectApproved && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-teal-500" />
              <span>전결</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <div className="w-6 h-0.5 bg-green-500" />
            <span>완료</span>
          </div>
        </div>
      )}
      <div style={containerStyle}>
        <ReactFlow
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          proOptions={{ hideAttribution: true }}
        />
      </div>
    </div>
  );
}

export function ApprovalLineFlow(props: ApprovalLineFlowProps) {
  return (
    <ReactFlowProvider>
      <ApprovalLineFlowInner {...props} />
    </ReactFlowProvider>
  );
}

export default ApprovalLineFlow;
