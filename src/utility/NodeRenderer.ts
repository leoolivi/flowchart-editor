import type { Edge, Node } from "@xyflow/react";
import NodeGraph, { FlowNodeType } from "../models/NodeGraph";

class NodeRenderer {
    
    public returnGraph(graph: NodeGraph): ReactFlowGraph {
        let nodes: Node[] = [];
        let edges: Edge[] = [];

        graph.nodes.forEach((graphNode, index) => {

            switch (graphNode.type) {       
                case FlowNodeType.DEFINITION:
                    nodes.push({...graphNode, type: graphNode.type.toString().toLowerCase()}); // Push the definition node
                    
                    if (index > 0 && index < nodes.length) { 
                        edges.push({id: `e${index}`, source: nodes.at(index - 1)!.id, target: graphNode.id}) // Connect previous node to current
                    }
                    break;
                case FlowNodeType.START:
                    nodes.push({...graphNode, type: graphNode.type.toString().toLowerCase()}); // Push the start node
                    break;
                case FlowNodeType.END:
                    nodes.push({...graphNode, type: graphNode.type.toString().toLowerCase()}); // Push the end node
                    edges.push({id: `e${index}`, source: nodes.at(index - 1)!.id, target: graphNode.id}) // Connect previous node to end node
                    break;

                case FlowNodeType.DECISION:
                    nodes.push({...graphNode, type: graphNode.type.toString().toLowerCase()});
                    // Recursively call the process for other nested branches
                    let trueBranch = this.returnGraph(graphNode.data.trueBranch ?? new NodeGraph([]));
                    let falseBranch = this.returnGraph(graphNode.data.falseBranch ?? new NodeGraph([]));
                    
                    // Connect decision node to true branch start
                    if (trueBranch.nodes.length > 0) { 
                        edges.push(
                            {id: `${graphNode.id}-true`, source: graphNode.id, sourceHandle: 'true', target: trueBranch.nodes[0].id ?? graph.at(index + 1), label: 'True'}
                        );
                        // Add true branch nodes and edges
                        trueBranch.nodes.forEach((node) => nodes.push(node));
                        trueBranch.edges.forEach((edge) => edges.push(edge));
                    }
                    // Connect decision node to false branch start
                    if (falseBranch.nodes.length > 0) { 
                        edges.push(
                            {id: `${graphNode.id}-false`, source: graphNode.id, target: falseBranch.nodes[0].id, label: 'False'}
                        );
                        // Add false branch nodes and edges
                        falseBranch.nodes.forEach((node) => nodes.push(node));
                        falseBranch.edges.forEach((edge) => edges.push(edge));
                    }

                    // Connect previous node to decision node
                    if (index > 0 && index < nodes.length) { 
                        edges.push({id: `e${index}`, source: nodes.at(index - 1)!.id, target: graphNode.id})
                    }
                    break;
                case FlowNodeType.MERGE:
                    nodes.push({...graphNode, type: graphNode.type.toString().toLowerCase()});
                    
                    if (graph.at(index - 1)?.type == FlowNodeType.DECISION) {
                        // If the branches of the decision has nodes, connect the last node of that branch otherwise connect the decision node directly
                        
                        if (graph.at(index - 1)?.data!.trueBranch!.nodes!.length! > 0) {
                            edges.push({id: `e${index}-true`, source: graph.at(index - 1)!.data!.trueBranch!.nodes!.at(-1)!.id, sourceHandle: "true", target: graphNode.id, targetHandle: 'true'})
                        } else {
                            edges.push({id: `e${index}-true`, source: graph.at(index - 1)!.id, sourceHandle: "true", target: graphNode.id, targetHandle: 'true' })
                        }

                        if (graph.at(index - 1)?.data!.falseBranch!.nodes!.length! > 0) {
                            edges.push({id: `e${index}-false`, source: graph.at(index - 1)!.data!.falseBranch!.nodes!.at(-1)!.id, sourceHandle: "false", target: graphNode.id, targetHandle: 'false'})
                        } else {
                            edges.push({id: `e${index}-false`, source: graph.at(index - 1)!.id, sourceHandle: "false", target: graphNode.id, targetHandle: 'false'})
                        }
                    }
                    break;
                default:
                    console.warn("Unknown node type encountered:", graphNode.type);
                    edges.push({id: `e${index}`, source: nodes.at(index - 1)!.id, target: graphNode.id})
            }
        });
        
        console.log("Graph edges:", edges);
        console.log("Graph nodes:", nodes);
        return {
            nodes: nodes,
            edges: edges
        };
    }
}

export interface ReactFlowGraph {
    nodes: Node[];
    edges: Edge[];
}

export const Renderer = new NodeRenderer(); // Singleton instance