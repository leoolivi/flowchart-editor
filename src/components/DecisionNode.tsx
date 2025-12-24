import { Handle, Position } from "@xyflow/react";

export default function DecisionNode() {
  return (
    <div className="decision-block bg-red-400 p-5 rounded-lg border">
      Decision Node (conditional)
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Left} id="F" />
      <Handle type="source" position={Position.Right} id="T" />
    </div> 
  );
}