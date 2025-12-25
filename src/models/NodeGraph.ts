import type { Node } from '@xyflow/react';

export default class NodeGraph {
    nodes: FlowNode[] = [];
    private idCounter: number = 0;

    constructor(nodes: FlowNode[]) {
        this.nodes = nodes;
        this.idCounter = Math.max(0, ...this.nodes.map(n => parseInt(n.id.replace('node-', '')) || 0));
        this.updateIndices();
    }

    createEmptyDecisionNodeAndMerge(): any {
        const decisionNode: FlowNode = {
            id: `node-${++this.idCounter}`,
            type: FlowNodeType.DECISION,
            position: { x: 250, y: 100 * this.nodes.length },
            data: {
                value: 'Decision',
                condition: '',
                trueBranch: new NodeGraph([]),
                falseBranch: new NodeGraph([])
            }
        };
        return {decisionNode: decisionNode, mergeNode: this.createMergeNode()};
    }

    createMergeNode(): FlowNode {
        const mergeNode: FlowNode = {
            id: `node-${++this.idCounter}`,
            type: FlowNodeType.MERGE,
            position: { x: 250, y: 100 * (this.nodes.length + 1) },
            data: { value: 'Merge' }
        };
        return mergeNode;
    }

    addNode(node: FlowNode): NodeGraph {
        if (!node.id) {
            node.id = `node-${++this.idCounter}`;
        }
        node.index = this.nodes.length;
        this.nodes.push(node);
        return this;
    }

    addNodeAt(index: number, node: FlowNode): NodeGraph {
        if (!node.id) {
            node.id = `node-${++this.idCounter}`;
        }
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

    private updateIndices(): NodeGraph {
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