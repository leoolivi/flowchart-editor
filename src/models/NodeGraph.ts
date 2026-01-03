import type { Node } from '@xyflow/react';

export default class NodeGraph {
    nodes: FlowNode[] = [];
    static idCounter: number = 1;

    static incrementIdCounter() {
        this.idCounter += 1;
        return this.idCounter;
    }

    decrementIdCounter() {
        NodeGraph.idCounter -= 1;
        return NodeGraph.idCounter;
    }

    constructor(nodes: FlowNode[]) {
        this.nodes = nodes;
        NodeGraph.idCounter = Math.max(0, ...this.nodes.map(n => parseInt(n.id.replace('node-', '')) || 0));
        this.updateIndices();
    }
    createMergeNode(): FlowNode {
        const mergeNode: FlowNode = {
            id: `node-${NodeGraph.incrementIdCounter()}`,
            type: FlowNodeType.MERGE,
            position: { x: 250, y: 100 * (this.nodes.length + 1) },
            data: { value: 'Merge' },
            index: this.nodes.length
        };
        return mergeNode;
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