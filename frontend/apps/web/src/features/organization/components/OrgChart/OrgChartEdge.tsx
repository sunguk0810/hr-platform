import { memo } from 'react';
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from 'reactflow';

export interface OrgChartEdgeData {
  label?: string;
}

export const OrgChartEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    data,
    markerEnd,
  }: EdgeProps<OrgChartEdgeData>) => {
    const [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 8,
    });

    return (
      <>
        <path
          id={id}
          style={style}
          className="react-flow__edge-path stroke-muted-foreground/50"
          d={edgePath}
          strokeWidth={2}
          fill="none"
          markerEnd={markerEnd}
        />
        {data?.label && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: 'all',
              }}
              className="nodrag nopan rounded bg-background px-2 py-0.5 text-[10px] text-muted-foreground shadow-sm border"
            >
              {data.label}
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  }
);

OrgChartEdge.displayName = 'OrgChartEdge';

export default OrgChartEdge;
