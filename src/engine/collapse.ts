import { atomicTerm, IDIOMS } from './lexicon';
import type { AtomicRel, AtomicStep, Gender, Term } from './types';

export type CollapseMode = 'none' | 'anchor' | 'full';

interface PatStep {
  rel: AtomicRel;
  g?: Gender; // undefined = any gender
}
interface Rule {
  pattern: PatStep[];
  term: string; // key into IDIOMS
}

// Ordered longest-first so greedy matching prefers the more specific idiom.
// Patterns are read from the anchor (the "ja"/ego end) outward.
const RULES: Rule[] = [
  // --- 3-step ---
  { pattern: [{ rel: 'PARENT' }, { rel: 'PARENT' }, { rel: 'PARENT', g: 'M' }], term: 'pradziadek' },
  { pattern: [{ rel: 'PARENT' }, { rel: 'PARENT' }, { rel: 'PARENT', g: 'F' }], term: 'prababcia' },
  { pattern: [{ rel: 'PARENT', g: 'M' }, { rel: 'SIBLING', g: 'M' }, { rel: 'CHILD', g: 'M' }], term: 'bratStryjeczny' },
  { pattern: [{ rel: 'PARENT', g: 'M' }, { rel: 'SIBLING', g: 'M' }, { rel: 'CHILD', g: 'F' }], term: 'siostraStryjeczna' },
  { pattern: [{ rel: 'PARENT', g: 'F' }, { rel: 'SIBLING', g: 'M' }, { rel: 'CHILD', g: 'M' }], term: 'bratWujeczny' },
  { pattern: [{ rel: 'PARENT', g: 'F' }, { rel: 'SIBLING', g: 'M' }, { rel: 'CHILD', g: 'F' }], term: 'siostraWujeczna' },
  { pattern: [{ rel: 'PARENT' }, { rel: 'SIBLING', g: 'F' }, { rel: 'CHILD', g: 'M' }], term: 'bratCioteczny' },
  { pattern: [{ rel: 'PARENT' }, { rel: 'SIBLING', g: 'F' }, { rel: 'CHILD', g: 'F' }], term: 'siostraCioteczna' },
  { pattern: [{ rel: 'PARENT', g: 'M' }, { rel: 'SIBLING', g: 'M' }, { rel: 'SPOUSE', g: 'F' }], term: 'stryjenka' },
  { pattern: [{ rel: 'PARENT', g: 'F' }, { rel: 'SIBLING', g: 'M' }, { rel: 'SPOUSE', g: 'F' }], term: 'wujenka' },
  { pattern: [{ rel: 'PARENT' }, { rel: 'SIBLING', g: 'F' }, { rel: 'SPOUSE', g: 'M' }], term: 'pociot' },
  { pattern: [{ rel: 'SPOUSE', g: 'F' }, { rel: 'SIBLING', g: 'F' }, { rel: 'SPOUSE', g: 'M' }], term: 'paszenog' },
  { pattern: [{ rel: 'SPOUSE', g: 'M' }, { rel: 'SIBLING', g: 'M' }, { rel: 'SPOUSE', g: 'F' }], term: 'jatrew' },

  // --- 2-step ---
  { pattern: [{ rel: 'PARENT' }, { rel: 'PARENT', g: 'M' }], term: 'dziadek' },
  { pattern: [{ rel: 'PARENT' }, { rel: 'PARENT', g: 'F' }], term: 'babcia' },
  { pattern: [{ rel: 'CHILD' }, { rel: 'CHILD', g: 'M' }], term: 'wnuk' },
  { pattern: [{ rel: 'CHILD' }, { rel: 'CHILD', g: 'F' }], term: 'wnuczka' },
  { pattern: [{ rel: 'PARENT', g: 'M' }, { rel: 'SIBLING', g: 'M' }], term: 'stryj' },
  { pattern: [{ rel: 'PARENT', g: 'F' }, { rel: 'SIBLING', g: 'M' }], term: 'wujek' },
  { pattern: [{ rel: 'PARENT' }, { rel: 'SIBLING', g: 'F' }], term: 'ciotka' },
  { pattern: [{ rel: 'SIBLING', g: 'M' }, { rel: 'CHILD', g: 'M' }], term: 'bratanek' },
  { pattern: [{ rel: 'SIBLING', g: 'M' }, { rel: 'CHILD', g: 'F' }], term: 'bratanica' },
  { pattern: [{ rel: 'SIBLING', g: 'F' }, { rel: 'CHILD', g: 'M' }], term: 'siostrzeniec' },
  { pattern: [{ rel: 'SIBLING', g: 'F' }, { rel: 'CHILD', g: 'F' }], term: 'siostrzenica' },
  { pattern: [{ rel: 'SPOUSE', g: 'F' }, { rel: 'PARENT', g: 'M' }], term: 'tesc' },
  { pattern: [{ rel: 'SPOUSE', g: 'F' }, { rel: 'PARENT', g: 'F' }], term: 'tesciowa' },
  { pattern: [{ rel: 'SPOUSE', g: 'M' }, { rel: 'PARENT', g: 'M' }], term: 'swiekier' },
  { pattern: [{ rel: 'SPOUSE', g: 'M' }, { rel: 'PARENT', g: 'F' }], term: 'swiekra' },
  { pattern: [{ rel: 'SPOUSE', g: 'M' }, { rel: 'SIBLING', g: 'M' }], term: 'dziewierz' },
  { pattern: [{ rel: 'SPOUSE', g: 'M' }, { rel: 'SIBLING', g: 'F' }], term: 'zelwa' },
  { pattern: [{ rel: 'SPOUSE', g: 'F' }, { rel: 'SIBLING', g: 'M' }], term: 'szurzy' },
  { pattern: [{ rel: 'SPOUSE', g: 'F' }, { rel: 'SIBLING', g: 'F' }], term: 'swiesc' },
  { pattern: [{ rel: 'SIBLING', g: 'M' }, { rel: 'SPOUSE', g: 'F' }], term: 'bratowa' },
  { pattern: [{ rel: 'SIBLING', g: 'F' }, { rel: 'SPOUSE', g: 'M' }], term: 'swak' },
  { pattern: [{ rel: 'CHILD', g: 'F' }, { rel: 'SPOUSE', g: 'M' }], term: 'ziec' },
  { pattern: [{ rel: 'CHILD', g: 'M' }, { rel: 'SPOUSE', g: 'F' }], term: 'synowa' },
  // step-parents: a parent's spouse who is not the other bio-parent. Safe because a
  // bio-parent is always reached by the shorter direct PARENT edge, so this 2-hop
  // pattern only wins for an actual step-parent.
  { pattern: [{ rel: 'PARENT', g: 'M' }, { rel: 'SPOUSE', g: 'F' }], term: 'macocha' },
  { pattern: [{ rel: 'PARENT', g: 'F' }, { rel: 'SPOUSE', g: 'M' }], term: 'ojczym' },
];

function matches(pat: PatStep, step: AtomicStep): boolean {
  return pat.rel === step.rel && (pat.g === undefined || pat.g === step.toGender);
}

// Longest rule whose pattern matches the steps starting at `i`; null if none.
function ruleAt(steps: AtomicStep[], i: number): Rule | null {
  for (const rule of RULES) {
    const p = rule.pattern;
    if (i + p.length > steps.length) continue;
    if (p.every((ps, k) => matches(ps, steps[i + k]))) return rule;
  }
  return null;
}

// Turn a walk (ordered ja→target) into the chain of naming terms (same order),
// folding atomic hops into idioms according to `mode`.
export function stepsToTerms(steps: AtomicStep[], mode: CollapseMode): Term[] {
  const out: Term[] = [];
  let i = 0;
  while (i < steps.length) {
    // 'anchor' only collapses the single idiom nearest the anchor (i === 0).
    const mayCollapse = mode === 'full' || (mode === 'anchor' && i === 0);
    const rule = mayCollapse ? ruleAt(steps, i) : null;
    if (rule) {
      out.push(IDIOMS[rule.term]);
      i += rule.pattern.length;
    } else {
      const s = steps[i];
      out.push(atomicTerm(s.rel, s.toGender));
      i += 1;
    }
  }
  return out;
}
