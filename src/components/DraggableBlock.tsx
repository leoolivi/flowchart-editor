import { useDraggable } from "@dnd-kit/core";
import type { FlowNodeType } from "../models/NodeGraph";

interface DraggableBlockProps {
    id: string;
    type: FlowNodeType;
    className?: string;
    children?: React.ReactNode;
}

export default function DraggableBlock({type, className, id, children}: DraggableBlockProps) {
    const {attributes, listeners, setNodeRef, transform} = useDraggable({
        id: id,
    });

    return (
        <button
            className={`rounded-lg bg-purple-400 px-5 py-3 ${className ?? ''}`}
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            id={id}
            style={{
                transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
            }}
        >
            {children ?? `${type} node`}
        </button>
    );
}