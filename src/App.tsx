import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlow, addEdge, Background, useNodesState, useEdgesState, reconnectEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import NodeGraph from './models/NodeGraph';
import { FlowNodeType } from './models/NodeGraph';
import { Renderer } from './utility/NodeRenderer';
import DefinitionNode from './components/DefinitionNode';
import StartNode from './components/StartNode';
import EndNode from './components/EndNode';

const FlowNodeTypes = {
  definition: DefinitionNode,
  start: StartNode,
  end: EndNode
};

export default function App() {
  const [nodeGraph, setNodeGraph] = useState<NodeGraph>(new NodeGraph([
    {id:'node-0', type: FlowNodeType.START, position: { x: 250, y: 5 }, data: { value: 'Start' }, index: 0},
    {id:'node-1', type: FlowNodeType.END, position: { x: 250, y: 200 }, data: { value: 'End' }, index: 1},
  ]));

  const graph = Renderer.returnGraph(nodeGraph);
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

  useEffect(() => {
    let graph = Renderer.returnGraph(nodeGraph);
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [nodeGraph]);
  
  const edgeReconnectSuccessful = useRef(true);

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

  const onAddNode = useCallback((type: string) => {
    console.log("Adding node of type:", type);
    const newNode = {
      id: `n${nodes.length + 1}`,
      type: FlowNodeType[type.toLowerCase() as keyof typeof FlowNodeType],
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { value: `Node ${nodes.length + 1}` },
    };
    setNodeGraph(prevGraph => prevGraph.addNode(newNode));
  }, [nodes.length]);
 
  return (
    <>
      <div className='w-full border text-center p-4'>
        Topbar
      </div>
      <div className='flex'>
        <div className='border min-w-50 flex flex-col gap-4 p-4'>
          <button className='rounded-lg bg-purple-400 px-5 py-3' onClick={() => onAddNode('definition')}>Definition</button>
        </div>
        <div className='w-full h-screen'>
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
        </div>
      </div>
    </>
  );
}

function setNodes(arg0: (nds: any[]) => any[]) {
  throw new Error('Function not implemented.');
}
