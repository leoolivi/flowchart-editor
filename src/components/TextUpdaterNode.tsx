import { Handle, Position } from "@xyflow/react";
import { useCallback } from "react";

export function TextUpdaterNode() {
  const onChange = useCallback((evt: { target: { value: any; }; }) => {
    console.log(evt.target.value);
  }, []);
 
  return (
    <div className="border p-5 rounded-5 h-20 bg-white">
      <div>
        <label htmlFor="text" className="text-[#777] text-lg">Text:</label>
        <input id="text" name="text" onChange={onChange} className="nodrag" />
        <Handle type="source" position={Position.Bottom} />
        <Handle type="target" position={Position.Top} />

      </div>
    </div>
  );
}