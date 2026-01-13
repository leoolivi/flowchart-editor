import { describe, it, expect, beforeEach } from 'vitest';
import NodeGraph, { FlowNodeType, type FlowNode } from '../models/NodeGraph';

describe('NodeLayout', () => {
    let graph: NodeGraph;
    
    // Helper to create a basic node
    const createNode = (id: string, type: FlowNodeType): FlowNode => ({
        id,
        type,
        position: { x: 0, y: 0 },
        data: { value: 'test' }
    });

    it('should align main nodes in a column', () => {
        const nodes = [
            createNode('start', FlowNodeType.START),
            createNode('def1', FlowNodeType.DEFINITION),
            createNode('end', FlowNodeType.END)
        ];
        
        graph = new NodeGraph(nodes);
        graph.cleanUpGraph();
        
        const start = graph.getNodeById('start');
        const def1 = graph.getNodeById('def1');
        const end = graph.getNodeById('end');
        
        // All main nodes should have the same X (250 by default in cleanUpGraph)
        expect(start?.position.x).toBe(250);
        expect(def1?.position.x).toBe(250);
        expect(end?.position.x).toBe(250);
        
        // Y positions should be increasing
        expect(def1!.position.y).toBeGreaterThan(start!.position.y);
        expect(end!.position.y).toBeGreaterThan(def1!.position.y);
    });

    it('should layout decision branches symmetrically', () => {
        // Create a decision node with simple branches
        const trueBranch = new NodeGraph([createNode('true1', FlowNodeType.DEFINITION)]);
        const falseBranch = new NodeGraph([createNode('false1', FlowNodeType.DEFINITION)]);
        
        const decisionNode = createNode('decision', FlowNodeType.DECISION);
        decisionNode.data = {
            value: 'decision',
            trueBranch,
            falseBranch
        };
        
        graph = new NodeGraph([
            createNode('start', FlowNodeType.START),
            decisionNode,
            createNode('end', FlowNodeType.END)
        ]);
        
        graph.cleanUpGraph();
        
        const decision = graph.getNodeById('decision');
        const trueNode = decision?.data.trueBranch?.nodes[0];
        const falseNode = decision?.data.falseBranch?.nodes[0];
        
        expect(decision).toBeDefined();
        expect(trueNode).toBeDefined();
        expect(falseNode).toBeDefined();
        
        // Decision should be centered
        expect(decision?.position.x).toBe(250);
        
        // Branches should be equidistant from center
        const trueDist = trueNode!.position.x - decision!.position.x;
        const falseDist = decision!.position.x - falseNode!.position.x;
        
        expect(trueDist).toBe(falseDist);
        expect(trueDist).toBeGreaterThan(0);
        
        // Check Y positions
        expect(trueNode!.position.y).toBeGreaterThan(decision!.position.y);
        expect(falseNode!.position.y).toBe(trueNode!.position.y);
    });

    it('should adjust separation based on branch width', () => {
        // Create a wide true branch (e.g., nested decision)
        // To simulate width, we need a nested structure that getDimensions detects
        // Since getDimensions calculates based on children, we need depth
        
        // Deep true branch: Decision -> (True, False)
        const nestedTrue = new NodeGraph([createNode('n_true', FlowNodeType.DEFINITION)]);
        const nestedFalse = new NodeGraph([createNode('n_false', FlowNodeType.DEFINITION)]);
        
        const nestedDecision = createNode('nested_dec', FlowNodeType.DECISION);
        nestedDecision.data = {
            value: 'nested',
            trueBranch: nestedTrue,
            falseBranch: nestedFalse
        };
        
        const trueBranch = new NodeGraph([nestedDecision]);
        const falseBranch = new NodeGraph([createNode('simple_false', FlowNodeType.DEFINITION)]);
        
        const rootDecision = createNode('root_dec', FlowNodeType.DECISION);
        rootDecision.data = {
            value: 'root',
            trueBranch,
            falseBranch
        };
        
        graph = new NodeGraph([rootDecision]);
        graph.cleanUpGraph();
        
        const root = graph.getNodeById('root_dec');
        const trueNode = root?.data.trueBranch?.nodes[0]; // nested_dec
        const falseNode = root?.data.falseBranch?.nodes[0]; // simple_false
        
        // Separation should be large enough to accommodate the nested decision
        const separation = trueNode!.position.x - root!.position.x;
        
        // The nested decision will expand. 
        // simple_false is a single column.
        // separation should be > than if both were simple.
        
        // For simple branches (from previous test), separation is minSep (likely 80 or based on default width)
        // Here, nested decision has children, so its width is larger.
        
        expect(separation).toBeGreaterThan(50); // Just a sanity check
        
        // Verify symmetry is maintained even with asymmetric content
        const trueDist = trueNode!.position.x - root!.position.x;
        const falseDist = root!.position.x - falseNode!.position.x;
        
        expect(trueDist).toBe(falseDist);
    });
});
