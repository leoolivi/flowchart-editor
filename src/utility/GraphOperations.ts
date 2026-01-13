import NodeGraph, { type FlowNode, FlowNodeType } from "../models/NodeGraph";
import type { Edge } from "@xyflow/react";
import { logger } from "./Logger";
import type { GraphPath } from "../types";

export const handleNodeInsertion = (
  activeId: string,
  edge: Edge,
  nodes: any[], // using any[] to avoid circular dep with App.tsx Node type if complex, or import from xyflow
  nodeGraph: NodeGraph,
  setNodeGraph: (graph: NodeGraph) => void
) => {
  const newNodeType = activeId as FlowNodeType;
  
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);
  
  if (!sourceNode || !targetNode) return;

  let insertionPath: GraphPath = [];
  let insertionIndex: number = 0;
  
  const sourceInfo = nodeGraph.findNodeAndPathById(sourceNode.id);
  const targetInfo = nodeGraph.findNodeAndPathById(targetNode.id);

  if (!sourceInfo) {
      logger.error("Source node not found in graph", sourceNode.id);
      return;
  }

  // Determine insertion logic
  if (edge.sourceHandle === 'true' || edge.sourceHandle === 'false') {
      // Inserting at start of a branch (from Decision Node)
      logger.debug("Inserting at start of branch", edge.sourceHandle);
      insertionPath = [...sourceInfo.path, { nodeId: sourceNode.id, branch: edge.sourceHandle as "true" | "false" }];
      insertionIndex = 0;
  } else if (targetNode.type === 'merge' && (edge.targetHandle === 'true' || edge.targetHandle === 'false')) {
       // Inserting at end of a branch (to Merge Node)
       if (sourceInfo && targetInfo && sourceInfo.path.length > targetInfo.path.length) {
           logger.debug("Inserting at end of branch");
           insertionPath = sourceInfo.path;
           insertionIndex = sourceInfo.node.index! + 1;
       } else {
           logger.warn("Could not determine branch for Merge insertion");
           return;
       }
  } else {
      // Standard insertion before target node
      if (targetInfo) {
          logger.debug("Standard insertion");
          insertionPath = targetInfo.path;
          insertionIndex = targetInfo.node.index!;
      } else {
           logger.warn("Target node not found in graph structure");
           return;
      }
  }

  // Create new node(s)
  let newNode: FlowNode;
  let newMergeNode: FlowNode | undefined;
  const id = NodeGraph.incrementIdCounter();

  switch (newNodeType) {
    case FlowNodeType.DEFINITION:
      newNode = {
        id: `node-${id}`,
        type: newNodeType,
        position: { x: 250, y: 0 }, 
        data: {
          value: "Definition",
        },
      };
      break;
    case FlowNodeType.DECISION:
      newNode = {
        id: `node-${id}`,
        type: newNodeType,
        position: { x: 250, y: 0 },
        data: {
          value: "Decision",
          condition: "",
          trueBranch: new NodeGraph([]),
          falseBranch: new NodeGraph([]),
        },
      };

      newMergeNode = {
        id: `node-${NodeGraph.incrementIdCounter()}`,
        type: FlowNodeType.MERGE,
        position: { x: 250, y: 0 },
        data: {
          value: "merge",
        },
      };
      break;
    default:
      logger.warn("Unsupported node type:", newNodeType);
      return;
  }

  // Perform insertion
  const nodesToInsert = newMergeNode ? [newNode, newMergeNode] : [newNode];
  const updatedGraph = nodeGraph.insertNodesAtPath(insertionPath, insertionIndex, nodesToInsert).cleanUpGraph();
  
  setNodeGraph(updatedGraph);
};
