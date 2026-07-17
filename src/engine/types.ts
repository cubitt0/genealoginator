// Core domain types for the relationship engine.

export type Gender = 'M' | 'F';

// The atomic relations that make up the family graph. Most idiomatic terms
// (wujek, stryj, babcia, dziewierz…) are composed from a sequence of these.
// HALFSIBLING (shares exactly one parent) is kept distinct from SIBLING so that
// half-siblings read as "przyrodni brat / przyrodnia siostra", not "brat / siostra".
export type AtomicRel = 'PARENT' | 'CHILD' | 'SPOUSE' | 'SIBLING' | 'HALFSIBLING';

// Grammatical case. Polish uses many; we only ever need two positions in a chain:
//  - nom (mianownik):  the HEAD of the phrase ("córka …")
//  - gen (dopełniacz):  every NESTED term ("… męża siostry mojego wujka")
export type GramCase = 'nom' | 'gen';

// A person is only STRUCTURE - no personal name is stored in code. Their on-screen
// identity is the kinship role relative to "ja" (derived), plus an optional name the
// user may type at runtime (kept only in their browser, never in the repo).
export interface Person {
  id: string; // role-based, not a personal name
  gender: Gender;
  gen: number; // generation index (row), 0 = oldest
  order: number; // horizontal position within the layout
}

// A single hop in a walk through the tree: "the next person is `rel` of the current one".
// `toGender` is the gender of the person we just stepped onto (needed to pick brat vs siostra).
export interface AtomicStep {
  rel: AtomicRel;
  toGender: Gender;
  toId: string;
}

// The inflected forms a word can take. Extendable to more cases if new phrasings need them.
export interface Forms {
  nom: string; // mianownik
  gen: string; // dopełniacz
}

// One naming term that can appear in a chain - an atomic word (brat) or an idiom (stryj).
// It carries its OWN case variants; nothing is stored as a single fixed string.
export interface Term {
  key: string;
  gender: Gender; // grammatical gender, drives the possessive (mój/moja)
  forms: Forms;
  archaic?: boolean; // dawne / wychodzące z użycia
  alias?: Forms; // współczesny odpowiednik, inflected the same way (for the click-to-swap toggle)
  gloss?: string; // plain meaning, e.g. "brat ojca"
}
