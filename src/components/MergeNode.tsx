import { Handle, Position } from "@xyflow/react";

export default function MergeNode() {
  return (
    <div className="relative w-4 h-4 bg-gray-800 rounded-full flex items-center justify-center">
      <Handle 
        type="target" 
        position={Position.Left} 
        id="false" 
        style={{ opacity: 0 }} 
      />
      <Handle 
        type="target" 
        position={Position.Right} 
        id="true" 
        style={{ opacity: 0 }} 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ opacity: 0 }} 
      />
    </div> 
  )
}
