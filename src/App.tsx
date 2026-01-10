import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  addEdge,
  Background,
  useNodesState,
  useEdgesState,
  reconnectEdge,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import NodeGraph, { type FlowNode } from "./models/NodeGraph";
import { FlowNodeType } from "./models/NodeGraph";
import { Renderer } from "./utility/NodeRenderer";
import DefinitionNode from "./components/DefinitionNode";
import StartNode from "./components/StartNode";
import EndNode from "./components/EndNode";
import DecisionNode from "./components/DecisionNode";
import MergeNode from "./components/MergeNode";
import { DndContext } from "@dnd-kit/core";
import DraggableBlock from "./components/DraggableBlock";
import DroppableArea from "./components/DroppableArea";
import { DefaultNodeEdge } from "./components/NodeEdge";
const FlowNodeTypes = {
  definition: DefinitionNode,
  decision: DecisionNode,
  merge: MergeNode,
  start: StartNode,
  end: EndNode,
};

export const NodeEdgeTypes = {
  default: DefaultNodeEdge,
};

export default function App() {
  const [nodeGraph, setNodeGraph] = useState<NodeGraph>(
    () =>
      new NodeGraph([
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
      ])
  );

  const reactFlowRef = useRef<any>(null);

  const graph = useMemo(() => {
    console.log("Generating graph from nodeGraph:", nodeGraph);
    return Renderer.returnGraph(nodeGraph);
  }, [nodeGraph]);

  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

  const [highlightedEdgeId, setHighlightedEdgeId] = useState<string | null>(
    null
  );

  const edgeReconnectSuccessful = useRef(true);

  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    console.log("Graph updated, setting new nodes and edges");
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph, setNodes, setEdges]);

  const styledEdges = edges.map((edge) => ({
    ...edge,
    style:
      edge.id === highlightedEdgeId ? { stroke: "red", strokeWidth: 3 } : {},
  }));

  const onConnect = useCallback(
    (params: any) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    []
  );

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback((oldEdge: any, newConnection: any) => {
    edgeReconnectSuccessful.current = true;
    setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
  }, []);

  const onReconnectEnd = useCallback((_: any, edge: { id: string }) => {
    if (!edgeReconnectSuccessful.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }

    edgeReconnectSuccessful.current = true;
  }, []);
  
  const checkDropPositionInEdges = (
    nodeList: typeof nodes,
    dropPos: { x: number; y: number }
  ): { edgeId: string; index: number } | null => {
    for (let index = 1; index < nodeList.length; index++) {
      const prevNode = nodeList[index - 1];
      const node = nodeList[index];

      const nodeScreenPos = reactFlowInstance.flowToScreenPosition(
        node.position
      );
      const prevNodeScreenPos = reactFlowInstance.flowToScreenPosition(
        prevNode.position
      );

      const reactFlowBounds = reactFlowRef.current?.getBoundingClientRect();
      const nodeAbsolutePos = reactFlowBounds
        ? {
            x: nodeScreenPos.x + reactFlowBounds.left,
            y: nodeScreenPos.y + reactFlowBounds.top,
          }
        : nodeScreenPos;

      const prevNodeAbsolutePos = reactFlowBounds
        ? {
            x: prevNodeScreenPos.x + reactFlowBounds.left,
            y: prevNodeScreenPos.y + reactFlowBounds.top,
          }
        : prevNodeScreenPos;

      const TOLERANCE = 100;

      const pathAreaAbsolute = {
        x: Math.min(prevNodeAbsolutePos.x, nodeAbsolutePos.x) - TOLERANCE,
        y: Math.min(prevNodeAbsolutePos.y, nodeAbsolutePos.y) - TOLERANCE,
        w: Math.abs(nodeAbsolutePos.x - prevNodeAbsolutePos.x) + TOLERANCE * 2,
        h: Math.abs(nodeAbsolutePos.y - prevNodeAbsolutePos.y) + TOLERANCE * 2,
      };

      const isInside =
        dropPos.x >= pathAreaAbsolute.x &&
        dropPos.x <= pathAreaAbsolute.x + pathAreaAbsolute.w &&
        dropPos.y >= pathAreaAbsolute.y &&
        dropPos.y <= pathAreaAbsolute.y + pathAreaAbsolute.h;

      if (isInside) {
        const edge = styledEdges.find(e => e.source === prevNode.id && e.target === node.id);
        return { edgeId: edge?.id || `e${index}`, index };
      }
    }

    return null;
  };

  const onDragMove = (event: any) => {
    const { over, activatorEvent, delta } = event;

    if (!over) {
      setHighlightedEdgeId(null);
      return;
    }

    // Calcola la posizione finale aggiungendo il delta
    const dropPosition = {
      x: activatorEvent.clientX + delta.x,
      y: activatorEvent.clientY + delta.y,
    };

    console.log("dropPosition:", dropPosition);

    const result = checkDropPositionInEdges(nodes, dropPosition);

    if (result) {
      setHighlightedEdgeId(result.edgeId);
      console.log("Highlighted:", result.edgeId);
    } else {
      setHighlightedEdgeId(null);
      console.log("No highlight");
    }
  };

  const onDragEnd = (event: any) => {
    const { active, over, activatorEvent, delta } = event;

    if (!over) return;

    const reactFlowBounds = reactFlowRef.current?.getBoundingClientRect();

    const dropPosition = {
      x: activatorEvent.clientX + delta.x,
      y: activatorEvent.clientY + delta.y,
    };

    let insertAtIndex = -1;
    let insertBeforeId: string | undefined = undefined;
    let targetNodePosition = { x: 250, y: 100 };
    let targetBranch: "true" | "false" | undefined = undefined;

    nodes.forEach((node, index) => {
      if (index === 0) return;

      const prevNode = nodes[index - 1];

      const nodeScreenPos = reactFlowInstance.flowToScreenPosition(
        node.position
      );
      const prevNodeScreenPos = reactFlowInstance.flowToScreenPosition(
        prevNode.position
      );

      const nodeAbsolutePos = reactFlowBounds
        ? {
            x: nodeScreenPos.x + reactFlowBounds.left,
            y: nodeScreenPos.y + reactFlowBounds.top,
          }
        : nodeScreenPos;

      const prevNodeAbsolutePos = reactFlowBounds
        ? {
            x: prevNodeScreenPos.x + reactFlowBounds.left,
            y: prevNodeScreenPos.y + reactFlowBounds.top,
          }
        : prevNodeScreenPos;

      const TOLERANCE = 100;

      const pathAreaAbsolute = {
        x: Math.min(prevNodeAbsolutePos.x, nodeAbsolutePos.x) - TOLERANCE,
        y: Math.min(prevNodeAbsolutePos.y, nodeAbsolutePos.y) - TOLERANCE,
        w: Math.abs(nodeAbsolutePos.x - prevNodeAbsolutePos.x) + TOLERANCE * 2,
        h: Math.abs(nodeAbsolutePos.y - prevNodeAbsolutePos.y) + TOLERANCE * 2,
      };

      const isInside =
        dropPosition.x >= pathAreaAbsolute.x &&
        dropPosition.x <= pathAreaAbsolute.x + pathAreaAbsolute.w &&
        dropPosition.y >= pathAreaAbsolute.y &&
        dropPosition.y <= pathAreaAbsolute.y + pathAreaAbsolute.h;

      if (isInside && insertAtIndex === -1) {
        insertAtIndex = index;
        insertBeforeId = node.id;
        targetNodePosition = {
          x: (prevNode.position.x + node.position.x) / 2,
          y: (prevNode.position.y + node.position.y) / 2,
        };
        
        if (prevNode.type === FlowNodeType.DECISION) {
          targetBranch = dropPosition.x < prevNodeAbsolutePos.x ? "false" : "true";
        }
        return;
      }
    });

    if (insertAtIndex !== -1) {
      console.log("Active:", active.id);
      const newNodeType = active.id as FlowNodeType;
      console.log("Dropped on edge: ", over.id);
      const res = nodeGraph.findNodeAndPathById(insertBeforeId!, undefined, targetBranch);
      
      if (!res) {
        console.warn(
          "Could not find node to insert before with id:",
          insertBeforeId
        );
      }
      
      const { node, path } = res!;
      console.log("Dropped on node:", node);
      console.log("Path of the desired item is: ", path)

      let newNode: FlowNode;
      let newMergeNode: FlowNode | undefined;

      switch (newNodeType) {
        case FlowNodeType.DEFINITION:
          newNode = {
            id: `node-${NodeGraph.incrementIdCounter()}`,
            type: newNodeType,
            position: { x: 250, y: 100 * graph.nodes.length },
            data: {
              value: newNodeType.toString().charAt(0),
            },
          };
          break;
        case FlowNodeType.DECISION:
          newNode = {
            id: `node-${NodeGraph.incrementIdCounter()}`,
            type: newNodeType,
            position: { x: 250, y: 100 * graph.nodes.length },
            data: {
              value: newNodeType.toString().charAt(0),
              condition: "",
              trueBranch: new NodeGraph([]),
              falseBranch: new NodeGraph([]),
            },
          };

          newMergeNode = {
            id: `node-${NodeGraph.incrementIdCounter()}`,
            type: FlowNodeType.MERGE,
            position: { x: 250, y: 100 * graph.nodes.length },
            data: {
              value: "merge",
            },
          };
          break;
        default:
          console.warn("Unsupported node type for addition:", newNodeType);
          return;
      }

      const updatedGraph = new NodeGraph([...nodeGraph.nodes]);
      switch (node.type) {
        case FlowNodeType.START:
          break;

        case FlowNodeType.DEFINITION:
          console.log(`new node at idx ${node.index! + 1}:`, newNode);
          if (newMergeNode) updatedGraph.insertNodeAtPath(path, node.index!, newMergeNode);
          updatedGraph.insertNodeAtPath(path, node.index!, newNode);
          console.log("Updated graph: ", updatedGraph);
          break;
        case FlowNodeType.MERGE:
          console.log(`new node at idx ${node.index! + 1}:`, newNode);
          if (newMergeNode) updatedGraph.insertNodeAtPath(path, node.index!, newMergeNode);
          updatedGraph.insertNodeAtPath(path, 0, newNode);
          console.log("Updated graph: ", updatedGraph);
          break;
        case FlowNodeType.DECISION:
          console.log(`new node at idx ${node.index!}:`, newNode);
          updatedGraph.insertNodeAtPath(path, node.index!, newNode);
          if (newMergeNode) updatedGraph.insertNodeAtPath(path, node.index!+1, newMergeNode);
          console.log("Updated graph: ", updatedGraph);
          break;
        case FlowNodeType.END:
          console.log(`new node at idx ${node.index!}:`, newNode);
          updatedGraph.insertNodeAtPath(path, node.index!, newNode);
          if (newMergeNode) updatedGraph.insertNodeAtPath(path, node.index!+1, newMergeNode);
          console.log("Updated graph: ", updatedGraph);
          break;
      }
      console.log("Updated graph after insertion:", updatedGraph);
      setNodeGraph(updatedGraph);

      // TODO: Remove useless logging
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
              ref={reactFlowRef}
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
