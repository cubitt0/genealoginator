import type { Person } from './types';

// The one "ego" everyone is measured against on the tree.
export const EGO_ID = 'ja';

// A single curated family - STRUCTURE ONLY. Ids describe each person's role in the
// tree, never a personal name; no names are stored anywhere in code. Built to exercise
// the whole lexicon: paternal/maternal uncles & aunts, their spouses, cousins,
// nephews/nieces on both a brother's and a sister's side, a full in-law set on the
// spouse's side, grandchildren, and a blended branch (step-parents + half-siblings).
//
// `gen` = generation row (0 oldest). `order` = horizontal slot in that row.
export const PEOPLE: Person[] = [
  // gen 0 - grandparents
  { id: 'gf_pat', gender: 'M', gen: 0, order: 2.5 },
  { id: 'gm_pat', gender: 'F', gen: 0, order: 3.5 },
  { id: 'gf_mat', gender: 'M', gen: 0, order: 9.5 },
  { id: 'gm_mat', gender: 'F', gen: 0, order: 10.5 },

  // gen 1 - parents (blended), their siblings (+ spouses), and the spouse's parents
  { id: 'aunt_pat_spouse', gender: 'M', gen: 1, order: 0 },
  { id: 'aunt_pat', gender: 'F', gen: 1, order: 1 },
  { id: 'uncle_pat', gender: 'M', gen: 1, order: 2.5 },
  { id: 'uncle_pat_spouse', gender: 'F', gen: 1, order: 3.5 },
  { id: 'macocha', gender: 'F', gen: 1, order: 5.5 },
  { id: 'father', gender: 'M', gen: 1, order: 6.5 },
  { id: 'mother', gender: 'F', gen: 1, order: 7.5 },
  { id: 'ojczym', gender: 'M', gen: 1, order: 8.5 },
  { id: 'uncle_mat', gender: 'M', gen: 1, order: 12.5 },
  { id: 'uncle_mat_spouse', gender: 'F', gen: 1, order: 13.5 },
  { id: 'wife_father', gender: 'M', gen: 1, order: 15 },
  { id: 'wife_mother', gender: 'F', gen: 1, order: 16 },

  // gen 2 - ego's generation. Each uncle/aunt has a son AND a daughter, so all six
  // cousin terms (brat/siostra stryjeczny · wujeczny · cioteczny) are reachable.
  { id: 'cousin_aunt', gender: 'F', gen: 2, order: 0 },
  { id: 'cousin_aunt_bro', gender: 'M', gen: 2, order: 1 },
  { id: 'cousin_pat', gender: 'M', gen: 2, order: 2.5 },
  { id: 'cousin_pat_sis', gender: 'F', gen: 2, order: 3.5 },
  { id: 'half_sis', gender: 'F', gen: 2, order: 5 },
  { id: 'brother', gender: 'M', gen: 2, order: 6 },
  { id: 'brother_spouse', gender: 'F', gen: 2, order: 7 },
  { id: 'ja', gender: 'M', gen: 2, order: 8 },
  { id: 'wife', gender: 'F', gen: 2, order: 9 },
  { id: 'half_bro', gender: 'M', gen: 2, order: 10 },
  { id: 'sister', gender: 'F', gen: 2, order: 11 },
  { id: 'sister_spouse', gender: 'M', gen: 2, order: 12 },
  { id: 'cousin_mat', gender: 'M', gen: 2, order: 13 },
  { id: 'cousin_mat_sis', gender: 'F', gen: 2, order: 14 },
  { id: 'wife_brother', gender: 'M', gen: 2, order: 15 },
  { id: 'wife_sister', gender: 'F', gen: 2, order: 16 },
  { id: 'wife_sister_spouse', gender: 'M', gen: 2, order: 17 },

  // gen 3 - ego's children, plus nephews/nieces
  { id: 'nephew_bro', gender: 'M', gen: 3, order: 6 },
  { id: 'niece_bro', gender: 'F', gen: 3, order: 7 },
  { id: 'son', gender: 'M', gen: 3, order: 8 },
  { id: 'son_spouse', gender: 'F', gen: 3, order: 9 },
  { id: 'daughter', gender: 'F', gen: 3, order: 10 },
  { id: 'daughter_spouse', gender: 'M', gen: 3, order: 11 },
  { id: 'nephew_sis', gender: 'M', gen: 3, order: 12 },
  { id: 'niece_sis', gender: 'F', gen: 3, order: 13 },

  // gen 4 - ego's grandchildren
  { id: 'grandson', gender: 'M', gen: 4, order: 8 },
  { id: 'granddaughter', gender: 'F', gen: 4, order: 9 },
];

// [parentId, childId]
export const PARENT_CHILD: [string, string][] = [
  ['gf_pat', 'aunt_pat'], ['gm_pat', 'aunt_pat'],
  ['gf_pat', 'uncle_pat'], ['gm_pat', 'uncle_pat'],
  ['gf_pat', 'father'], ['gm_pat', 'father'],
  ['gf_mat', 'mother'], ['gm_mat', 'mother'],
  ['gf_mat', 'uncle_mat'], ['gm_mat', 'uncle_mat'],
  ['aunt_pat', 'cousin_aunt'], ['aunt_pat_spouse', 'cousin_aunt'],
  ['aunt_pat', 'cousin_aunt_bro'], ['aunt_pat_spouse', 'cousin_aunt_bro'],
  ['uncle_pat', 'cousin_pat'], ['uncle_pat_spouse', 'cousin_pat'],
  ['uncle_pat', 'cousin_pat_sis'], ['uncle_pat_spouse', 'cousin_pat_sis'],
  ['father', 'brother'], ['mother', 'brother'],
  ['father', 'sister'], ['mother', 'sister'],
  ['father', 'ja'], ['mother', 'ja'],
  ['father', 'half_sis'], ['macocha', 'half_sis'], // half-sibling via step-mother
  ['mother', 'half_bro'], ['ojczym', 'half_bro'], // half-sibling via step-father
  ['uncle_mat', 'cousin_mat'], ['uncle_mat_spouse', 'cousin_mat'],
  ['uncle_mat', 'cousin_mat_sis'], ['uncle_mat_spouse', 'cousin_mat_sis'],
  ['wife_father', 'wife'], ['wife_mother', 'wife'],
  ['wife_father', 'wife_brother'], ['wife_mother', 'wife_brother'],
  ['wife_father', 'wife_sister'], ['wife_mother', 'wife_sister'],
  ['ja', 'son'], ['wife', 'son'],
  ['ja', 'daughter'], ['wife', 'daughter'],
  ['brother', 'nephew_bro'], ['brother_spouse', 'nephew_bro'],
  ['brother', 'niece_bro'], ['brother_spouse', 'niece_bro'],
  ['sister', 'nephew_sis'], ['sister_spouse', 'nephew_sis'],
  ['sister', 'niece_sis'], ['sister_spouse', 'niece_sis'],
  ['son', 'grandson'], ['son_spouse', 'grandson'],
  ['son', 'granddaughter'], ['son_spouse', 'granddaughter'],
];

// [aId, bId] - undirected marriages
export const SPOUSES: [string, string][] = [
  ['gf_pat', 'gm_pat'],
  ['gf_mat', 'gm_mat'],
  ['aunt_pat', 'aunt_pat_spouse'],
  ['uncle_pat', 'uncle_pat_spouse'],
  ['father', 'mother'],
  ['father', 'macocha'], // father remarried
  ['mother', 'ojczym'], // mother remarried
  ['uncle_mat', 'uncle_mat_spouse'],
  ['wife_father', 'wife_mother'],
  ['ja', 'wife'],
  ['brother', 'brother_spouse'],
  ['sister', 'sister_spouse'],
  ['son', 'son_spouse'],
  ['daughter', 'daughter_spouse'],
  ['wife_sister', 'wife_sister_spouse'],
];
