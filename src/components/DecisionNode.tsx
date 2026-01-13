import { Handle, Position } from "@xyflow/react";

export default function DecisionNode({ data }: { data: any }) {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      {/* Diamond Shape Background */}
      <div className="absolute w-16 h-16 bg-yellow-100 border-2 border-yellow-500 transform rotate-45 rounded-sm shadow-sm" />
      
      {/* Content */}
      <div className="z-10 text-xs text-center font-medium p-1 pointer-events-none">
        {data.label || "Condition?"}
      </div>

      {/* Handles */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-2 h-2 !bg-gray-500" 
      />
      
      {/* False Branch (Left) */}
      <Handle 
        type="source" 
        position={Position.Left} 
        id="false" 
        className="w-2 h-2 !bg-red-500"
      />
      <div className="absolute left-[-25px] top-1/2 -translate-y-1/2 text-[10px] font-bold text-red-500 pointer-events-none">
        False
      </div>

      {/* True Branch (Right) */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="true" 
        className="w-2 h-2 !bg-green-500"
      />
      <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 text-[10px] font-bold text-green-500 pointer-events-none">
        True
      </div>
    </div> 
  );
}
