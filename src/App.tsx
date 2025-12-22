import { useCallback, useRef } from 'react';
import { ReactFlow, addEdge, Background, useNodesState, useEdgesState, reconnectEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TextUpdaterNode } from './components/TextUpdaterNode';
import DeclarationNode from './components/DeclarationNode';
 
const initialNodes = [
  { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Inizio' }, type: 'input' },
  { id: 'n2', position: { x: 0, y: 100 }, data: { label: 'Fine' }, type: 'output' }
];
const initialEdges = [{ id: 'n1-n2', source: 'n1', target: 'n2' }];

const nodeTypes = {
  textUpdater: TextUpdaterNode,
  declarationBlock: DeclarationNode
};

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
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
            snapToGrid
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
