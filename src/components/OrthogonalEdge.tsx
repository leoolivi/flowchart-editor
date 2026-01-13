import React from 'react';
import type { EdgeProps } from '@xyflow/react';
import { Position } from '@xyflow/react';
import EdgeLabel from './EdgeLabel';

const getOrthogonalPath = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = Position.Right,
  targetPosition = Position.Left,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition?: Position;
  targetPosition?: Position;
}): string => {
  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;

  let path = '';

  if (sourcePosition === Position.Left || sourcePosition === Position.Right) {
    // Path is horizontal first
    path = `M ${sourceX},${sourceY} H ${centerX} V ${targetY} H ${targetX}`;
  } else {
    // Path is vertical first
    path = `M ${sourceX},${sourceY} V ${centerY} H ${targetX} V ${targetY}`;
  }

  return path;
};

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
  const edgePath = getOrthogonalPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Calculate label position
  // Instead of center, place it near the source but offset to avoid overlapping the handle
  let labelX = sourceX;
  let labelY = sourceY;

  if (sourcePosition === Position.Right) {
    labelX = sourceX + 50; // Move 50px to the right
    labelY = sourceY - 15; // Move 15px up
  } else if (sourcePosition === Position.Left) {
    labelX = sourceX - 50; // Move 50px to the left
    labelY = sourceY - 15; // Move 15px up
  } else {
    // Fallback to center for other orientations
    labelX = (sourceX + targetX) / 2;
    labelY = (sourceY + targetY) / 2 - 15;
  }

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {label && <EdgeLabel x={labelX} y={labelY} label={label as string} />}
    </>
  );
};

export default OrthogonalEdge;
