import { Handle, Position } from "@xyflow/react";

export default function EndNode() {
  return (
    <div className="declaration-block bg-yellow-300 px-3 py-1 rounded-full border text-md">
      End
      <Handle type="target" position={Position.Top} />
    </div>
  );
}