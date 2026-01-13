/**
 * Utility functions for geometric calculations.
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Calculates the squared distance between two points.
 * Using squared distance is faster as it avoids square root.
 */
export const getDistanceSquared = (p1: Point, p2: Point): number => {
  return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
};

/**
 * Calculates the distance between a point and a line segment.
 * 
 * @param p The point to check
 * @param v The start point of the line segment
 * @param w The end point of the line segment
 * @returns The distance from point p to the segment vw
 */
export const getDistanceToSegment = (p: Point, v: Point, w: Point): number => {
  const l2 = getDistanceSquared(v, w);
  if (l2 === 0) return Math.sqrt(getDistanceSquared(p, v));

  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));

  const projection = {
    x: v.x + t * (w.x - v.x),
    y: v.y + t * (w.y - v.y)
  };

  return Math.sqrt(getDistanceSquared(p, projection));
};

/**
 * Calculates the center point of a rectangle or node.
 */
export const getCenter = (x: number, y: number, width: number, height: number): Point => {
  return {
    x: x + width / 2,
    y: y + height / 2
  };
};
