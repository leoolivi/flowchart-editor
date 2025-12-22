import { useCallback, useRef, useState } from 'react';
import { ReactFlow, addEdge, Background, useNodesState, useEdgesState, reconnectEdge, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import DeclarationNode from './components/DeclarationNode';
import { FlowchartNodeType, type FlowchartGraph } from './types/graph';
import StartNode from './components/StartNode';
import EndNode from './components/EndNode';

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  declaration: DeclarationNode

};

export default function App() {
  const [nodeGraph, setNodeGraph] = useState<FlowchartGraph>({nodes: [
    {id: 'start', type: FlowchartNodeType.START, position: {x: 100, y: 100}, data: {content: 'Start'}},
    {id: 'end', type: FlowchartNodeType.END, position: {x: 100, y: 200}, data: {content: 'End'}},
  ], edges: [
    {id: 'e1-2', source: 'start', target: 'end', type: 'default', data: {label: 'Edge from start to end'}}
  ], metadata: {name: 'untitled', createdAt: new Date(), updatedAt: new Date(), version: '1.0'}});
  const [nodes, setNodes, onNodesChange] = useNodesState(nodeGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(nodeGraph.edges);
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
    const newNode = {
      id: `n${nodes.length + 1}`,
      type: type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: `Node ${nodes.length + 1}` },
    };
    setNodes((nds: any[]) => nds.concat(newNode));
  }, [nodes.length]);
 
  return (
    <>
      <div className='w-full border text-center p-4'>
        Topbar
      </div>
      <div className='flex'>
        <div className='border min-w-50 flex flex-col gap-4 p-4'>
          <button className='rounded-lg bg-green-400 px-5 py-3' onClick={() => onAddNode('textUpdater')}>Add block</button>
          <button className='rounded-lg bg-purple-400 px-5 py-3' onClick={() => onAddNode('declarationBlock')}>Declaration</button>
        </div>
        <div className='w-full h-screen'>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
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
