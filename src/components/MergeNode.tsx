import { Handle, Position } from "@xyflow/react";

export default function MergeNode() {
  return (
    <div className="merge-block bg-blue-300 p-5 rounded-lg border">
      Merge Node
      <Handle type="target" position={Position.Left} id="false" />
      <Handle type="target" position={Position.Right} id="true" />
      <Handle type="source" position={Position.Bottom} />
    </div> 
  )
}