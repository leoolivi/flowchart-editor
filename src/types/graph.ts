import type { Edge, Node } from "@xyflow/react";

// Tipi di nodi del flowchart
export enum FlowchartNodeType {
  START = 'start',           // ovale inizio
  END = 'end',               // ovale fine
  PROCESS = 'process',       // rettangolo
  DECISION = 'decision',     // rombo
  INPUT_OUTPUT = 'io',       // parallelogramma
  MERGE = 'merge',         // cerchio di unione
  // SUBPROCESS = 'subprocess'  // rettangolo con bordi doppi (opzionale)
}

// Dati specifici di ogni nodo
export interface FlowchartNodeData extends Record<string, unknown> {
  content: string;
  description?: string;
  // Per i decision node
  trueLabel?: string;   // es. "Sì"
  falseLabel?: string;  // es. "No"
  // Altri metadati utili
  color?: string;
  validated?: boolean;
}

// Il nodo completo (estende il Node di ReactFlow)
export interface FlowchartNode extends Node {
  type: FlowchartNodeType;
  data: FlowchartNodeData;
  // ReactFlow aggiunge automaticamente: id, position, etc.
}

export enum EdgeType {
  DEFAULT = 'default',
  TRUE_BRANCH = 'true',
  FALSE_BRANCH = 'false'
}

export interface FlowchartEdgeData extends Record<string, unknown> {
  label?: string;
  branchType?: EdgeType;
  animated?: boolean;
}

export interface FlowchartEdge extends Edge {
  data?: FlowchartEdgeData;
  // ReactFlow aggiunge: id, source, target, sourceHandle, targetHandle
}

export interface FlowchartGraph {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  metadata: {
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    version: string;
  };
}