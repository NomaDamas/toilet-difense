export class Path {
  constructor(points) {
    this.points = points.map((p) => ({ x: p.x, y: p.y }));
    this.segments = [];
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      this.segments.push({ length: len, total, dx: dx / len, dy: dy / len });
      total += len;
    }
    this.totalLength = total;
  }

  positionAt(distance) {
    if (distance <= 0)
      return { x: this.points[0].x, y: this.points[0].y, segIndex: 0 };
    if (distance >= this.totalLength) {
      const last = this.points[this.points.length - 1];
      return { x: last.x, y: last.y, segIndex: this.segments.length - 1 };
    }
    for (let i = 0; i < this.segments.length; i++) {
      const s = this.segments[i];
      const end = s.total + s.length;
      if (distance < end) {
        const local = distance - s.total;
        return {
          x: this.points[i].x + s.dx * local,
          y: this.points[i].y + s.dy * local,
          segIndex: i,
        };
      }
    }
    const last = this.points[this.points.length - 1];
    return { x: last.x, y: last.y, segIndex: this.segments.length - 1 };
  }

  distanceFromPath(x, y) {
    let best = Infinity;
    for (let i = 0; i < this.segments.length; i++) {
      const a = this.points[i];
      const b = this.points[i + 1];
      const d = pointSegmentDistance(x, y, a.x, a.y, b.x, b.y);
      if (d < best) best = d;
    }
    return best;
  }
}

function pointSegmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}
