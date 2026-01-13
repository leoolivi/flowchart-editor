import type { Node } from '@xyflow/react';
import type { GraphPath } from '../types';
import { logger } from '../utility/Logger';

/**
 * Represents the entire flow graph model.
 * Manages nodes, their structure, and basic CRUD operations.
 */
export default class NodeGraph {
    nodes: FlowNode[] = [];
    static idCounter: number = 1;

    static incrementIdCounter() {
        this.idCounter += 1;
        logger.debug("Incremented idCounter to", this.idCounter);
        return this.idCounter;
    }

    constructor(nodes: FlowNode[]) {
        this.nodes = nodes;
        // Sync idCounter with existing nodes to avoid collisions
        const maxId = Math.max(0, ...this.nodes.map(n => parseInt(n.id.replace('node-', '')) || 0));
        if (maxId >= NodeGraph.idCounter) {
            NodeGraph.idCounter = maxId;
        }
        logger.debug("NodeGraph initialized with", this.nodes.length, "nodes. idCounter set to", NodeGraph.idCounter);
        this.updateIndices();
    }
    
    addNode(node: FlowNode): NodeGraph {
        node.id = `node-${NodeGraph.incrementIdCounter()}`;
        node.index = this.nodes.length;
        this.nodes.push(node);
        logger.debug("Added node", node.id, "at end");
        return this;
    }

    addNodesAt(index: number, newNodes: FlowNode[]): NodeGraph {
        for (const node of newNodes) {
            if (!node.id) {
                node.id = `node-${NodeGraph.incrementIdCounter()}`;
            }
        }
        this.nodes.splice(index, 0, ...newNodes);
        this.updateIndices();
        this.cleanUpGraph();
        logger.debug("Added nodes", newNodes.map(n => n.id), "at index", index);
        return this;
    }

    getNodeById(id: string): FlowNode | undefined {
        return this.nodes.find(node => node.id === id);
    }

    removeNodeById(id: string): NodeGraph {
        logger.debug("Removing node with id", id);
        this.nodes = this.nodes.filter(node => node.id !== id);
        this.updateIndices();
        return this;
    }

    /**
     * Re-calculates positions for all nodes in the graph.
     */
    cleanUpGraph(): NodeGraph {
        logger.debug("Cleaning up graph. Current node count:", this.nodes.length);
        
        const initialY = 50;
        this.layoutNodes(this.nodes, 250, initialY);
        
        this.updateIndices();
        return this;
    }

    /**
     * Calculates the bounding box of a node graph structure.
     * Returns the horizontal bounds relative to the root position.
     */
    private getDimensions(nodes: FlowNode[]): { minX: number, maxX: number } {
        if (!nodes || nodes.length === 0) return { minX: -50, maxX: 50 }; // Default width

        let minX = 0;
        let maxX = 0;
        
        const NODE_WIDTH = 100;
        const GAP = 50;

        for (const node of nodes) {
             let nodeMinX = -NODE_WIDTH / 2;
             let nodeMaxX = NODE_WIDTH / 2;

             if (node.type === FlowNodeType.DECISION) {
                 const trueBranch = node.data.trueBranch?.nodes || [];
                 const falseBranch = node.data.falseBranch?.nodes || [];
                 
                 const dimTrue = this.getDimensions(trueBranch);
                 const dimFalse = this.getDimensions(falseBranch);
                 
                 // Calculate separation required to prevent overlap (Symmetric)
                 const minSep = (GAP - dimTrue.minX + dimFalse.maxX) / 2;
                 const separation = Math.max(minSep, 80);
                 
                 // True branch is at +separation
                 // False branch is at -separation
                 
                 const nodeMinX = Math.min(-NODE_WIDTH / 2, -separation + dimFalse.minX);
                 const nodeMaxX = Math.max(NODE_WIDTH / 2, separation + dimTrue.maxX);
                 
                 minX = Math.min(minX, nodeMinX);
                 maxX = Math.max(maxX, nodeMaxX);
             }
             
             minX = Math.min(minX, nodeMinX);
             maxX = Math.max(maxX, nodeMaxX);
        }
        
        return { minX, maxX };
    }

    /**
     * Recursive layout algorithm.
     * Returns the total height consumed by the nodes processed.
     */
    private layoutNodes(nodes: FlowNode[], x: number, startY: number): number {
        let currentY = startY;
        const NODE_HEIGHT = 100;
        const GAP = 50;

        nodes.forEach(node => {
            node.position = { x, y: currentY };
            
            if (node.type === FlowNodeType.DECISION) {
                const trueBranch = node.data.trueBranch;
                const falseBranch = node.data.falseBranch;

                // Branches start below the decision node
                const branchStartY = currentY + NODE_HEIGHT; 
                
                let trueBranchHeight = 0;
                let falseBranchHeight = 0;

                // Calculate dynamic spacing based on subtree width
                const dimTrue = this.getDimensions(trueBranch?.nodes || []);
                const dimFalse = this.getDimensions(falseBranch?.nodes || []);
                
                // Calculate separation required to prevent overlap while maintaining symmetry
                // We need the distance from the center of the true branch to its left edge (usually negative minX)
                // and the distance from the center of the false branch to its right edge (maxX)
                // But wait, inner edges are:
                // True branch's left edge: center + minX
                // False branch's right edge: center + maxX
                // We want: (sep + dimTrue.minX) - (-sep + dimFalse.maxX) >= GAP
                // 2*sep >= GAP - dimTrue.minX + dimFalse.maxX
                
                const minSep = (GAP - dimTrue.minX + dimFalse.maxX) / 2;
                // Enforce a minimum arm length for aesthetics
                const separation = Math.max(minSep, 80);

                if (trueBranch && trueBranch.nodes.length > 0) {
                    trueBranchHeight = this.layoutNodes(trueBranch.nodes, x + separation, branchStartY);
                }
                
                if (falseBranch && falseBranch.nodes.length > 0) {
                    falseBranchHeight = this.layoutNodes(falseBranch.nodes, x - separation, branchStartY);
                }

                const maxBranchHeight = Math.max(trueBranchHeight, falseBranchHeight);
                
                // Advance Y by node height + max branch height
                currentY += NODE_HEIGHT + maxBranchHeight;
            } else {
                currentY += NODE_HEIGHT;
            }
        });

        return currentY - startY;
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
        // logger.debug("Deep cloning graph with", this.nodes.length, "nodes");
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

    findNodeAndPathById(id: string, path: GraphPath = []): {node: FlowNode, prevNode: FlowNode | undefined, path: GraphPath} | undefined {
        for (const node of this.nodes) {
            if (node.id === id) {
                const prevNode = this.nodes.at(node.index! - 1);
                return {node, prevNode, path};
            }

            if (node.type === FlowNodeType.DECISION) {
                if (node.data.trueBranch) {
                    const resultTrue = node.data.trueBranch.findNodeAndPathById(id, [...path, {nodeId: node.id, branch: "true"}]);
                    if (resultTrue) return resultTrue;
                }
                
                if (node.data.falseBranch) {
                    const resultFalse = node.data.falseBranch.findNodeAndPathById(id, [...path, {nodeId: node.id, branch: "false"}]);
                    if (resultFalse) return resultFalse;
                }
            }
        }
        return undefined;
    }
    
    insertNodesAtPath(path: GraphPath, index: number, newNodes: FlowNode[]): NodeGraph {
        logger.debug("Inserting nodes", newNodes.map(n => n.id), "at path", path.length);

        if (path.length === 0) {
            const newGraph = this.deepClone();
            newGraph.addNodesAt(index, newNodes);
            this.nodes = newGraph.nodes;
            return newGraph;
        }
        
        const [currentGraphNode, ...remainingPath] = path;
        const currentNodeIndex = this.nodes.findIndex(n => n.id === currentGraphNode.nodeId);
        
        if (currentNodeIndex === -1) {
            throw new Error(`Node ${currentGraphNode.nodeId} not found`);
        }
        
        const newGraph = this.deepClone();
        const currentNode = newGraph.nodes[currentNodeIndex];
        
        if (currentNode.type === FlowNodeType.DECISION) {
            if (currentGraphNode.branch === "true" && currentNode.data.trueBranch) {
                currentNode.data.trueBranch = currentNode.data.trueBranch.insertNodesAtPath(remainingPath, index, newNodes);
            } else if (currentGraphNode.branch === "false" && currentNode.data.falseBranch) {
                currentNode.data.falseBranch = currentNode.data.falseBranch.insertNodesAtPath(remainingPath, index, newNodes);
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
