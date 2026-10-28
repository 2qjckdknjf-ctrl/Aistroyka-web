import { add, cmp, decimal, div, half, key, mul, one, sub, zero, type Rational } from "./exact-decimal";

export type Shape = { kind: "rectangle"; origin: { x: string; y: string }; width: string; height: string }
  | { kind: "polygon"; vertices: { x: string; y: string }[] };
type Point = { x: Rational; y: Rational };
type Edge = { a: Point; b: Point };
export type Polygon = Point[];
export class GeometryError extends Error {
  constructor(public readonly code: "invalid_geometry" | "outside_parent" | "complexity_limit") { super(code); }
}
class Budget {
  private work = 0;
  tick(amount = 1) { this.work += amount; if (this.work > 500_000) throw new GeometryError("complexity_limit"); }
}
const cross = (a: Point, b: Point) => sub(mul(a.x, b.y), mul(a.y, b.x));
const delta = (a: Point, b: Point): Point => ({ x: sub(a.x, b.x), y: sub(a.y, b.y) });
const edges = (p: Polygon): Edge[] => p.map((a, i) => ({ a, b: p[(i + 1) % p.length] }));
const between = (x: Rational, a: Rational, b: Rational) => cmp(x, cmp(a, b) < 0 ? a : b) >= 0 && cmp(x, cmp(a, b) > 0 ? a : b) <= 0;
const onSegment = (p: Point, e: Edge) => cmp(cross(delta(p, e.a), delta(e.b, e.a)), zero) === 0
  && between(p.x, e.a.x, e.b.x) && between(p.y, e.a.y, e.b.y);
function intersection(a: Edge, b: Edge): Point | null {
  const r = delta(a.b, a.a), s = delta(b.b, b.a), denominator = cross(r, s);
  if (cmp(denominator, zero) === 0) return null;
  const offset = delta(b.a, a.a), t = div(cross(offset, s), denominator), u = div(cross(offset, r), denominator);
  if (!between(t, zero, one) || !between(u, zero, one)) return null;
  return { x: add(a.a.x, mul(t, r.x)), y: add(a.a.y, mul(t, r.y)) };
}
export function polygonArea(p: Polygon): Rational {
  const signed = half(edges(p).reduce((sum, e) => add(sum, cross(e.a, e.b)), zero));
  return cmp(signed, zero) < 0 ? sub(zero, signed) : signed;
}
/** A stable physical contour may start at any vertex and use either winding. */
export function polygonIdentity(p: Polygon): string {
  const vertices = p.map(v => `${key(v.x)},${key(v.y)}`);
  const variants = [vertices, [...vertices].reverse()].flatMap(order =>
    order.map((_, index) => [...order.slice(index), ...order.slice(0, index)].join(";")));
  return variants.sort()[0];
}
export function toPolygon(shape: Shape): Polygon {
  let p: Polygon;
  if (shape.kind === "rectangle") {
    const x = decimal(shape.origin.x), y = decimal(shape.origin.y), w = decimal(shape.width), h = decimal(shape.height);
    if (cmp(w, zero) <= 0 || cmp(h, zero) <= 0) throw new GeometryError("invalid_geometry");
    p = [{ x, y }, { x: add(x, w), y }, { x: add(x, w), y: add(y, h) }, { x, y: add(y, h) }];
  } else {
    p = shape.vertices.map(v => ({ x: decimal(v.x), y: decimal(v.y) }));
  }
  if (p.length < 3 || p.length > 128 || cmp(polygonArea(p), zero) === 0
      || new Set(p.map(v => `${key(v.x)},${key(v.y)}`)).size !== p.length) throw new GeometryError("invalid_geometry");
  const bound = decimal("1000000");
  if (p.some(v => cmp(v.x, bound) > 0 || cmp(v.x, sub(zero, bound)) < 0 || cmp(v.y, bound) > 0 || cmp(v.y, sub(zero, bound)) < 0)) throw new GeometryError("complexity_limit");
  const es = edges(p);
  for (let i = 0; i < es.length; i++) {
    for (let j = i + 1; j < es.length; j++) {
      const a = es[i], b = es[j];
      if (j === i + 1 || (i === 0 && j === es.length - 1)) {
        // Adjacent collinear edges may continue, but cannot fold back over each other.
        const shared = j === i + 1 ? a.b : a.a;
        const otherA = j === i + 1 ? a.a : a.b, otherB = j === i + 1 ? b.b : b.a;
        const va = delta(otherA, shared), vb = delta(otherB, shared);
        if (cmp(cross(va, vb), zero) === 0 && cmp(add(mul(va.x, vb.x), mul(va.y, vb.y)), zero) > 0) throw new GeometryError("invalid_geometry");
      } else if (intersection(a, b) || onSegment(a.a, b) || onSegment(a.b, b) || onSegment(b.a, a) || onSegment(b.b, a)) {
        throw new GeometryError("invalid_geometry");
      }
    }
  }
  return p;
}
type Interval = { low: Edge; high: Edge };
const yAt = (e: Edge, x: Rational) => add(e.a.y, mul(div(sub(x, e.a.x), sub(e.b.x, e.a.x)), sub(e.b.y, e.a.y)));
function slice(p: Polygon, x: Rational, budget: Budget): Interval[] {
  const crossings = edges(p).filter(e => { budget.tick(); return cmp(e.a.x, e.b.x) !== 0 && between(x, e.a.x, e.b.x); });
  crossings.sort((a, b) => cmp(yAt(a, x), yAt(b, x)));
  if (crossings.length % 2) throw new GeometryError("invalid_geometry");
  const intervals: Interval[] = [];
  for (let i = 0; i < crossings.length; i += 2) intervals.push({ low: crossings[i], high: crossings[i + 1] });
  return intervals;
}

/** Exact vertical decomposition of intersection-of-unions minus a union of holes.
 * Edge crossings split slabs so each retained band's endpoints remain linear.
 * No bounding-box approximation, floating epsilon or intermediate area rounding.
 */
export function coveredArea(groups: Polygon[][], deductions: Polygon[] = []): Rational {
  if (!groups.length || groups.some(group => !group.length)) return zero;
  const budget = new Budget();
  const all = [...groups.flat(), ...deductions];
  const es = all.flatMap(edges);
  if (es.length > 256 || all.length > 64) throw new GeometryError("complexity_limit");
  const xs = new Map<string, Rational>();
  const push = (x: Rational) => { xs.set(key(x), x); if (xs.size > 512) throw new GeometryError("complexity_limit"); };
  es.forEach(e => { push(e.a.x); push(e.b.x); });
  for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) {
    budget.tick(); const point = intersection(es[i], es[j]); if (point) push(point.x);
  }
  const sorted = [...xs.values()].sort(cmp);
  let total = zero;
  for (let i = 0; i + 1 < sorted.length; i++) {
    const left = sorted[i], right = sorted[i + 1], middle = half(add(left, right));
    const groupSlices = groups.map(group => group.flatMap(p => slice(p, middle, budget)));
    const holes = deductions.flatMap(p => slice(p, middle, budget));
    const allIntervals = [...groupSlices.flat(), ...holes];
    const boundaryMap = new Map<string, Edge>();
    allIntervals.forEach(s => { boundaryMap.set(key(yAt(s.low, middle)), s.low); boundaryMap.set(key(yAt(s.high, middle)), s.high); });
    const boundaries = [...boundaryMap.values()].sort((a, b) => cmp(yAt(a, middle), yAt(b, middle)));
    const contains = (list: Interval[], y: Rational) => list.some(s => {
      budget.tick(); return cmp(y, yAt(s.low, middle)) > 0 && cmp(y, yAt(s.high, middle)) < 0;
    });
    for (let j = 0; j + 1 < boundaries.length; j++) {
      const low = boundaries[j], high = boundaries[j + 1];
      const center = half(add(yAt(low, middle), yAt(high, middle)));
      if (!groupSlices.every(list => contains(list, center)) || contains(holes, center)) continue;
      const hLeft = sub(yAt(high, left), yAt(low, left)), hRight = sub(yAt(high, right), yAt(low, right));
      total = add(total, mul(sub(right, left), half(add(hLeft, hRight))));
    }
  }
  return total;
}
export function requireInside(parent: Polygon, child: Polygon): void {
  if (cmp(coveredArea([[parent], [child]]), polygonArea(child)) !== 0) throw new GeometryError("outside_parent");
}
