import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ReactFlow, addEdge, Background, useNodesState, useEdgesState, reconnectEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import NodeGraph from './models/NodeGraph';
import { FlowNodeType } from './models/NodeGraph';
import { Renderer } from './utility/NodeRenderer';
import DefinitionNode from './components/DefinitionNode';
import StartNode from './components/StartNode';
import EndNode from './components/EndNode';
import DecisionNode from './components/DecisionNode';
import MergeNode from './components/MergeNode';

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
    if (type !== FlowNodeType.DECISION) {
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
    } else {
      setNodeGraph((prevGraph) => {
        const { decisionNode, mergeNode } = prevGraph.createEmptyDecisionNodeAndMerge();
        const updatedGraph = new NodeGraph([...prevGraph.nodes]);
        updatedGraph.addNodeAt(prevGraph.nodes.length - 2, decisionNode);
        updatedGraph.addNodeAt(prevGraph.nodes.length - 1, mergeNode);
        return updatedGraph;
      });
    }
  }, []);
 
  return (
    <>
      <div className='w-full border text-center p-4'>
        Topbar (Work in Progress)
      </div>
      <div className='flex'>
        <div className='border min-w-50 flex flex-col gap-4 p-4'>
          <button className='rounded-lg bg-purple-400 px-5 py-3' onClick={() => onAddNode(FlowNodeType.DEFINITION)}>Definition</button>
          <button className='rounded-lg bg-green-400 px-5 py-3' onClick={() => onAddNode(FlowNodeType.DECISION)}>Decision</button>
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
