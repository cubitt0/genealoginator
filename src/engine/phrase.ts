import { possessive } from './lexicon';
import type { Term } from './types';

// One rendered word of the phrase. `aliasText` (when present) is the modern
// equivalent in the SAME case, so the UI can toggle the word in place.
export interface PhraseToken {
  text: string;
  aliasText?: string;
  archaic?: boolean;
  possessor?: boolean; // the "mój/moja" or name word - not a swappable term
}

export interface PhraseResult {
  text: string; // the full Polish phrase
  terms: Term[]; // reading order (target → anchor), for the UI breakdown
  tokens: PhraseToken[]; // the phrase as individually renderable words
  usesArchaic: boolean;
}

// Who the chain is anchored on (the deepest possessor).
//  - 'ego':  the speaker → first-person possessive "mój/moja" (only valid from "ja")
//  - 'name': anyone else → an already-genitive possessor (their kinship role, e.g.
//            "matki", "wujka", or an optional user-typed name), e.g. "… córka matki"
export type Anchor = { kind: 'ego' } | { kind: 'name'; possessor: string };

// Assemble the nested Polish phrase from the naming terms.
//
// `terms` arrive in walk order (anchor → target). The phrase is read the other way -
// target first - with each term governing the next in the genitive. The HEAD (target)
// stays nominative; every nested term takes its genitive form; the DEEPEST term (nearest
// the anchor) additionally gets the possessor.
export function buildPhrase(terms: Term[], anchor: Anchor): PhraseResult {
  if (terms.length === 0) {
    return { text: 'ja', terms: [], tokens: [{ text: 'ja' }], usesArchaic: false };
  }

  const reading = [...terms].reverse(); // target → anchor
  const usesArchaic = reading.some((t) => t.archaic);
  const last = reading.length - 1;
  const tokens: PhraseToken[] = [];

  reading.forEach((term, i) => {
    const c = i === 0 ? 'nom' : 'gen';
    const wordToken: PhraseToken = {
      text: term.forms[c],
      aliasText: term.alias?.[c],
      archaic: term.archaic,
    };

    if (i === last) {
      // deepest term - attach the possessor (before it for "mój", after for a name)
      const deepCase = reading.length === 1 ? 'nom' : 'gen';
      const deepToken: PhraseToken = {
        text: term.forms[deepCase],
        aliasText: term.alias?.[deepCase],
        archaic: term.archaic,
      };
      if (anchor.kind === 'ego') {
        tokens.push({ text: possessive(term.gender, deepCase), possessor: true });
        tokens.push(deepToken);
      } else {
        tokens.push(deepToken);
        tokens.push({ text: anchor.possessor, possessor: true });
      }
    } else {
      tokens.push(wordToken);
    }
  });

  return { text: tokens.map((t) => t.text).join(' '), terms: reading, tokens, usesArchaic };
}
