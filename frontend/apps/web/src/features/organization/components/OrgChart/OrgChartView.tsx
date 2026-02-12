import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlowProvider,
  NodeTypes,
  EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { OrgChartNode, OrgNodeData } from './OrgChartNode';
import { OrgChartEdge, OrgChartEdgeData } from './OrgChartEdge';
import { OrgChartControls } from './OrgChartControls';
import { cn } from '@/lib/utils';
import { format, startOfDay, subMonths } from 'date-fns';
import { useTranslation } from 'react-i18next';

export interface OrgChartData {
  nodes: Node<OrgNodeData>[];
  edges: Edge<OrgChartEdgeData>[];
}

interface OrgChartViewProps {
  data?: OrgChartData;
  onNodeClick?: (node: Node<OrgNodeData>) => void;
  onNodeDoubleClick?: (node: Node<OrgNodeData>) => void;
  editable?: boolean;
  showMinimap?: boolean;
  showControls?: boolean;
  showDateSelector?: boolean;
  onDateChange?: (date: Date) => void;
  selectedDate?: Date;
  historyDates?: Date[];
  className?: string;
}

const nodeTypes: NodeTypes = {
  orgNode: OrgChartNode,
};

const edgeTypes: EdgeTypes = {
  orgEdge: OrgChartEdge,
};

// Sample data for current date
const sampleDataCurrent: OrgChartData = {
  nodes: [
    {
      id: '1',
      type: 'orgNode',
      position: { x: 400, y: 0 },
      data: {
        type: 'department',
        name: '대표이사',
        code: 'CEO',
        managerName: '김대표',
        employeeCount: 1,
        level: 0,
      },
    },
    {
      id: '2',
      type: 'orgNode',
      position: { x: 150, y: 150 },
      data: {
        type: 'department',
        name: '경영지원본부',
        code: 'BIZ',
        managerName: '이본부장',
        employeeCount: 25,
        level: 1,
      },
    },
    {
      id: '3',
      type: 'orgNode',
      position: { x: 650, y: 150 },
      data: {
        type: 'department',
        name: 'IT본부',
        code: 'IT',
        managerName: '박본부장',
        employeeCount: 50,
        level: 1,
      },
    },
    {
      id: '4',
      type: 'orgNode',
      position: { x: 0, y: 300 },
      data: {
        type: 'department',
        name: '인사팀',
        code: 'HR',
        managerName: '최팀장',
        employeeCount: 10,
        level: 2,
      },
    },
    {
      id: '5',
      type: 'orgNode',
      position: { x: 220, y: 300 },
      data: {
        type: 'department',
        name: '재무팀',
        code: 'FIN',
        managerName: '정팀장',
        employeeCount: 8,
        level: 2,
      },
    },
    {
      id: '6',
      type: 'orgNode',
      position: { x: 500, y: 300 },
      data: {
        type: 'department',
        name: '개발팀',
        code: 'DEV',
        managerName: '홍팀장',
        employeeCount: 30,
        level: 2,
      },
    },
    {
      id: '7',
      type: 'orgNode',
      position: { x: 720, y: 300 },
      data: {
        type: 'department',
        name: '인프라팀',
        code: 'INFRA',
        managerName: '강팀장',
        employeeCount: 12,
        level: 2,
      },
    },
  ],
  edges: [
    { id: 'e1-2', source: '1', target: '2', type: 'orgEdge' },
    { id: 'e1-3', source: '1', target: '3', type: 'orgEdge' },
    { id: 'e2-4', source: '2', target: '4', type: 'orgEdge' },
    { id: 'e2-5', source: '2', target: '5', type: 'orgEdge' },
    { id: 'e3-6', source: '3', target: '6', type: 'orgEdge' },
    { id: 'e3-7', source: '3', target: '7', type: 'orgEdge' },
  ],
};

// Sample data for past dates (simplified structure to show difference)
const sampleDataPast: OrgChartData = {
  nodes: [
    {
      id: '1',
      type: 'orgNode',
      position: { x: 400, y: 0 },
      data: {
        type: 'department',
        name: '대표이사',
        code: 'CEO',
        managerName: '김대표',
        employeeCount: 1,
        level: 0,
      },
    },
    {
      id: '2',
      type: 'orgNode',
      position: { x: 150, y: 150 },
      data: {
        type: 'department',
        name: '경영지원본부',
        code: 'BIZ',
        managerName: '이본부장',
        employeeCount: 20,
        level: 1,
      },
    },
    {
      id: '3',
      type: 'orgNode',
      position: { x: 650, y: 150 },
      data: {
        type: 'department',
        name: 'IT본부',
        code: 'IT',
        managerName: '박본부장',
        employeeCount: 35,
        level: 1,
      },
    },
    {
      id: '4',
      type: 'orgNode',
      position: { x: 150, y: 300 },
      data: {
        type: 'department',
        name: '인사총무팀',
        code: 'HR',
        managerName: '최팀장',
        employeeCount: 15,
        level: 2,
      },
    },
    {
      id: '6',
      type: 'orgNode',
      position: { x: 650, y: 300 },
      data: {
        type: 'department',
        name: '개발팀',
        code: 'DEV',
        managerName: '홍팀장',
        employeeCount: 25,
        level: 2,
      },
    },
  ],
  edges: [
    { id: 'e1-2', source: '1', target: '2', type: 'orgEdge' },
    { id: 'e1-3', source: '1', target: '3', type: 'orgEdge' },
    { id: 'e2-4', source: '2', target: '4', type: 'orgEdge' },
    { id: 'e3-6', source: '3', target: '6', type: 'orgEdge' },
  ],
};

// Generate sample history dates
const generateSampleHistoryDates = (): Date[] => {
  const today = new Date();
  return [
    subMonths(today, 1),
    subMonths(today, 3),
    subMonths(today, 6),
    subMonths(today, 9),
    subMonths(today, 12),
  ];
};

function OrgChartViewInner({
  data,
  onNodeClick,
  onNodeDoubleClick,
  editable = false,
  showMinimap = true,
  showControls = true,
  showDateSelector = false,
  onDateChange,
  selectedDate: externalSelectedDate,
  historyDates: externalHistoryDates,
  className,
}: OrgChartViewProps) {
  const { t } = useTranslation('organization');
  const today = startOfDay(new Date());
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date>(today);
  const selectedDate = externalSelectedDate ?? internalSelectedDate;
  const historyDates = externalHistoryDates ?? generateSampleHistoryDates();

  // Get the appropriate data based on selected date
  const chartData = useMemo(() => {
    if (data) return data;

    // For demo: show different data based on date
    const isCurrentMonth =
      format(selectedDate, 'yyyy-MM') === format(today, 'yyyy-MM');
    return isCurrentMonth ? sampleDataCurrent : sampleDataPast;
  }, [data, selectedDate, today]);

  const [nodes, setNodes, onNodesChange] = useNodesState(chartData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(chartData.edges);
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');

  // Update nodes and edges when chart data changes
  useEffect(() => {
    setNodes(chartData.nodes);
    setEdges(chartData.edges);
  }, [chartData, setNodes, setEdges]);

  const handleDateChange = useCallback(
    (date: Date) => {
      if (onDateChange) {
        onDateChange(date);
      } else {
        setInternalSelectedDate(date);
      }
    },
    [onDateChange]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (editable) {
        setEdges((eds) => addEdge({ ...params, type: 'orgEdge' }, eds));
      }
    },
    [editable, setEdges]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<OrgNodeData>) => {
      onNodeClick?.(node);
    },
    [onNodeClick]
  );

  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node<OrgNodeData>) => {
      onNodeDoubleClick?.(node);
    },
    [onNodeDoubleClick]
  );

  const handleToggleView = useCallback(() => {
    setViewMode((prev) => (prev === 'tree' ? 'flat' : 'tree'));
  }, []);

  const componentRef = useRef<HTMLDivElement>(null);

  const handleExport = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `OrgChart-${format(selectedDate, 'yyyy-MM-dd')}`,
    pageStyle: `
      @page {
        size: landscape;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
      }
    `,
  });

  const minimapNodeColor = useCallback((node: Node) => {
    const data = node.data as OrgNodeData;
    if (data.type === 'employee') return '#6366f1';
    const colors = ['#1e40af', '#0891b2', '#059669', '#d97706', '#9333ea'];
    return colors[data.level % colors.length];
  }, []);

  const isViewingPast =
    format(selectedDate, 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd');

  return (
    <div
      ref={componentRef}
      className={cn('h-[600px] w-full rounded-lg border bg-muted/30', className)}
    >
      {/* Past date indicator banner */}
      {showDateSelector && isViewingPast && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 flex items-center justify-center gap-2">
          <span className="font-medium">
            {t('orgChart.pastBanner', { date: format(selectedDate, 'yyyy년 M월') })}
          </span>
          <button
            onClick={() => handleDateChange(today)}
            className="text-amber-600 hover:text-amber-800 underline"
          >
            {t('orgChart.goToCurrentOrg')}
          </button>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={editable ? onNodesChange : undefined}
        onEdgesChange={editable ? onEdgesChange : undefined}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        {showMinimap && (
          <MiniMap
            nodeColor={minimapNodeColor}
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="!bg-background !border !border-border !shadow-sm"
          />
        )}
        {showControls && (
          <OrgChartControls
            onExport={handleExport}
            onToggleView={handleToggleView}
            viewMode={viewMode}
            onDateChange={showDateSelector ? handleDateChange : undefined}
            selectedDate={showDateSelector ? selectedDate : undefined}
            historyDates={showDateSelector ? historyDates : undefined}
          />
        )}
      </ReactFlow>
    </div>
  );
}

export function OrgChartView(props: OrgChartViewProps) {
  return (
    <ReactFlowProvider>
      <OrgChartViewInner {...props} />
    </ReactFlowProvider>
  );
}

export default OrgChartView;
