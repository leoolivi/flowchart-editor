import type { Node } from '@xyflow/react';
import type { GraphPath } from '../types';

export default class NodeGraph {
    nodes: FlowNode[] = [];
    static idCounter: number = 1;

    static incrementIdCounter() {
        this.idCounter += 1;
        return this.idCounter;
    }

    constructor(nodes: FlowNode[]) {
        this.nodes = nodes;
        NodeGraph.idCounter = Math.max(0, ...this.nodes.map(n => parseInt(n.id.replace('node-', '')) || 0));
        this.updateIndices();
    }

    
    addNode(node: FlowNode): NodeGraph {
        node.id = `node-${NodeGraph.incrementIdCounter()}`;
        node.index = this.nodes.length;
        this.nodes.splice(this.nodes.length -1, 0, node);
        return this;
    }

    addNodeAt(index: number, node: FlowNode): NodeGraph {
        node.id = `node-${NodeGraph.incrementIdCounter()}`;
        this.nodes.splice(index, 0, node);
        this.updateIndices();
        this.cleanUpGraph();
        return this;
    }

    getNodeById(id: string): FlowNode | undefined {
        return this.nodes.find(node => node.id === id);
    }

    removeNodeById(id: string): NodeGraph {
        this.nodes = this.nodes.filter(node => node.id !== id);
        this.updateIndices();
        return this;
    }

    cleanUpGraph(): NodeGraph {
        this.nodes = this.nodes.map((node) => ({ ...node, position: { x: 250, y: 100 * node.index! } }));
        this.nodes.at(-1)!.position.y += 50; // Move last node down for visibility
        this.updateIndices();
        return this;
    }
    
    at(index: number): FlowNode | undefined {
        return this.nodes[index];
    }

    updateIndices(): NodeGraph {
        this.nodes.forEach((node, i) => {
            node.index = i;
        });
        return this;
    }

    deepClone(): NodeGraph {
        const clonedNodes = this.nodes.map(node => this.cloneNode(node));
        return new NodeGraph(clonedNodes);
    }
    
    private cloneNode(node: FlowNode): FlowNode {
        return {
            ...node,
            data: {
                ...node.data,
                trueBranch: node.data.trueBranch?.deepClone(),
                falseBranch: node.data.falseBranch?.deepClone(),
            }
        };
    }

    findNodeAndPathById(id: string, path: GraphPath = [], branch: "true" | "false" = "true"): {node: FlowNode, prevNode: FlowNode, path: GraphPath} | undefined {
        console.log("Looking for: ", id);

        let resultFalse, resultTrue, prevNode;
        for (const node of this.nodes) {
            switch (node.type) {
                case FlowNodeType.START:
                    if (node.id == id) {
                        prevNode = this.nodes.at(node.index! - 1)!;
                        return {node, prevNode, path};
                    };
                    break;
                case FlowNodeType.DEFINITION:
                    if (node.id == id) {
                        prevNode = this.nodes.at(node.index! - 1)!;
                        return {node, prevNode, path};
                    }
                    break;
                case FlowNodeType.DECISION:
                    if (node.id == id) {
                        prevNode = this.nodes.at(node.index! - 1)!;
                        return {node, prevNode, path};
                    };

                    resultTrue = node.data.trueBranch!.findNodeAndPathById(id, [...path, {nodeId: node.id, branch: "true"}]);
                    if (resultTrue) return resultTrue;
                    
                    resultFalse = node.data.falseBranch!.findNodeAndPathById(id, [...path, {nodeId: node.id, branch: "false"}]);
                    if (resultFalse) return resultFalse;
                    
                    break;
                case FlowNodeType.MERGE:
                    prevNode = this.nodes.at(node.index! - 1)!;
                    console.log("Previous decision node: ", prevNode);

                    if (node.id == id) {
                        let decisionPath: GraphPath = [...path, {nodeId:prevNode.id, branch:branch}]
                        return {node, prevNode, path: decisionPath};
                    }

                    resultTrue = prevNode!.data.trueBranch!.findNodeAndPathById(id, [...path, {nodeId: prevNode!.id, branch: "true"}]);
                    if (resultTrue) return resultTrue;
                    resultFalse = prevNode!.data.falseBranch!.findNodeAndPathById(id, [...path, {nodeId: prevNode!.id, branch: "false"}]);
                    if (resultFalse) return resultFalse;

                    break;
                case FlowNodeType.END:
                    if (node.id == id) {
                        let prevNode = this.nodes.at(node.index! - 1)!;
                        return {node, prevNode, path};
                    };
                    break;
            }
        }
        return undefined;
    }
    
    // Metodo che inserisce un nodo e restituisce un nuovo grafo
    insertNodeAtPath(path: GraphPath, index: number, newNode: FlowNode): NodeGraph {

        if (path.length === 0) {
            // Siamo nel grafo corrente
            const newGraph = this.deepClone();
            newGraph.addNodeAt(index, newNode);
            console.log("simple insertion")
            this.nodes = newGraph.nodes; // TODO: Fix this step in each adding (efficiently)
            return newGraph;
        }
        
        // Dobbiamo andare più in profondità
        const [currentGraphNode, ...remainingPath] = path;
        const currentNodeIndex = this.nodes.findIndex(n => n.id === currentGraphNode.nodeId);
        
        if (currentNodeIndex === -1) {
            throw new Error(`Node ${currentGraphNode.nodeId} not found`);
        }
        
        const newGraph = this.deepClone();
        const currentNode = newGraph.nodes[currentNodeIndex];
        console.log("Found node:", currentNode);
        
        // FIXME: Fix decision adding
        // Ricorsivamente aggiorna il sottografo appropriato
        if (currentNode.type === FlowNodeType.DECISION) {
            if (currentNode.data.trueBranch) {
            currentNode.data.trueBranch = currentNode.data.trueBranch.insertNodeAtPath(remainingPath, index, newNode);
            }
            if (currentNode.data.falseBranch) {
            currentNode.data.falseBranch = currentNode.data.falseBranch.insertNodeAtPath(remainingPath, index, newNode);
            }
        } else if (currentNode.type === FlowNodeType.LOOP) {
            if (currentNode.data.trueBranch) {
            currentNode.data.trueBranch = currentNode.data.trueBranch.insertNodeAtPath(remainingPath, index, newNode);
            }
        } else if (currentNode.type === FlowNodeType.MERGE) {
            if (currentNode.data.trueBranch) {
            currentNode.data.trueBranch = currentNode.data.trueBranch.insertNodeAtPath(remainingPath, index, newNode);
            }
        } else if (currentNode.type === FlowNodeType.DEFINITION) {
            if (currentNode.data.trueBranch) {
            currentNode.data.trueBranch = currentNode.data.trueBranch.insertNodeAtPath(remainingPath, index, newNode);
            }
        }
        
        this.nodes = newGraph.nodes;
        return newGraph;
    }

}

export interface FlowNode extends Node {
    id: string;
    index?: number;
    type: FlowNodeType;
    position: { x: number; y: number; };
    data: { 
        value: string;
        variableType?: VariableType;
        variableName?: string;
        variableValue?: string;
        variablesList?: string[];
        condition?: string;
        trueBranch?: NodeGraph;
        falseBranch?: NodeGraph;
        loopType?: LoopType;
    };
}

enum VariableType {
    INTEGER = 'integer',
    FLOAT = 'float',
    STRING = 'string',
    CHARACTER = 'character',
    BOOLEAN = 'boolean',
    ARRAY = 'array',
} 

enum LoopType {
    FOR = 'for',
    WHILE = 'while',
    DO_WHILE = 'do_while',
}

export enum FlowNodeType {
    START = 'start',
    END = 'end',
    DECLARATION = 'declaration',
    ASSIGNMENT = 'assignment',
    DEFINITION = 'definition',
    DECISION = 'decision',
    LOOP = 'loop',
    INPUT = 'input',
    OUTPUT = 'output',
    MERGE = 'merge'
}

export enum NodeEdgeType {
  default = 'default'
}