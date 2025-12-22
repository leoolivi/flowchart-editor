import type { FlowchartGraph } from "../types/graph";

class NodeSerializer {
    public serializeGraph(graph: FlowchartGraph): string {
    return JSON.stringify(graph);
    }

    public deserializeGraph(json: string): FlowchartGraph {
        // parsing + validazione
        const graph = JSON.parse(json);
        // validateGraph(graph); // lancia errore se invalido
        return graph;
    }
}

export const Serializer = new NodeSerializer(); // Singleton instance