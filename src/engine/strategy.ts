import { stepsToTerms, type CollapseMode } from './collapse';
import { EGO_ID } from './family';
import {
  allShortestPaths,
  buildGraph,
  pathToSteps,
  shortestPath,
  walkPath,
  type FamilyGraph,
} from './graph';
import { buildPhrase, type Anchor, type PhraseToken } from './phrase';
import type { AtomicStep, Term } from './types';

export interface Strategy {
  name: string; // Polish label for the slider
  collapse: CollapseMode;
  wander: number; // 0 = shortest route; >0 = that many wandering steps before closing in
}

// The complexity slider, simple → convoluted.
export const STRATEGIES: Strategy[] = [
  { name: 'Zwięzły', collapse: 'full', wander: 0 },
  { name: 'Klasyczny', collapse: 'anchor', wander: 0 },
  { name: 'Dosłowny', collapse: 'none', wander: 0 },
  { name: 'Okrężny', collapse: 'anchor', wander: 3 },
  { name: 'Kręty', collapse: 'anchor', wander: 6 },
  { name: 'Zawiły', collapse: 'anchor', wander: 10 },
  { name: 'Karkołomny', collapse: 'none', wander: 15 },
];

export interface RelationResult {
  fromId: string;
  toId: string;
  strategyIndex: number;
  strategy: Strategy;
  path: string[]; // node ids, ja-end → target-end
  steps: AtomicStep[];
  terms: Term[]; // reading order (target → ja)
  tokens: PhraseToken[]; // the phrase as individually renderable words
  text: string;
  usesArchaic: boolean;
  hops: number;
}

function pickPath(
  g: FamilyGraph,
  from: string,
  to: string,
  strategy: Strategy,
  blocked?: Set<string>,
  variant = 0,
): string[] | null {
  // Low levels: the canonical fewest-hops route (variant cycles equally-short ties).
  if (strategy.wander === 0) {
    const sp = allShortestPaths(g, from, to, blocked);
    return sp.length ? sp[variant % sp.length] : shortestPath(g, from, to, blocked);
  }
  // Higher levels: a wandering walk; `variant` reseeds it for the "different route" button.
  return walkPath(g, from, to, strategy.wander, blocked, variant + 1);
}

// Describe the connection between two people at a given complexity level.
export function describeRelation(
  g: FamilyGraph,
  fromId: string,
  toId: string,
  strategyIndex: number,
  blocked?: Set<string>,
  variant = 0,
): RelationResult | null {
  const strategy = STRATEGIES[strategyIndex] ?? STRATEGIES[0];
  const path = pickPath(g, fromId, toId, strategy, blocked, variant);
  if (!path) return null;

  const steps = pathToSteps(g, path);
  const terms = stepsToTerms(steps, strategy.collapse);
  // Possessive "mój/moja" only when speaking as "ja"; otherwise anchor on the start
  // person's kinship role in the genitive (e.g. "matki", "wujka") - no personal names.
  let anchor: Anchor;
  if (fromId === EGO_ID) {
    anchor = { kind: 'ego' };
  } else {
    const rel = relationToEgo(g, fromId);
    anchor = { kind: 'name', possessor: rel.term?.forms.gen ?? rel.text };
  }
  const phrase = buildPhrase(terms, anchor);

  return {
    fromId,
    toId,
    strategyIndex,
    strategy,
    path,
    steps,
    terms: phrase.terms,
    tokens: phrase.tokens,
    text: phrase.text,
    usesArchaic: phrase.usesArchaic,
    hops: steps.length,
  };
}

// The short badge shown on each node: its everyday relation to "ja".
export interface RelationLabel {
  text: string;
  term?: Term; // present when it collapses to a single idiom (for tooltip/archaic mark)
  side?: string; // "od ojca"/"od matki" when the label is otherwise a duplicate (tooltip only)
}

export function relationToEgo(g: FamilyGraph, personId: string): RelationLabel {
  if (personId === EGO_ID) return { text: 'ja' };
  const path = shortestPath(g, EGO_ID, personId);
  if (!path) return { text: '-' };
  const terms = stepsToTerms(pathToSteps(g, path), 'full');
  if (terms.length === 1) return { text: terms[0].forms.nom, term: terms[0] };
  return { text: buildPhrase(terms, { kind: 'ego' }).text };
}

// Convenience singleton - the family graph never changes at runtime.
export const graph: FamilyGraph = buildGraph();

// Which parent a person is reached through (for disambiguating duplicate labels).
function egoSide(g: FamilyGraph, personId: string): string | undefined {
  const path = shortestPath(g, EGO_ID, personId);
  if (!path || path.length < 2) return undefined;
  const s0 = pathToSteps(g, path)[0];
  if (s0.rel !== 'PARENT') return undefined;
  return s0.toGender === 'M' ? 'od ojca' : 'od matki';
}

// Badges for every person. When two people share the same kinship word (e.g. both
// grandfathers are "dziadek"), the side they come from ("od ojca"/"od matki") is recorded
// on `side` so the tooltip can distinguish them, while the visible label stays the same.
export function egoLabels(g: FamilyGraph): Map<string, RelationLabel> {
  const base = new Map<string, { label: RelationLabel; side?: string }>();
  const counts = new Map<string, number>();
  for (const id of g.persons.keys()) {
    const label = relationToEgo(g, id);
    base.set(id, { label, side: egoSide(g, id) });
    counts.set(label.text, (counts.get(label.text) ?? 0) + 1);
  }

  const out = new Map<string, RelationLabel>();
  for (const [id, { label, side }] of base) {
    const isDuplicate = (counts.get(label.text) ?? 0) > 1;
    out.set(id, isDuplicate && side ? { ...label, side } : label);
  }
  return out;
}

export const egoLabelMap = egoLabels(graph);
