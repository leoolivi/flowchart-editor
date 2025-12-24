import { Handle, Position } from "@xyflow/react";

export default function DefinitionNode() {
  return (
    <div className="definition-block bg-green-300 p-5 rounded-lg border">
      Definition Node
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />
    </div> 
  );
}