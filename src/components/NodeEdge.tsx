import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';
import { logger } from '../utility/Logger';
import React from 'react';

export function DefaultNodeEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
  } = props;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleMouseEnter = (event: React.MouseEvent) => {
    logger.logEdgeHover("hover_start", id, event.clientX, event.clientY);
  };

  const handleMouseLeave = (event: React.MouseEvent) => {
    logger.logEdgeHover("hover_end", id, event.clientX, event.clientY);
  };

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={20}
        className="react-flow__edge-interaction"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'pointer' }}
      />
    </>
  );
}
