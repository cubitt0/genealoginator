import type { AtomicRel, Forms, Gender, GramCase, Term } from './types';

// Modern equivalents (inflected) that archaic terms can toggle to in the UI.
const A: Record<string, Forms> = {
  wujek: { nom: 'wujek', gen: 'wujka' },
  tesc: { nom: 'teść', gen: 'teścia' },
  tesciowa: { nom: 'teściowa', gen: 'teściowej' },
  szwagier: { nom: 'szwagier', gen: 'szwagra' },
  szwagierka: { nom: 'szwagierka', gen: 'szwagierki' },
  bratowa: { nom: 'bratowa', gen: 'bratowej' },
  kuzyn: { nom: 'kuzyn', gen: 'kuzyna' },
  kuzynka: { nom: 'kuzynka', gen: 'kuzynki' },
};

// ---------------------------------------------------------------------------
// Atomic terms - the four primitive relations, in both grammatical genders.
// Each stores its own nominative + genitive form (Polish declension is too
// irregular to derive: mąż→męża, ojciec→ojca, córka→córki …).
// ---------------------------------------------------------------------------
const ATOMIC: Record<AtomicRel, Record<Gender, Term>> = {
  PARENT: {
    M: { key: 'ojciec', gender: 'M', forms: { nom: 'ojciec', gen: 'ojca' } },
    F: { key: 'matka', gender: 'F', forms: { nom: 'matka', gen: 'matki' } },
  },
  CHILD: {
    M: { key: 'syn', gender: 'M', forms: { nom: 'syn', gen: 'syna' } },
    F: { key: 'corka', gender: 'F', forms: { nom: 'córka', gen: 'córki' } },
  },
  SPOUSE: {
    M: { key: 'maz', gender: 'M', forms: { nom: 'mąż', gen: 'męża' } },
    F: { key: 'zona', gender: 'F', forms: { nom: 'żona', gen: 'żony' } },
  },
  SIBLING: {
    M: { key: 'brat', gender: 'M', forms: { nom: 'brat', gen: 'brata' } },
    F: { key: 'siostra', gender: 'F', forms: { nom: 'siostra', gen: 'siostry' } },
  },
  HALFSIBLING: {
    M: {
      key: 'przyrodniBrat',
      gender: 'M',
      forms: { nom: 'przyrodni brat', gen: 'przyrodniego brata' },
      gloss: 'brat z jednym wspólnym rodzicem',
    },
    F: {
      key: 'przyrodniaSiostra',
      gender: 'F',
      forms: { nom: 'przyrodnia siostra', gen: 'przyrodniej siostry' },
      gloss: 'siostra z jednym wspólnym rodzicem',
    },
  },
};

export function atomicTerm(rel: AtomicRel, gender: Gender): Term {
  return ATOMIC[rel][gender];
}

// ---------------------------------------------------------------------------
// Possessive "mój" - agrees with its noun in gender AND case.
// The chain only ever attaches it to the deepest term (the one closest to "ja").
// ---------------------------------------------------------------------------
export function possessive(gender: Gender, c: GramCase): string {
  if (gender === 'M') return c === 'nom' ? 'mój' : 'mojego';
  return c === 'nom' ? 'moja' : 'mojej';
}

// ---------------------------------------------------------------------------
// Idiomatic single-word (or compound) terms. Where an archaic/obsolete term
// exists we prefer it (archaic: true) and note the modern equivalent.
// These are the collapse targets used by collapse.ts.
// ---------------------------------------------------------------------------
function t(
  key: string,
  gender: Gender,
  nom: string,
  gen: string,
  extra: Partial<Term> = {},
): Term {
  return { key, gender, forms: { nom, gen }, ...extra };
}

export const IDIOMS: Record<string, Term> = {
  // grandparents / great-grandparents
  dziadek: t('dziadek', 'M', 'dziadek', 'dziadka', { gloss: 'ojciec rodzica' }),
  babcia: t('babcia', 'F', 'babcia', 'babci', { gloss: 'matka rodzica' }),
  pradziadek: t('pradziadek', 'M', 'pradziadek', 'pradziadka', { gloss: 'ojciec dziadka' }),
  prababcia: t('prababcia', 'F', 'prababcia', 'prababci', { gloss: 'matka babci' }),

  // grandchildren
  wnuk: t('wnuk', 'M', 'wnuk', 'wnuka', { gloss: 'syn dziecka' }),
  wnuczka: t('wnuczka', 'F', 'wnuczka', 'wnuczki', { gloss: 'córka dziecka' }),

  // uncles / aunts - the Slavic maternal/paternal split. stryjek (father's brother)
  // is still in everyday use, so it is NOT marked archaic and has no modern swap.
  stryj: t('stryj', 'M', 'stryjek', 'stryjka', { gloss: 'brat ojca' }),
  wujek: t('wujek', 'M', 'wujek', 'wujka', { gloss: 'brat matki' }),
  ciotka: t('ciotka', 'F', 'ciotka', 'ciotki', { gloss: 'siostra rodzica' }),
  stryjenka: t('stryjenka', 'F', 'stryjenka', 'stryjenki', {
    archaic: true,
    gloss: 'żona stryja',
  }),
  wujenka: t('wujenka', 'F', 'wujenka', 'wujenki', { gloss: 'żona wujka' }),
  pociot: t('pociot', 'M', 'pociot', 'pociota', {
    archaic: true,
    alias: A.wujek,
    gloss: 'mąż ciotki',
  }),

  // nephews / nieces - split by the sibling's gender
  bratanek: t('bratanek', 'M', 'bratanek', 'bratanka', { gloss: 'syn brata' }),
  bratanica: t('bratanica', 'F', 'bratanica', 'bratanicy', { gloss: 'córka brata' }),
  siostrzeniec: t('siostrzeniec', 'M', 'siostrzeniec', 'siostrzeńca', {
    gloss: 'syn siostry',
  }),
  siostrzenica: t('siostrzenica', 'F', 'siostrzenica', 'siostrzenicy', {
    gloss: 'córka siostry',
  }),

  // cousins - traditional adjectival forms (compound, both words decline)
  bratStryjeczny: t('bratStryjeczny', 'M', 'brat stryjeczny', 'brata stryjecznego', {
    archaic: true,
    alias: A.kuzyn,
    gloss: 'syn brata ojca',
  }),
  siostraStryjeczna: t('siostraStryjeczna', 'F', 'siostra stryjeczna', 'siostry stryjecznej', {
    archaic: true,
    alias: A.kuzynka,
    gloss: 'córka brata ojca',
  }),
  bratWujeczny: t('bratWujeczny', 'M', 'brat wujeczny', 'brata wujecznego', {
    archaic: true,
    alias: A.kuzyn,
    gloss: 'syn brata matki',
  }),
  siostraWujeczna: t('siostraWujeczna', 'F', 'siostra wujeczna', 'siostry wujecznej', {
    archaic: true,
    alias: A.kuzynka,
    gloss: 'córka brata matki',
  }),
  bratCioteczny: t('bratCioteczny', 'M', 'brat cioteczny', 'brata ciotecznego', {
    archaic: true,
    alias: A.kuzyn,
    gloss: 'syn siostry rodzica',
  }),
  siostraCioteczna: t('siostraCioteczna', 'F', 'siostra cioteczna', 'siostry ciotecznej', {
    archaic: true,
    alias: A.kuzynka,
    gloss: 'córka siostry rodzica',
  }),

  // in-laws by blood tie
  tesc: t('tesc', 'M', 'teść', 'teścia', { gloss: 'ojciec małżonka' }),
  tesciowa: t('tesciowa', 'F', 'teściowa', 'teściowej', { gloss: 'matka małżonka' }),
  ziec: t('ziec', 'M', 'zięć', 'zięcia', { gloss: 'mąż córki' }),
  synowa: t('synowa', 'F', 'synowa', 'synowej', { gloss: 'żona syna' }),

  // in-laws, spouse-specific - the archaic showpieces
  swiekier: t('swiekier', 'M', 'świekier', 'świekra', {
    archaic: true,
    alias: A.tesc,
    gloss: 'ojciec męża',
  }),
  swiekra: t('swiekra', 'F', 'świekra', 'świekry', {
    archaic: true,
    alias: A.tesciowa,
    gloss: 'matka męża',
  }),
  dziewierz: t('dziewierz', 'M', 'dziewierz', 'dziewierza', {
    archaic: true,
    alias: A.szwagier,
    gloss: 'brat męża',
  }),
  zelwa: t('zelwa', 'F', 'zełwa', 'zełwy', {
    archaic: true,
    alias: A.szwagierka,
    gloss: 'siostra męża',
  }),
  szurzy: t('szurzy', 'M', 'szurzy', 'szurzego', {
    archaic: true,
    alias: A.szwagier,
    gloss: 'brat żony',
  }),
  swiesc: t('swiesc', 'F', 'świeść', 'świeści', {
    archaic: true,
    alias: A.szwagierka,
    gloss: 'siostra żony',
  }),
  bratowa: t('bratowa', 'F', 'bratowa', 'bratowej', { gloss: 'żona brata' }),
  swak: t('swak', 'M', 'swak', 'swaka', {
    archaic: true,
    alias: A.szwagier,
    gloss: 'mąż siostry',
  }),
  jatrew: t('jatrew', 'F', 'jątrew', 'jątrwi', {
    archaic: true,
    alias: A.bratowa,
    gloss: 'żona brata męża',
  }),
  paszenog: t('paszenog', 'M', 'paszenog', 'paszenoga', {
    archaic: true,
    alias: A.szwagier,
    gloss: 'mąż siostry żony',
  }),

  // step relations
  ojczym: t('ojczym', 'M', 'ojczym', 'ojczyma', { gloss: 'mąż matki' }),
  macocha: t('macocha', 'F', 'macocha', 'macochy', { gloss: 'żona ojca' }),
};
