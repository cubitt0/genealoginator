import { PARENT_CHILD, PEOPLE, SPOUSES } from './family';
import type { AtomicRel, AtomicStep, Person } from './types';

export interface Edge {
  to: string;
  rel: AtomicRel; // relation of `to` relative to the source node
}

export interface FamilyGraph {
  persons: Map<string, Person>;
  adj: Map<string, Edge[]>;
}

// Small seeded PRNG + shuffle, so a "variant" number reproducibly reshuffles which
// branches the path search explores first (drives the "different route" button).
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffled<T>(arr: readonly T[], rnd: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function addEdge(adj: Map<string, Edge[]>, from: string, to: string, rel: AtomicRel, seen: Set<string>) {
  const key = `${from}|${to}|${rel}`;
  if (seen.has(key)) return;
  seen.add(key);
  (adj.get(from) ?? adj.set(from, []).get(from)!).push({ to, rel });
}

export function buildGraph(): FamilyGraph {
  const persons = new Map(PEOPLE.map((p) => [p.id, p]));
  const adj = new Map<string, Edge[]>();
  for (const p of PEOPLE) adj.set(p.id, []);
  const seen = new Set<string>();

  for (const [parent, child] of PARENT_CHILD) {
    addEdge(adj, parent, child, 'CHILD', seen);
    addEdge(adj, child, parent, 'PARENT', seen);
  }
  for (const [a, b] of SPOUSES) {
    addEdge(adj, a, b, 'SPOUSE', seen);
    addEdge(adj, b, a, 'SPOUSE', seen);
  }

  // Siblings: share the SAME two parents → full SIBLING; share exactly one → HALFSIBLING.
  const parentsOf = new Map<string, Set<string>>();
  for (const [parent, child] of PARENT_CHILD) {
    (parentsOf.get(child) ?? parentsOf.set(child, new Set()).get(child)!).add(parent);
  }
  const kids = [...parentsOf.keys()];
  for (let i = 0; i < kids.length; i++) {
    for (let j = i + 1; j < kids.length; j++) {
      const pa = parentsOf.get(kids[i])!;
      const pb = parentsOf.get(kids[j])!;
      let shared = 0;
      for (const p of pa) if (pb.has(p)) shared++;
      if (shared === 0) continue;
      const rel: AtomicRel = shared === pa.size && shared === pb.size ? 'SIBLING' : 'HALFSIBLING';
      addEdge(adj, kids[i], kids[j], rel, seen);
      addEdge(adj, kids[j], kids[i], rel, seen);
    }
  }

  return { persons, adj };
}

// Convert a node walk into atomic naming steps (each: how `to` relates to the prev node).
export function pathToSteps(g: FamilyGraph, path: string[]): AtomicStep[] {
  const steps: AtomicStep[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    const edge = g.adj.get(from)!.find((e) => e.to === to)!;
    steps.push({ rel: edge.rel, toGender: g.persons.get(to)!.gender, toId: to });
  }
  return steps;
}

// Nodes reachable from `start`, never stepping onto a blocked node.
export function reachableFrom(g: FamilyGraph, start: string, blocked?: Set<string>): Set<string> {
  const seen = new Set<string>();
  if (blocked?.has(start)) return seen;
  seen.add(start);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const { to } of g.adj.get(cur)!) {
      if (seen.has(to) || blocked?.has(to)) continue;
      seen.add(to);
      queue.push(to);
    }
  }
  return seen;
}

// Fewest-hops path between two people (BFS), skipping blocked nodes. null if unrelated.
export function shortestPath(
  g: FamilyGraph,
  a: string,
  b: string,
  blocked?: Set<string>,
): string[] | null {
  if (blocked?.has(a) || blocked?.has(b)) return null;
  if (a === b) return [a];
  const prev = new Map<string, string>();
  const queue = [a];
  const visited = new Set([a]);
  while (queue.length) {
    const cur = queue.shift()!;
    for (const { to } of g.adj.get(cur)!) {
      if (visited.has(to) || blocked?.has(to)) continue;
      visited.add(to);
      prev.set(to, cur);
      if (to === b) {
        const path = [b];
        let n = b;
        while (n !== a) {
          n = prev.get(n)!;
          path.unshift(n);
        }
        return path;
      }
      queue.push(to);
    }
  }
  return null;
}

// All simple (no repeated node) paths a→b, up to `maxEdges` long, capped in count.
export function simplePaths(
  g: FamilyGraph,
  a: string,
  b: string,
  maxEdges = 10,
  cap = 6000,
  blocked?: Set<string>,
  seed?: number,
): string[][] {
  const results: string[][] = [];
  if (blocked?.has(a) || blocked?.has(b)) return results;
  const path: string[] = [a];
  const onPath = new Set([a]);
  const rnd = seed !== undefined ? rng(seed) : null;

  const dfs = (cur: string) => {
    if (results.length >= cap) return;
    if (cur === b) {
      results.push([...path]);
      return;
    }
    if (path.length - 1 >= maxEdges) return;
    const neighbors = rnd ? shuffled(g.adj.get(cur)!, rnd) : g.adj.get(cur)!;
    for (const { to } of neighbors) {
      if (onPath.has(to) || blocked?.has(to)) continue;
      onPath.add(to);
      path.push(to);
      dfs(to);
      path.pop();
      onPath.delete(to);
    }
  };

  dfs(a);
  return results;
}

// A wandering walk a→b: take `wander` random steps first (never immediately doubling back,
// but allowed to revisit and to poke into dead-end branches like the wife's family), then
// close with the shortest route to b. Unlike simple paths this can produce the classic
// convoluted descriptions ("… córki teściowej …") because it may leave and re-enter.
export function walkPath(
  g: FamilyGraph,
  from: string,
  to: string,
  wander: number,
  blocked?: Set<string>,
  seed = 0,
): string[] | null {
  if (blocked?.has(from) || blocked?.has(to)) return null;
  const rnd = rng(seed);
  const walk = [from];
  let prev: string | null = null;
  let cur = from;
  let lastRel: string | null = null;
  let lastGender: string | null = null;

  for (let i = 0; i < wander; i++) {
    const nbrs = g.adj.get(cur)!.filter((e) => e.to !== prev && !blocked?.has(e.to));
    if (nbrs.length === 0) break;
    // avoid taking the same relation-and-gender step twice in a row, which reads as an
    // ugly repetition ("matki matki", "córki córki"); fall back if that's all there is.
    const varied = nbrs.filter(
      (e) => !(e.rel === lastRel && g.persons.get(e.to)!.gender === lastGender),
    );
    const pool = varied.length ? varied : nbrs;
    const edge = pool[Math.floor(rnd() * pool.length)];
    walk.push(edge.to);
    prev = cur;
    cur = edge.to;
    lastRel = edge.rel;
    lastGender = g.persons.get(edge.to)!.gender;
  }

  const close = shortestPath(g, cur, to, blocked);
  if (!close) return shortestPath(g, from, to, blocked);
  for (let i = 1; i < close.length; i++) walk.push(close[i]);
  return walk;
}

// Every fewest-hops path a→b (there can be several), for choosing among equally short routes.
export function allShortestPaths(
  g: FamilyGraph,
  a: string,
  b: string,
  blocked?: Set<string>,
  cap = 200,
): string[][] {
  if (blocked?.has(a) || blocked?.has(b)) return [];
  const dist = new Map<string, number>([[a, 0]]);
  const queue = [a];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const { to } of g.adj.get(cur)!) {
      if (blocked?.has(to) || dist.has(to)) continue;
      dist.set(to, dist.get(cur)! + 1);
      queue.push(to);
    }
  }
  if (!dist.has(b)) return [];

  const results: string[][] = [];
  const path = [b];
  const walk = (node: string) => {
    if (results.length >= cap) return;
    if (node === a) {
      results.push([...path].reverse());
      return;
    }
    for (const { to } of g.adj.get(node)!) {
      if (blocked?.has(to)) continue;
      if (dist.get(to) === dist.get(node)! - 1) {
        path.push(to);
        walk(to);
        path.pop();
      }
    }
  };
  walk(b);
  return results;
}
