import type { Edge, Node } from "@xyflow/react";
import NodeGraph, { FlowNodeType, NodeEdgeType } from "../models/NodeGraph";
import { logger } from "./Logger";

/**
 * Singleton class responsible for converting the internal NodeGraph model
 * into React Flow nodes and edges for rendering.
 */
class NodeRenderer {
    
    public returnGraph(graph: NodeGraph): ReactFlowGraph {
        logger.debug("Rendering graph with", graph.nodes.length, "nodes");
        let nodes: Node[] = [];
        let edges: Edge[] = [];

        graph.nodes.forEach((graphNode, index) => {
            // logger.debug("Processing node", graphNode.id, graphNode.type);
            
            // Common node properties
            const baseNode = {
                ...graphNode,
                type: graphNode.type.toString().toLowerCase()
            };

            switch (graphNode.type) {       
                case FlowNodeType.DEFINITION:
                case FlowNodeType.START:
                case FlowNodeType.END:
                    nodes.push(baseNode);
                    
                    // Connect to previous node if exists
                    if (index > 0 && index < graph.nodes.length) { 
                        const prevNode = graph.nodes[index - 1];
                        edges.push({
                            id: `e-${prevNode.id}-${graphNode.id}`,
                            source: prevNode.id,
                            target: graphNode.id,
                            type: NodeEdgeType.default
                        });
                    }
                    break;

                case FlowNodeType.DECISION:
                    nodes.push(baseNode);
                    
                    // Process branches recursively
                    const trueBranch = this.returnGraph(graphNode.data.trueBranch ?? new NodeGraph([]));
                    const falseBranch = this.returnGraph(graphNode.data.falseBranch ?? new NodeGraph([]));
                    
                    // Connect Decision -> True Branch Start
                    if (trueBranch.nodes.length > 0) { 
                        const targetId = trueBranch.nodes[0].id;
                        edges.push({
                            id: `e-${graphNode.id}-true-${targetId}`,
                            source: graphNode.id,
                            sourceHandle: 'true',
                            target: targetId,
                            label: 'True',
                            type: 'orthogonal'
                        });
                        // Add branch content
                        nodes.push(...trueBranch.nodes);
                        edges.push(...trueBranch.edges);
                    }

                    // Connect Decision -> False Branch Start
                    if (falseBranch.nodes.length > 0) { 
                        const targetId = falseBranch.nodes[0].id;
                        edges.push({
                            id: `e-${graphNode.id}-false-${targetId}`,
                            source: graphNode.id,
                            sourceHandle: 'false',
                            target: targetId,
                            label: 'False',
                            type: 'orthogonal'
                        });
                        // Add branch content
                        nodes.push(...falseBranch.nodes);
                        edges.push(...falseBranch.edges);
                    }

                    // Connect Previous -> Decision
                    if (index > 0 && index < graph.nodes.length) { 
                        const prevNode = graph.nodes[index - 1];
                        edges.push({
                            id: `e-${prevNode.id}-${graphNode.id}`,
                            source: prevNode.id,
                            target: graphNode.id,
                            type: NodeEdgeType.default
                        });
                    }
                    break;

                case FlowNodeType.MERGE:
                    nodes.push(baseNode);
                    
                    const prevNode = graph.nodes[index - 1];
                    
                    // Special handling if previous node is Decision (convergence)
                    if (prevNode?.type === FlowNodeType.DECISION) {
                        const trueBranchNodes = prevNode.data.trueBranch?.nodes ?? [];
                        const falseBranchNodes = prevNode.data.falseBranch?.nodes ?? [];

                        // Connect True Branch End -> Merge
                        if (trueBranchNodes.length > 0) {
                            const sourceId = trueBranchNodes[trueBranchNodes.length - 1].id;
                            edges.push({
                                id: `e-${sourceId}-${graphNode.id}-true`,
                                source: sourceId,
                                target: graphNode.id,
                                targetHandle: 'true',
                                type: NodeEdgeType.default
                            });
                        } else {
                            // Direct connection if empty branch
                            edges.push({
                                id: `e-${prevNode.id}-${graphNode.id}-true`,
                                source: prevNode.id,
                                sourceHandle: "true",
                                target: graphNode.id,
                                targetHandle: 'true',
                                type: NodeEdgeType.default
                            });
                        }

                        // Connect False Branch End -> Merge
                        if (falseBranchNodes.length > 0) {
                            const sourceId = falseBranchNodes[falseBranchNodes.length - 1].id;
                            edges.push({
                                id: `e-${sourceId}-${graphNode.id}-false`,
                                source: sourceId,
                                target: graphNode.id,
                                targetHandle: 'false',
                                type: NodeEdgeType.default
                            });
                        } else {
                            // Direct connection if empty branch
                            edges.push({
                                id: `e-${prevNode.id}-${graphNode.id}-false`,
                                source: prevNode.id,
                                sourceHandle: "false",
                                target: graphNode.id,
                                targetHandle: 'false',
                                type: NodeEdgeType.default
                            });
                        }
                    } else {
                        // Standard connection if not following a Decision node
                        // (Fallback, though Merge usually follows Decision)
                        if (prevNode) {
                            edges.push({
                                id: `e-${prevNode.id}-${graphNode.id}`,
                                source: prevNode.id,
                                target: graphNode.id,
                                type: NodeEdgeType.default
                            });
                        }
                    }
                    break;

                default:
                    logger.warn("Unknown node type encountered:", graphNode.type);
                    nodes.push(baseNode);
                    if (index > 0) {
                        const prevNode = graph.nodes[index - 1];
                        edges.push({
                            id: `e-${prevNode.id}-${graphNode.id}`,
                            source: prevNode.id,
                            target: graphNode.id
                        });
                    }
            }
        });
        
        return { nodes, edges };
    }
}

export interface ReactFlowGraph {
    nodes: Node[];
    edges: Edge[];
}

export const Renderer = new NodeRenderer(); // Singleton instance
