import { Handle, Position } from "@xyflow/react";

export default function DeclarationNode() {
  return (
    <div className="declaration-block bg-yellow-300 p-5 rounded-lg border">
      Declaration Node
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Top} />
    </div>
  );
}