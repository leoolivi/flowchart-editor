import React from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';
import EdgeLabel from './EdgeLabel';
 
const OrthogonalEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
 
  const labelX = (sourceX + targetX) / 2;
  const labelY = (sourceY + targetY) / 2 - 15;
 
  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      {label && <EdgeLabel x={labelX} y={labelY} label={label as string} />}
    </>
  );
};
 
export default OrthogonalEdge;
