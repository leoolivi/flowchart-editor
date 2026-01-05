import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ReactFlow, addEdge, Background, useNodesState, useEdgesState, reconnectEdge, useReactFlow} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import NodeGraph, { type FlowNode } from './models/NodeGraph';
import { FlowNodeType } from './models/NodeGraph';
import { Renderer } from './utility/NodeRenderer';
import DefinitionNode from './components/DefinitionNode';
import StartNode from './components/StartNode';
import EndNode from './components/EndNode';
import DecisionNode from './components/DecisionNode';
import MergeNode from './components/MergeNode';
import { DndContext } from '@dnd-kit/core';
import DraggableBlock from './components/DraggableBlock';
import DroppableArea from './components/DroppableArea';
import { DefaultNodeEdge } from './components/NodeEdge';
import type { Rect } from './types';

const FlowNodeTypes = {
  definition: DefinitionNode,
  decision: DecisionNode,
  merge: MergeNode,
  start: StartNode,
  end: EndNode
};

export const NodeEdgeTypes = {
  default: DefaultNodeEdge,
}

export default function App() {
  const [nodeGraph, setNodeGraph] = useState<NodeGraph>(() => new NodeGraph([
    {id:'ns', type: FlowNodeType.START, position: { x: 250, y: 5 }, data: { value: 'Start' }, index: 0},
    {id:'ne', type: FlowNodeType.END, position: { x: 250, y: 200 }, data: { value: 'End' }, index: 1},
  ]));

  const [highlightedEdgeId, setHighlightedEdgeId] = useState<string | null>(null);

  const reactFlowRef = useRef<any>(null);

  const graph = useMemo(() => {
    console.log("Generating graph from nodeGraph:", nodeGraph);
    return Renderer.returnGraph(nodeGraph);
  }, [nodeGraph]);

  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);
  
  const edgeReconnectSuccessful = useRef(true);

  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph]);

  const styledEdges = edges.map(edge => ({
    ...edge,
    style: edge.id === highlightedEdgeId ? { stroke: 'red', strokeWidth: 3 } : {}
  }));

  const toScreen = (p: any) =>
  reactFlowInstance.flowToScreenPosition({
    x: p.x,
    y: p.y,
  });


  const onConnect = useCallback(
    (params: any) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);
 
  const onReconnect = useCallback((oldEdge: any, newConnection: any) => {
    edgeReconnectSuccessful.current = true;
    setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
  }, []);
 
  const onReconnectEnd = useCallback((_: any, edge: { id: string; }) => {
    if (!edgeReconnectSuccessful.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }
 
    edgeReconnectSuccessful.current = true;
  }, []);

  const onAddNode = useCallback((type: FlowNodeType) => {
    console.log("Adding node of type:", type);
    switch (type) {
      case FlowNodeType.DEFINITION:
        setNodeGraph((prevGraph) => {
          const newNode = {
            id: `node-${NodeGraph.incrementIdCounter()}`,
            type: type,
            position: { x: 250, y: 100 * prevGraph.nodes.length },
            data: { 
              value: type.toString().charAt(0),
            }
          };
          const updatedGraph = new NodeGraph([...prevGraph.nodes]);
          updatedGraph.addNodeAt(prevGraph.nodes.length - 1, newNode)
          return updatedGraph;
        });
        break;
      case FlowNodeType.DECISION:
        setNodeGraph((prevGraph) => {
          const newNode: FlowNode = {
            id: `node-${NodeGraph.incrementIdCounter()}`,
            type: type,
            position: { x: 250, y: 100 * prevGraph.nodes.length },
            data: { 
              value: type.toString().charAt(0),
              condition: '',
              trueBranch: new NodeGraph([]),
              falseBranch: new NodeGraph([]),
            }
          };

          const newMergeNode: FlowNode = {
            id: `node-${NodeGraph.incrementIdCounter()}`,
            type: FlowNodeType.MERGE,
            position: { x: 250, y: 100 * prevGraph.nodes.length },
            data: {
              value: "merge"
            }
          };
          const updatedGraph = new NodeGraph([...prevGraph.nodes]);
          updatedGraph.addNodeAt(prevGraph.nodes.length -1, newNode);
          updatedGraph.addNodeAt(prevGraph.nodes.length, newMergeNode);
          return updatedGraph;
        });
        break;
      default:
        console.warn("Unsupported node type for addition:", type);
        return;
    }
  }, []);

  const onDragMove = (event: any) => {
    const {active, over, activatorEvent, delta} = event;
    
    if (!over) {
      setHighlightedEdgeId(null);
      return;
    }

    const reactFlowBounds = reactFlowRef.current?.getBoundingClientRect();
    console.log('reactFlowBounds:', reactFlowBounds);
    
    // Calcola la posizione finale aggiungendo il delta
    const dropPosition = {
      x: activatorEvent.clientX + delta.x,
      y: activatorEvent.clientY + delta.y
    };

    console.log('dropPosition:', dropPosition);

    let insertAtIndex = -1;

    nodes.forEach((node, index) => {
      if (index === 0) return; // Salta il primo nodo

      const prevNode = nodes[index - 1];
      
      const nodeScreenPos = reactFlowInstance.flowToScreenPosition(node.position);
      const prevNodeScreenPos = reactFlowInstance.flowToScreenPosition(prevNode.position);

      const nodeAbsolutePos = reactFlowBounds ? {
        x: nodeScreenPos.x + reactFlowBounds.left,
        y: nodeScreenPos.y + reactFlowBounds.top
      } : nodeScreenPos;

      const prevNodeAbsolutePos = reactFlowBounds ? {
        x: prevNodeScreenPos.x + reactFlowBounds.left,
        y: prevNodeScreenPos.y + reactFlowBounds.top
      } : prevNodeScreenPos;

      const TOLERANCE = 100;

      const pathAreaAbsolute = {
        x: Math.min(prevNodeAbsolutePos.x, nodeAbsolutePos.x) - TOLERANCE,
        y: Math.min(prevNodeAbsolutePos.y, nodeAbsolutePos.y) - TOLERANCE,
        w: Math.abs(nodeAbsolutePos.x - prevNodeAbsolutePos.x) + (TOLERANCE * 2),
        h: Math.abs(nodeAbsolutePos.y - prevNodeAbsolutePos.y) + (TOLERANCE * 2)
      };

      const isInside = dropPosition.x >= pathAreaAbsolute.x && 
                       dropPosition.x <= pathAreaAbsolute.x + pathAreaAbsolute.w &&
                       dropPosition.y >= pathAreaAbsolute.y && 
                       dropPosition.y <= pathAreaAbsolute.y + pathAreaAbsolute.h;

      console.log(`Check between ${index-1} and ${index}: isInside=${isInside}, edgeId=e${index}`);

      if (isInside && insertAtIndex === -1) {
        insertAtIndex = index;
        setHighlightedEdgeId(`e${index}`);
        console.log('Highlighted:', `e${index}`);
      }
    });

    if (insertAtIndex === -1) {
      setHighlightedEdgeId(null);
      console.log('No highlight');
    }
  }

  const onDragEnd = (event: any) => {
    const {active, over, activatorEvent, delta} = event;
    
    if (!over) return;

    const reactFlowBounds = reactFlowRef.current?.getBoundingClientRect();
    
    // Calcola la posizione finale aggiungendo il delta
    const dropPosition = {
      x: activatorEvent.clientX + delta.x,
      y: activatorEvent.clientY + delta.y
    };

    let insertAtIndex = -1;

    nodes.forEach((node, index) => {
      if (index === 0) return; // Salta il primo nodo

      const prevNode = nodes[index - 1];
      
      const nodeScreenPos = reactFlowInstance.flowToScreenPosition(node.position);
      const prevNodeScreenPos = reactFlowInstance.flowToScreenPosition(prevNode.position);

      const nodeAbsolutePos = reactFlowBounds ? {
        x: nodeScreenPos.x + reactFlowBounds.left,
        y: nodeScreenPos.y + reactFlowBounds.top
      } : nodeScreenPos;

      const prevNodeAbsolutePos = reactFlowBounds ? {
        x: prevNodeScreenPos.x + reactFlowBounds.left,
        y: prevNodeScreenPos.y + reactFlowBounds.top
      } : prevNodeScreenPos;

      const TOLERANCE = 100;

      const pathAreaAbsolute = {
        x: Math.min(prevNodeAbsolutePos.x, nodeAbsolutePos.x) - TOLERANCE,
        y: Math.min(prevNodeAbsolutePos.y, nodeAbsolutePos.y) - TOLERANCE,
        w: Math.abs(nodeAbsolutePos.x - prevNodeAbsolutePos.x) + (TOLERANCE * 2),
        h: Math.abs(nodeAbsolutePos.y - prevNodeAbsolutePos.y) + (TOLERANCE * 2)
      };

      const isInside = dropPosition.x >= pathAreaAbsolute.x && 
                       dropPosition.x <= pathAreaAbsolute.x + pathAreaAbsolute.w &&
                       dropPosition.y >= pathAreaAbsolute.y && 
                       dropPosition.y <= pathAreaAbsolute.y + pathAreaAbsolute.h;

      if (isInside && insertAtIndex === -1) {
        insertAtIndex = index;
      }
    });

    // Se hai trovato una posizione valida, inserisci il nodo
    if (insertAtIndex !== -1) {
      console.log("Active:", active.id);
      const nodeType = active.id as FlowNodeType;
      
      setNodeGraph((prevGraph) => {
        onAddNode(nodeType);
        return prevGraph;
      });
    }
  }
 
  return (
    <DndContext onDragStart={() => setHighlightedEdgeId(null)} onDragMove={onDragMove} onDragEnd={onDragEnd}>
      <div className='w-full border text-center p-4'>
        Topbar (Work in Progress)
      </div>
      <div className='flex'>
        <div className='border min-w-50 flex flex-col gap-4 p-4'>
          <DraggableBlock type={FlowNodeType.DEFINITION} className="bg-purple-400" id={FlowNodeType.DEFINITION} />
          <DraggableBlock type={FlowNodeType.DECISION} className="bg-green-400" id={FlowNodeType.DECISION} />
        </div>
        <div className='w-full h-screen'>
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