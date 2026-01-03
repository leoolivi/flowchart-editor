import { useDroppable } from "@dnd-kit/core";

interface DroppableAreaProps {
    children?: React.ReactNode;
    className?: string;
}

export default function DroppableArea({children, className}: DroppableAreaProps) {

    const {isOver, setNodeRef} = useDroppable({
        id: 'droppable',
    });

    return (
        <div ref={setNodeRef} className={className}>
            {children}
        </div>
    );
}