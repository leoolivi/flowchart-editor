import NodeGraph from "../models/NodeGraph";

class NodeSerializer {
    public serializeGraph(graph: NodeGraph): string {
    return JSON.stringify(graph);
    }

    public deserializeGraph(json: string): NodeGraph {
        // parsing + validazione
        const graph = JSON.parse(json);
        // validateGraph(graph); // lancia errore se invalido
        return graph;
    }
}

export const Serializer = new NodeSerializer(); // Singleton instance