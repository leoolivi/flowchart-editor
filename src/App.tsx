import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  addEdge,
  Background,
  useNodesState,
  useEdgesState,
  reconnectEdge,
  useReactFlow,
  type Edge,
  type Node,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import NodeGraph, { FlowNodeType } from "./models/NodeGraph";
import { Renderer } from "./utility/NodeRenderer";
import DefinitionNode from "./components/DefinitionNode";
import StartNode from "./components/StartNode";
import EndNode from "./components/EndNode";
import DecisionNode from "./components/DecisionNode";
import MergeNode from "./components/MergeNode";
import { DndContext, type DragEndEvent, type DragMoveEvent } from "@dnd-kit/core";
import DraggableBlock from "./components/DraggableBlock";
import DroppableArea from "./components/DroppableArea";
import { DefaultNodeEdge } from "./components/NodeEdge";
import { logger } from "./utility/Logger";
import { getDistanceToSegment, type Point } from "./utility/Geometry";
import { handleNodeInsertion } from "./utility/GraphOperations";

import OrthogonalEdge from "./components/OrthogonalEdge";

// --- Configuration ---

const FlowNodeTypes = {
  definition: DefinitionNode,
  decision: DecisionNode,
  merge: MergeNode,
  start: StartNode,
  end: EndNode,
};

export const NodeEdgeTypes = {
  default: OrthogonalEdge,
  orthogonal: OrthogonalEdge,
};

// --- Helpers ---

/**
 * Calculates the approximate position of a handle on a node.
 * Used for accurate edge distance calculations.
 */
const getHandlePosition = (node: Node, handleId?: string | null): Point => {
  const x = node.position.x;
  const y = node.position.y;
  const width = node.measured?.width ?? 150; // Fallback width
  const height = node.measured?.height ?? 80; // Fallback height

  // Decision Node Logic
  if (node.type === FlowNodeType.DECISION) {
    if (handleId === "true") {
      return { x: x + width, y: y + height / 2 }; // Right
    }
    if (handleId === "false") {
      return { x: x, y: y + height / 2 }; // Left
    }
    // Target is Top
    return { x: x + width / 2, y: y };
  }

  // Standard Logic
  // If handleId is null/undefined, it could be target (Top) or source (Bottom)
  // Usually edges are Source -> Target.
  // We can't distinguish purely by handleId if it's null.
  // But usually Source is Bottom, Target is Top.
  // For edge distance check, we use this for both ends.
  
  // Refinement: The edge object has sourceHandle and targetHandle.
  // We are calling this function with specific handle IDs.
  
  // If we don't know, we assume center-ish or standard ports.
  // Let's assume Top/Bottom based on usage context or return Center if unsure.
  // But simpler:
  // Target -> Top
  // Source -> Bottom (unless Decision)
  
  // For the purpose of "is point near segment", 
  // we treat the node as having Top/Bottom/Left/Right ports.
  // Since we don't know if this call is for source or target just by handleId (if null),
  // we might need to pass "isSource" flag?
  // But simpler: return center if unsure, or standard Top/Bottom.
  
  return { x: x + width / 2, y: y + height / 2 }; 
};

// Improved helper that takes isTarget flag
const getRefinedHandlePosition = (node: Node, handleId: string | null | undefined, isTarget: boolean): Point => {
  const x = node.position.x;
  const y = node.position.y;
  // Use measured dimensions if available, otherwise reasonable defaults
  const width = node.measured?.width ?? 150;
  const height = node.measured?.height ?? 80;

  if (node.type === FlowNodeType.DECISION) {
    if (handleId === "true") return { x: x + width, y: y + height / 2 };
    if (handleId === "false") return { x: x, y: y + height / 2 };
    if (isTarget) return { x: x + width / 2, y: y };
  }

  if (isTarget) {
    return { x: x + width / 2, y: y }; // Top
  } else {
    return { x: x + width / 2, y: y + height }; // Bottom
  }
};

export default function App() {
  // --- State ---
  
  const [nodeGraph, setNodeGraph] = useState<NodeGraph>(() => {
    logger.info("Initializing NodeGraph");
    return new NodeGraph([
      {
        id: "ns",
        type: FlowNodeType.START,
        position: { x: 250, y: 5 },
        data: { value: "Start" },
        index: 0,
      },
      {
        id: "ne",
        type: FlowNodeType.END,
        position: { x: 250, y: 200 },
        data: { value: "End" },
        index: 1,
      },
    ]);
  });

  const edgeReconnectSuccessful = useRef(true);
  
  // Derived graph state (nodes/edges)
  const graph = useMemo(() => Renderer.returnGraph(nodeGraph), [nodeGraph]);
  
  // React Flow State
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);
  const [highlightedEdgeId, setHighlightedEdgeId] = useState<string | null>(null);

  const reactFlowInstance = useReactFlow();

  // --- Effects ---

  // Sync React Flow state with NodeGraph model
  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph, setNodes, setEdges]);

  // Styling for highlighted edges
  const styledEdges = useMemo(() => edges.map((edge) => ({
    ...edge,
    style:
      edge.id === highlightedEdgeId ? { stroke: "#29B6F6", strokeWidth: 3 } : {},
    animated: edge.id === highlightedEdgeId
  })), [edges, highlightedEdgeId]);

  // --- Handlers ---

  const onConnect = useCallback(
    (params: any) => {
      logger.info("Connection created", params);
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot));
    },
    [setEdges]
  );

  const onReconnectStart = useCallback(() => {
    logger.debug("Reconnect started");
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback((oldEdge: any, newConnection: any) => {
    logger.info("Reconnected edge", oldEdge, "to", newConnection);
    edgeReconnectSuccessful.current = true;
    setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
  }, [setEdges]);

  const onReconnectEnd = useCallback((_: any, edge: { id: string }) => {
    if (!edgeReconnectSuccessful.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }
    edgeReconnectSuccessful.current = true;
  }, [setEdges]);

  // --- Drag & Drop Logic ---

  /**
   * Checks if the current drop position is close to any edge.
   * Uses Flow Coordinates for high precision.
   */
  const checkDropPositionInEdges = (
    dropPosScreen: Point
  ): Edge | null => {
    const TOLERANCE = 30; // Distance in flow units (pixels)

    // Convert Screen Coords -> Flow Coords
    const dropPosFlow = reactFlowInstance.screenToFlowPosition(dropPosScreen);
    
    let closestEdge: Edge | null = null;
    let minDistance = Number.MAX_VALUE;

    for (const edge of styledEdges) {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      if (!sourceNode || !targetNode) continue;

      // Get Handle Positions (Flow Coords)
      const sourcePos = getRefinedHandlePosition(sourceNode, edge.sourceHandle, false);
      const targetPos = getRefinedHandlePosition(targetNode, edge.targetHandle, true);

      // Calculate distance from point to segment
      const distance = getDistanceToSegment(dropPosFlow, sourcePos, targetPos);

      if (distance < TOLERANCE && distance < minDistance) {
        minDistance = distance;
        closestEdge = edge;
      }
    }

    if (closestEdge) {
      // logger.debug("Drop position closest to edge", closestEdge.id, "distance:", minDistance);
      return closestEdge;
    }

    return null;
  };

  const onDragMove = (event: DragMoveEvent) => {
    const { active, over } = event;

    if (!over) {
      if (highlightedEdgeId !== null) setHighlightedEdgeId(null);
      return;
    }

    const draggedRect = active.rect.current.translated;
    if (!draggedRect) return;

    // Calculate center of dragged item in Screen Coords
    const dropPositionScreen = {
      x: draggedRect.left + draggedRect.width / 2,
      y: draggedRect.top + draggedRect.height / 2,
    };

    const edge = checkDropPositionInEdges(dropPositionScreen);

    if (edge) {
      if (highlightedEdgeId !== edge.id) {
          logger.debug("Highlighting edge", edge.id);
          setHighlightedEdgeId(edge.id);
      }
    } else {
      if (highlightedEdgeId !== null) {
          setHighlightedEdgeId(null);
      }
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    logger.debug("Drag ended", active.id);

    setHighlightedEdgeId(null);

    if (!over) return;

    const draggedRect = active.rect.current.translated;
    if (!draggedRect) return;

    const dropPositionScreen = {
      x: draggedRect.left + draggedRect.width / 2,
      y: draggedRect.top + draggedRect.height / 2,
    };

    const edge = checkDropPositionInEdges(dropPositionScreen);

    if (edge) {
      handleNodeInsertion(active.id as string, edge, nodes, nodeGraph, setNodeGraph);
    }
  };

  return (
    <DndContext
      onDragStart={() => setHighlightedEdgeId(null)}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
    >
      <div className="w-full border text-center p-4">
        Topbar (Work in Progress)
      </div>
      <div className="flex">
        <div className="border min-w-50 flex flex-col gap-4 p-4">
          <DraggableBlock
            type={FlowNodeType.DEFINITION}
            className="bg-purple-400"
            id={FlowNodeType.DEFINITION}
          />
          <DraggableBlock
            type={FlowNodeType.DECISION}
            className="bg-green-400"
            id={FlowNodeType.DECISION}
          />
        </div>
        <div className="w-full h-screen">
          <DroppableArea className="w-full h-full border border-red-500">
            <ReactFlow
              edgeTypes={NodeEdgeTypes}
              nodes={nodes}
              edges={styledEdges}
              nodeTypes={FlowNodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onReconnect={onReconnect}
              onReconnectStart={onReconnectStart}
              onReconnectEnd={onReconnectEnd}
              onConnect={onConnect}
              fitView
            >
              <Background />
            </ReactFlow>
          </DroppableArea>
        </div>
      </div>
    </DndContext>
  );
}
