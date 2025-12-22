import { Handle, Position } from "@xyflow/react";

export default function StartNode() {
  return (
    <div className="declaration-block bg-yellow-300 px-3 py-1 rounded-full border text-md">
      Start
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}