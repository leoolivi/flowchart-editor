import type { Edge, Node } from "@xyflow/react";
import NodeGraph, { FlowNodeType } from "../models/NodeGraph";

class NodeRenderer {
    
    public returnGraph(graph: NodeGraph): ReactFlowGraph {
        let nodes: Node[] = [];
        let edges: Edge[] = [];

        console.log("Rendering graph:", graph);

        graph.nodes.forEach((graphNode, index) => {
            graphNode.index = index; // Ensure index is updated
            
            if (graphNode.type == FlowNodeType.DEFINITION || graphNode.type == FlowNodeType.START) {
                // console.log("Processing node:", graphNode.type.toString().toLowerCase());
                nodes.push({...graphNode, type: graphNode.type.toString().toLowerCase()});
                
                if (index > 0 && index < nodes.length) { 
                    edges.push({id: `e${index}`, source: nodes.at(index - 1)!.id, target: graphNode.id})
                }
                
            } else if (graphNode.type == FlowNodeType.END) {
                // console.log("Processing node:", graphNode.type.toString().toLowerCase());
                nodes.push({...graphNode, type: graphNode.type.toString().toLowerCase()});

                if (nodes.at(index - 1)!.type == FlowNodeType.MERGE) {
                    console.log("Previous node is a merge node, connecting accordingly.");
                    edges.push({id: `e${index}`, source: nodes.at(index - 1)!.id, target: graphNode.id})
                } else {
                    edges.push({id: `e${index}`, source: nodes.at(index - 1)!.id, target: graphNode.id})
                }
                
            } else if (graphNode.type == FlowNodeType.DECISION) {
                console.log("Processing decision node:", graphNode);
                nodes.push({...graphNode, type: graphNode.type.toString().toLowerCase()});
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
            } else if (graphNode.type == FlowNodeType.MERGE) {
                console.log("Processing merge node:", graphNode);
                nodes.push({...graphNode, type: graphNode.type.toString().toLowerCase()});
                
                if (graph.at(index - 1)?.type == FlowNodeType.DECISION) {
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
            } else {
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