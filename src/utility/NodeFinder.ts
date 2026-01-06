import type NodeGraph from "../models/NodeGraph";
import { FlowNodeType, type FlowNode } from "../models/NodeGraph";

class NodeFinder {
    findNodeAndGraphById(graph: NodeGraph, id: string): {node: FlowNode, graph: NodeGraph} | undefined {
        for (const node of graph.nodes) {
            switch (node.type) {
                case FlowNodeType.DEFINITION:
                    if (node.id == id) return {node, graph};
                    break;
                case FlowNodeType.DECISION:
                    if (node.id == id) return {node, graph};
                    const resultTrue = this.findNodeAndGraphById(node.data.trueBranch!, id);
                    if (resultTrue) return resultTrue;
                    const resultFalse = this.findNodeAndGraphById(node.data.falseBranch!, id);
                    if (resultFalse) return resultFalse;
                    break;
                case FlowNodeType.END:
                    if (node.id == id) return {node, graph};
                    break;
            }
        }
        return undefined;
    }
}

export const Finder = new NodeFinder();