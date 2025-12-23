import type { Edge, Node } from "@xyflow/react";
import NodeGraph from "../models/NodeGraph";

class NodeRenderer {

    public returnGraph(graph: NodeGraph): ReactFlowGraph {
        let nodes: Node[] = [];
        let edges: Edge[] = [];

        console.log("Rendering graph:", graph);
        console.log("Graph edges:", edges);

        graph.nodes.forEach((node, index) => {

            console.log("Processing node:", node.type.toString().toLowerCase());
            nodes.push({...node, type: node.type.toString().toLowerCase()});
            (index != 0 && index < nodes.length) ? edges.push(
                {id: `e${index}`, source: nodes.at(index - 1)!.id, target: node.id}
            ) : null;
        });

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