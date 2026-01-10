export interface Rect {
    x: number,
    y: number,
    w: number,
    h: number
}

export type GraphPath = GraphPathNode[];

export type GraphPathNode = {
    nodeId: string;
    branch: "true" | "false";
}