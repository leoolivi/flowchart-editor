import type NodeGraph from "../models/NodeGraph";
import { FlowNodeType } from "../models/NodeGraph";

class NodeFinder {
    findNodeById(graph: NodeGraph, id: string) {
        graph.nodes.forEach((node, index) => {
            switch (node.type) {
                case FlowNodeType.DEFINITION:
                    if (node.id == id) return node;
                    break;
                case FlowNodeType.DECISION:
                    if (node.id == id) return node;
                    this.findNodeById(node.data.trueBranch!, id);
                    break;
            }
        })
    }
}

export const Finder = new NodeFinder();