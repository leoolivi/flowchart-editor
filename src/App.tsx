import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ReactFlow, addEdge, Background, useNodesState, useEdgesState, reconnectEdge, useReactFlow } from '@xyflow/react';
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

const FlowNodeTypes = {
  definition: DefinitionNode,
  decision: DecisionNode,
  merge: MergeNode,
  start: StartNode,
  end: EndNode
};

export default function App() {
  const [nodeGraph, setNodeGraph] = useState<NodeGraph>(() => new NodeGraph([
    {id:'ns', type: FlowNodeType.START, position: { x: 250, y: 5 }, data: { value: 'Start' }, index: 0},
    {id:'ne', type: FlowNodeType.END, position: { x: 250, y: 200 }, data: { value: 'End' }, index: 1},
  ]));

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
  
  const onDragNode = (event: { activatorEvent?: any; active?: any; over?: any; }) => {
    const {active, over} = event;

    if (!over || over.id !== 'block') return;

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.activatorEvent.clientX,
      y: event.activatorEvent.clientY,
    });

    // TODO: Analyze edges to find if the block it's dropped over one of those and eventually add a new node between the existing nodes

  }
 
  return (
    <DndContext onDragEnd={onDragNode}>
      <div className='w-full border text-center p-4'>
        Topbar (Work in Progress)
      </div>
      <div className='flex'>
        <div className='border min-w-50 flex flex-col gap-4 p-4'>
          <DraggableBlock type={FlowNodeType.DEFINITION} className="bg-purple-400" id={'1'} />
          <DraggableBlock type={FlowNodeType.DECISION} className="bg-green-400" id={'2'} />
        </div>
        <div className='w-full h-screen'>
            <DroppableArea className="w-full h-full">
              <ReactFlow
              nodes={nodes}
              edges={edges}
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
