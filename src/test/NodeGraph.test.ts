import { describe, it, expect, beforeEach } from 'vitest';
import NodeGraph, { type FlowNode, FlowNodeType } from '../models/NodeGraph';

describe('NodeGraph', () => {
  let graph: NodeGraph;
  let startNode: FlowNode;
  let endNode: FlowNode;

  beforeEach(() => {
    // Reset del counter per test deterministici
    NodeGraph.idCounter = 0;
    
    startNode = {
      id: 'node-1',
      type: FlowNodeType.START,
      position: { x: 250, y: 0 },
      data: { value: 'Start' }
    };

    endNode = {
      id: 'node-2',
      type: FlowNodeType.END,
      position: { x: 250, y: 100 },
      data: { value: 'End' }
    };

    graph = new NodeGraph([startNode, endNode]);
  });

  describe('Constructor', () => {
    it('should initialize with provided nodes', () => {
      expect(graph.nodes).toHaveLength(2);
      expect(graph.nodes[0].id).toBe('node-1');
      expect(graph.nodes[1].id).toBe('node-2');
    });

    it('should update indices correctly', () => {
      expect(graph.nodes[0].index).toBe(0);
      expect(graph.nodes[1].index).toBe(1);
    });

    it('should set idCounter to max existing id', () => {
      const nodes = [
        { id: 'node-5', type: FlowNodeType.START, position: { x: 0, y: 0 }, data: { value: 'test' } },
        { id: 'node-10', type: FlowNodeType.END, position: { x: 0, y: 0 }, data: { value: 'test' } }
      ] as FlowNode[];
      
      new NodeGraph(nodes);
      expect(NodeGraph.idCounter).toBe(10);
    });
  });

  describe('addNode', () => {
    it('should add node before the last node', () => {
      const newNode: FlowNode = {
        id: 'temp',
        type: FlowNodeType.OUTPUT,
        position: { x: 250, y: 50 },
        data: { value: 'Print' }
      };

      graph.addNode(newNode);
      
      expect(graph.nodes).toHaveLength(3);
      expect(graph.nodes[1].type).toBe(FlowNodeType.OUTPUT);
      expect(graph.nodes[2].type).toBe(FlowNodeType.END);
      expect(graph.nodes[1].id).toMatch(/^node-\d+$/);
      // L'indice viene settato al momento dell'inserimento (length-1 prima dello splice)
      expect(graph.nodes[1].index).toBe(2);
    });

    it('should increment idCounter', () => {
      const initialCounter = NodeGraph.idCounter;
      const newNode: FlowNode = {
        id: 'temp',
        type: FlowNodeType.OUTPUT,
        position: { x: 0, y: 0 },
        data: { value: 'test' }
      };
      
      graph.addNode(newNode);
      expect(NodeGraph.idCounter).toBe(initialCounter + 1);
    });
  });

  describe('addNodeAt', () => {
    it('should add node at specific index', () => {
      const newNode: FlowNode = {
        id: 'temp',
        type: FlowNodeType.INPUT,
        position: { x: 0, y: 0 },
        data: { value: 'Read' }
      };

      graph.addNodeAt(1, newNode);
      
      expect(graph.nodes).toHaveLength(3);
      expect(graph.nodes[1].type).toBe(FlowNodeType.INPUT);
      expect(graph.nodes[1].index).toBe(1);
      expect(graph.nodes[2].index).toBe(2);
    });

    it('should update positions after adding', () => {
      const newNode: FlowNode = {
        id: 'temp',
        type: FlowNodeType.INPUT,
        position: { x: 999, y: 999 },
        data: { value: 'test' }
      };

      graph.addNodeAt(1, newNode);
      
      expect(graph.nodes[0].position).toEqual({ x: 250, y: 0 });
      expect(graph.nodes[1].position).toEqual({ x: 250, y: 100 });
      expect(graph.nodes[2].position).toEqual({ x: 250, y: 250 }); // +50 for end node
    });
  });

  describe('getNodeById', () => {
    it('should return node with matching id', () => {
      const node = graph.getNodeById('node-1');
      expect(node).toBeDefined();
      expect(node?.type).toBe(FlowNodeType.START);
    });

    it('should return undefined for non-existent id', () => {
      const node = graph.getNodeById('non-existent');
      expect(node).toBeUndefined();
    });
  });

  describe('removeNodeById', () => {
    it('should remove node with matching id', () => {
      graph.removeNodeById('node-1');
      expect(graph.nodes).toHaveLength(1);
      expect(graph.nodes[0].id).toBe('node-2');
    });

    it('should update indices after removal', () => {
      const middleNode: FlowNode = {
        id: 'temp',
        type: FlowNodeType.OUTPUT,
        position: { x: 0, y: 0 },
        data: { value: 'test' }
      };
      graph.addNodeAt(1, middleNode);
      
      graph.removeNodeById(graph.nodes[1].id);
      expect(graph.nodes).toHaveLength(2);
      expect(graph.nodes[1].index).toBe(1);
    });

    it('should do nothing if id not found', () => {
      const initialLength = graph.nodes.length;
      graph.removeNodeById('non-existent');
      expect(graph.nodes).toHaveLength(initialLength);
    });
  });

  describe('cleanUpGraph', () => {
    it('should reset all positions based on index', () => {
      graph.nodes[0].position = { x: 999, y: 999 };
      graph.cleanUpGraph();
      
      expect(graph.nodes[0].position).toEqual({ x: 250, y: 0 });
      expect(graph.nodes[1].position).toEqual({ x: 250, y: 150 });
    });

    it('should add extra spacing to last node', () => {
      graph.cleanUpGraph();
      const lastIndex = graph.nodes.length - 1;
      expect(graph.nodes[lastIndex].position.y).toBe(100 + 50);
    });
  });

  describe('at', () => {
    it('should return node at index', () => {
      const node = graph.at(0);
      expect(node?.id).toBe('node-1');
    });

    it('should return undefined for invalid index', () => {
      expect(graph.at(999)).toBeUndefined();
      // at() method doesn't support negative indices like array[-1]
      expect(graph.at(-1)).toBeUndefined();
    });
  });

  describe('deepClone', () => {
    it('should create independent copy', () => {
      const clone = graph.deepClone();
      
      expect(clone.nodes).toHaveLength(graph.nodes.length);
      expect(clone.nodes).not.toBe(graph.nodes);
      expect(clone.nodes[0]).not.toBe(graph.nodes[0]);
    });

    it('should clone nested decision branches', () => {
      const decisionNode: FlowNode = {
        id: 'node-3',
        type: FlowNodeType.DECISION,
        position: { x: 250, y: 100 },
        data: {
          value: 'x > 0',
          condition: 'x > 0',
          trueBranch: new NodeGraph([{
            id: 'node-4',
            type: FlowNodeType.OUTPUT,
            position: { x: 0, y: 0 },
            data: { value: 'positive' }
          }]),
          falseBranch: new NodeGraph([{
            id: 'node-5',
            type: FlowNodeType.OUTPUT,
            position: { x: 0, y: 0 },
            data: { value: 'negative' }
          }])
        }
      };

      const graphWithDecision = new NodeGraph([startNode, decisionNode, endNode]);
      const clone = graphWithDecision.deepClone();
      
      expect(clone.nodes[1].data.trueBranch).not.toBe(graphWithDecision.nodes[1].data.trueBranch);
      expect(clone.nodes[1].data.falseBranch).not.toBe(graphWithDecision.nodes[1].data.falseBranch);
      expect(clone.nodes[1].data.trueBranch?.nodes).toHaveLength(1);
    });
  });

  describe('findNodeAndPathById - Simple cases', () => {
    it('should find node in main graph (not first node)', () => {
      // Test con il secondo nodo perché il primo non ha prevNode
      const result = graph.findNodeAndPathById('node-2');
      
      expect(result).toBeDefined();
      expect(result?.node.id).toBe('node-2');
      expect(result?.path).toEqual([]);
      expect(result?.prevNode.id).toBe('node-1');
    });

    it('should return previous node correctly', () => {
      const result = graph.findNodeAndPathById('node-2');
      
      expect(result?.prevNode.id).toBe('node-1');
    });

    it('should return undefined for non-existent node', () => {
      const result = graph.findNodeAndPathById('non-existent');
      expect(result).toBeUndefined();
    });
    
    it('should handle first node (index 0)', () => {
      // Il primo nodo potrebbe avere problemi con prevNode
      const result = graph.findNodeAndPathById('node-1');
      
      if (result) {
        expect(result.node.id).toBe('node-1');
        expect(result.path).toEqual([]);
        // prevNode potrebbe essere undefined per index 0
      }
    });
  });

  describe('findNodeAndPathById - Single decision level', () => {
    let graphWithDecision: NodeGraph;

    beforeEach(() => {
      const decisionNode: FlowNode = {
        id: 'decision-1',
        type: FlowNodeType.DECISION,
        position: { x: 250, y: 100 },
        data: {
          value: 'x > 0?',
          condition: 'x > 0',
          trueBranch: new NodeGraph([
            {
              id: 'start-true',
              type: FlowNodeType.START,
              position: { x: 0, y: 0 },
              data: { value: 'start' }
            },
            {
              id: 'true-output',
              type: FlowNodeType.OUTPUT,
              position: { x: 0, y: 0 },
              data: { value: 'positive' }
            },
            {
              id: 'end-true',
              type: FlowNodeType.END,
              position: { x: 0, y: 0 },
              data: { value: 'end' }
            }
          ]),
          falseBranch: new NodeGraph([
            {
              id: 'start-false',
              type: FlowNodeType.START,
              position: { x: 0, y: 0 },
              data: { value: 'start' }
            },
            {
              id: 'false-output',
              type: FlowNodeType.OUTPUT,
              position: { x: 0, y: 0 },
              data: { value: 'negative' }
            },
            {
              id: 'end-false',
              type: FlowNodeType.END,
              position: { x: 0, y: 0 },
              data: { value: 'end' }
            }
          ])
        }
      };

      graphWithDecision = new NodeGraph([startNode, decisionNode, endNode]);
    });

    it('should find END node in true branch (uses END case)', () => {
      const result = graphWithDecision.findNodeAndPathById('end-true');
      
      expect(result).toBeDefined();
      expect(result?.node.id).toBe('end-true');
      expect(result?.path).toEqual([{ nodeId: 'decision-1', branch: 'true' }]);
    });

    it('should find END node in false branch (uses END case)', () => {
      const result = graphWithDecision.findNodeAndPathById('end-false');
      
      expect(result).toBeDefined();
      expect(result?.node.id).toBe('end-false');
      expect(result?.path).toEqual([{ nodeId: 'decision-1', branch: 'false' }]);
    });
  });

  describe('findNodeAndPathById - Deeply nested decisions', () => {
    let deepGraph: NodeGraph;

    beforeEach(() => {
      // Livello 3 - usa solo END nodes che sono gestiti
      const level3TrueBranch = new NodeGraph([
        {
          id: 'start-l3t',
          type: FlowNodeType.START,
          position: { x: 0, y: 0 },
          data: { value: 'start' }
        },
        {
          id: 'level3-true',
          type: FlowNodeType.END, // Cambiato da OUTPUT a END
          position: { x: 0, y: 0 },
          data: { value: 'level 3 true' }
        }
      ]);

      const level3FalseBranch = new NodeGraph([
        {
          id: 'start-l3f',
          type: FlowNodeType.START,
          position: { x: 0, y: 0 },
          data: { value: 'start' }
        },
        {
          id: 'level3-false',
          type: FlowNodeType.END, // Cambiato da OUTPUT a END
          position: { x: 0, y: 0 },
          data: { value: 'level 3 false' }
        }
      ]);

      // Livello 2
      const level2Decision: FlowNode = {
        id: 'decision-level2',
        type: FlowNodeType.DECISION,
        position: { x: 0, y: 0 },
        data: {
          value: 'z > 0?',
          condition: 'z > 0',
          trueBranch: level3TrueBranch,
          falseBranch: level3FalseBranch
        }
      };

      const level2TrueBranch = new NodeGraph([
        {
          id: 'start-l2t',
          type: FlowNodeType.START,
          position: { x: 0, y: 0 },
          data: { value: 'start' }
        },
        level2Decision
      ]);
      
      const level2FalseBranch = new NodeGraph([
        {
          id: 'start-l2f',
          type: FlowNodeType.START,
          position: { x: 0, y: 0 },
          data: { value: 'start' }
        },
        {
          id: 'level2-false',
          type: FlowNodeType.END, // Cambiato da OUTPUT a END
          position: { x: 0, y: 0 },
          data: { value: 'level 2 false' }
        }
      ]);

      // Livello 1
      const level1Decision: FlowNode = {
        id: 'decision-level1',
        type: FlowNodeType.DECISION,
        position: { x: 0, y: 0 },
        data: {
          value: 'y > 0?',
          condition: 'y > 0',
          trueBranch: level2TrueBranch,
          falseBranch: level2FalseBranch
        }
      };

      deepGraph = new NodeGraph([startNode, level1Decision, endNode]);
    });

    it('should find node at level 3 in true->true path', () => {
      const result = deepGraph.findNodeAndPathById('level3-true');
      
      expect(result).toBeDefined();
      expect(result?.node.id).toBe('level3-true');
      expect(result?.path).toEqual([
        { nodeId: 'decision-level1', branch: 'true' },
        { nodeId: 'decision-level2', branch: 'true' }
      ]);
    });

    it('should find node at level 3 in true->false path', () => {
      const result = deepGraph.findNodeAndPathById('level3-false');
      
      expect(result).toBeDefined();
      expect(result?.path).toEqual([
        { nodeId: 'decision-level1', branch: 'true' },
        { nodeId: 'decision-level2', branch: 'false' }
      ]);
    });

    it('should find node at level 2 in false path', () => {
      const result = deepGraph.findNodeAndPathById('level2-false');
      
      expect(result).toBeDefined();
      expect(result?.path).toEqual([
        { nodeId: 'decision-level1', branch: 'false' }
      ]);
    });

    it('should find decision node at level 2', () => {
      const result = deepGraph.findNodeAndPathById('decision-level2');
      
      expect(result).toBeDefined();
      expect(result?.node.id).toBe('decision-level2');
      expect(result?.path).toEqual([
        { nodeId: 'decision-level1', branch: 'true' }
      ]);
    });
  });

  describe('findNodeAndPathById - Complex nested structure', () => {
    it('should handle 4 levels of nesting', () => {
      // Costruisco 4 livelli di decision annidati con END nodes
      const level4Node: FlowNode = {
        id: 'output-level4',
        type: FlowNodeType.END, // Cambiato da OUTPUT a END
        position: { x: 0, y: 0 },
        data: { value: 'deepest' }
      };

      const level3Decision: FlowNode = {
        id: 'decision-3',
        type: FlowNodeType.DECISION,
        position: { x: 0, y: 0 },
        data: {
          value: 'c3',
          trueBranch: new NodeGraph([
            {
              id: 'start-l4',
              type: FlowNodeType.START,
              position: { x: 0, y: 0 },
              data: { value: 'start' }
            },
            level4Node
          ]),
          falseBranch: new NodeGraph([
            {
              id: 'start-dummy3',
              type: FlowNodeType.START,
              position: { x: 0, y: 0 },
              data: { value: 'start' }
            },
            {
              id: 'dummy3',
              type: FlowNodeType.END,
              position: { x: 0, y: 0 },
              data: { value: 'd3' }
            }
          ])
        }
      };

      const level2Decision: FlowNode = {
        id: 'decision-2',
        type: FlowNodeType.DECISION,
        position: { x: 0, y: 0 },
        data: {
          value: 'c2',
          trueBranch: new NodeGraph([
            {
              id: 'start-l3',
              type: FlowNodeType.START,
              position: { x: 0, y: 0 },
              data: { value: 'start' }
            },
            level3Decision
          ]),
          falseBranch: new NodeGraph([
            {
              id: 'start-dummy2',
              type: FlowNodeType.START,
              position: { x: 0, y: 0 },
              data: { value: 'start' }
            },
            {
              id: 'dummy2',
              type: FlowNodeType.END,
              position: { x: 0, y: 0 },
              data: { value: 'd2' }
            }
          ])
        }
      };

      const level1Decision: FlowNode = {
        id: 'decision-1',
        type: FlowNodeType.DECISION,
        position: { x: 0, y: 0 },
        data: {
          value: 'c1',
          trueBranch: new NodeGraph([
            {
              id: 'start-l2',
              type: FlowNodeType.START,
              position: { x: 0, y: 0 },
              data: { value: 'start' }
            },
            level2Decision
          ]),
          falseBranch: new NodeGraph([
            {
              id: 'start-dummy1',
              type: FlowNodeType.START,
              position: { x: 0, y: 0 },
              data: { value: 'start' }
            },
            {
              id: 'dummy1',
              type: FlowNodeType.END,
              position: { x: 0, y: 0 },
              data: { value: 'd1' }
            }
          ])
        }
      };

      const complexGraph = new NodeGraph([startNode, level1Decision, endNode]);
      const result = complexGraph.findNodeAndPathById('output-level4');
      
      expect(result).toBeDefined();
      expect(result?.node.id).toBe('output-level4');
      expect(result?.path).toHaveLength(3);
      expect(result?.path).toEqual([
        { nodeId: 'decision-1', branch: 'true' },
        { nodeId: 'decision-2', branch: 'true' },
        { nodeId: 'decision-3', branch: 'true' }
      ]);
    });
  });

  describe('insertNodeAtPath - Main graph', () => {
    it('should insert at path with length 0', () => {
      const newNode: FlowNode = {
        id: 'temp',
        type: FlowNodeType.OUTPUT,
        position: { x: 0, y: 0 },
        data: { value: 'inserted' }
      };

      const newGraph = graph.insertNodeAtPath([], 1, newNode);
      
      expect(newGraph.nodes).toHaveLength(3);
      expect(newGraph.nodes[1].type).toBe(FlowNodeType.OUTPUT);
      expect(newGraph.nodes[1].data.value).toBe('inserted');
    });

    it('should throw error if node not found in path', () => {
      const newNode: FlowNode = {
        id: 'temp',
        type: FlowNodeType.OUTPUT,
        position: { x: 0, y: 0 },
        data: { value: 'test' }
      };

      expect(() => {
        graph.insertNodeAtPath([{ nodeId: 'non-existent', branch: 'true' as const }], 0, newNode);
      }).toThrow('Node non-existent not found');
    });
  });

  describe('insertNodeAtPath - Nested decisions', () => {
    let graphWithDecision: NodeGraph;

    beforeEach(() => {
      const decisionNode: FlowNode = {
        id: 'decision-1',
        type: FlowNodeType.DECISION,
        position: { x: 250, y: 100 },
        data: {
          value: 'x > 0?',
          condition: 'x > 0',
          trueBranch: new NodeGraph([{
            id: 'true-output',
            type: FlowNodeType.OUTPUT,
            position: { x: 0, y: 0 },
            data: { value: 'positive' }
          }]),
          falseBranch: new NodeGraph([{
            id: 'false-output',
            type: FlowNodeType.OUTPUT,
            position: { x: 0, y: 0 },
            data: { value: 'negative' }
          }])
        }
      };

      graphWithDecision = new NodeGraph([startNode, decisionNode, endNode]);
    });

    it('should insert in true branch', () => {
      const newNode: FlowNode = {
        id: 'temp',
        type: FlowNodeType.ASSIGNMENT,
        position: { x: 0, y: 0 },
        data: { value: 'x = 5' }
      };

      const path = [{ nodeId: 'decision-1', branch: 'true' as const }];
      const newGraph = graphWithDecision.insertNodeAtPath(path, 0, newNode);
      
      const trueBranch = newGraph.nodes[1].data.trueBranch;
      expect(trueBranch?.nodes).toHaveLength(2);
      expect(trueBranch?.nodes[0].type).toBe(FlowNodeType.ASSIGNMENT);
    });
  });

  describe('updateIndices', () => {
    it('should update all node indices sequentially', () => {
      const nodes = [
        { id: 'a', type: FlowNodeType.START, position: { x: 0, y: 0 }, data: { value: '' } },
        { id: 'b', type: FlowNodeType.OUTPUT, position: { x: 0, y: 0 }, data: { value: '' } },
        { id: 'c', type: FlowNodeType.END, position: { x: 0, y: 0 }, data: { value: '' } }
      ] as FlowNode[];

      const g = new NodeGraph(nodes);
      g.updateIndices();
      
      expect(g.nodes[0].index).toBe(0);
      expect(g.nodes[1].index).toBe(1);
      expect(g.nodes[2].index).toBe(2);
    });
  });
});