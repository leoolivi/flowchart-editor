import type NodeGraph from "../models/NodeGraph";
import { FlowNodeType, type FlowNode } from "../models/NodeGraph";

class NodeFinder {
    findNodeAndGraphById(graph: NodeGraph, id: string, path: string[] = []): {node: FlowNode, prevNode: FlowNode, path: string[]} | undefined {
        for (const node of graph.nodes) {
            switch (node.type) {
                case FlowNodeType.DEFINITION:
                    if (node.id == id) {
                        let prevNode = graph.nodes.at(node.index! - 1)!;
                        return {node, prevNode, path};
                    }
                    break;
                case FlowNodeType.DECISION:
                    if (node.id == id) {
                        let prevNode = graph.nodes.at(node.index! - 1)!;
                        return {node, prevNode, path};
                    };
                    // const resultTrue = this.findNodeAndGraphById(node.data.trueBranch!, id, [...path, {nodeId: node.id, nodeBranch: 'true'}]);
                    const resultTrue = this.findNodeAndGraphById(node.data.trueBranch!, id, [...path, node.id]);
                    if (resultTrue) return resultTrue;
                    // const resultFalse = this.findNodeAndGraphById(node.data.falseBranch!, id, [...path, {nodeId: node.id, nodeBranch: 'false'}]);
                    const resultFalse = this.findNodeAndGraphById(node.data.falseBranch!, id, [...path, node.id]);
                    if (resultFalse) return resultFalse;
                    break;
                case FlowNodeType.END:
                    if (node.id == id) {
                        let prevNode = graph.nodes.at(node.index! - 1)!;
                        return {node, prevNode, path};
                    };
                    break;
            }
        }
        return undefined;
    }
}

/* export interface PathItem {
    nodeId: string;
    nodeBranch: 'true' | 'false';
} */

export const Finder = new NodeFinder();