import { describe, expect, it } from 'vitest';
import { stepsToTerms } from './collapse';
import { reachableFrom } from './graph';
import { buildPhrase } from './phrase';
import { describeRelation, egoLabelMap, graph, relationToEgo, STRATEGIES } from './strategy';
import type { AtomicStep } from './types';

describe('case variants - the same word changes form by position', () => {
  it('surfaces "wujek" as head but "wujka" when nested', () => {
    // ja → matka → (her brother) → (his sister) → (her husband) → (his daughter)
    const steps: AtomicStep[] = [
      { rel: 'PARENT', toGender: 'F', toId: 'a' },
      { rel: 'SIBLING', toGender: 'M', toId: 'b' },
      { rel: 'SIBLING', toGender: 'F', toId: 'c' },
      { rel: 'SPOUSE', toGender: 'M', toId: 'd' },
      { rel: 'CHILD', toGender: 'F', toId: 'e' },
    ];
    const terms = stepsToTerms(steps, 'anchor'); // collapses [PARENT F, SIBLING M] → wujek
    expect(buildPhrase(terms, { kind: 'ego' }).text).toBe('córka męża siostry mojego wujka');
  });

  it('same idiom is nominative at the head, genitive when nested', () => {
    expect(describeRelation(graph, 'ja', 'uncle_mat', 0)!.text).toBe('mój wujek'); // head
    expect(buildPhrase(
      stepsToTerms(
        [
          { rel: 'PARENT', toGender: 'F', toId: 'a' },
          { rel: 'SIBLING', toGender: 'M', toId: 'b' },
        ],
        'none',
      ),
      { kind: 'ego' },
    ).text).toBe('brat mojej matki');
  });

  it('agrees the possessive in gender and case', () => {
    expect(describeRelation(graph, 'ja', 'sister', 0)!.text).toBe('moja siostra'); // F
    expect(describeRelation(graph, 'ja', 'brother', 0)!.text).toBe('mój brat'); // M
  });
});

describe('collapse rules → known idioms (archaic preferred)', () => {
  const cases: [string, string][] = [
    ['sister', 'siostra'],
    ['brother', 'brat'],
    ['father', 'ojciec'],
    ['mother', 'matka'],
    ['gf_pat', 'dziadek'],
    ['gm_pat', 'babcia'],
    ['uncle_pat', 'stryjek'], // father's brother - still everyday
    ['uncle_mat', 'wujek'], // mother's brother
    ['aunt_pat', 'ciotka'],
    ['uncle_pat_spouse', 'stryjenka'],
    ['aunt_pat_spouse', 'pociot'], // aunt's husband - archaic
    // all six cousin terms are reachable - each uncle/aunt has a son and a daughter
    ['cousin_pat', 'brat stryjeczny'],
    ['cousin_pat_sis', 'siostra stryjeczna'],
    ['cousin_mat', 'brat wujeczny'],
    ['cousin_mat_sis', 'siostra wujeczna'],
    ['cousin_aunt', 'siostra cioteczna'],
    ['cousin_aunt_bro', 'brat cioteczny'],
    ['wife', 'żona'],
    ['wife_father', 'teść'],
    ['wife_brother', 'szurzy'], // wife's brother - archaic
    ['wife_sister', 'świeść'], // wife's sister - archaic
    ['wife_sister_spouse', 'paszenog'], // wife's sister's husband - archaic
    ['daughter_spouse', 'zięć'],
    ['son', 'syn'],
    // added branches
    ['son_spouse', 'synowa'],
    ['grandson', 'wnuk'],
    ['granddaughter', 'wnuczka'],
    ['brother_spouse', 'bratowa'],
    ['nephew_bro', 'bratanek'],
    ['niece_bro', 'bratanica'],
    ['sister_spouse', 'swak'], // sister's husband - archaic
    ['nephew_sis', 'siostrzeniec'],
    ['niece_sis', 'siostrzenica'],
    ['macocha', 'macocha'],
    ['ojczym', 'ojczym'],
    ['half_sis', 'przyrodnia siostra'],
    ['half_bro', 'przyrodni brat'],
  ];
  it.each(cases)('%s is "%s" to ja', (id, label) => {
    expect(relationToEgo(graph, id).text).toBe(label);
  });
});

describe('half-siblings are distinct from full siblings', () => {
  it('reads a shared-both-parents sibling as brat, a shared-one-parent as przyrodni', () => {
    expect(relationToEgo(graph, 'brother').text).toBe('brat');
    expect(relationToEgo(graph, 'half_bro').text).toBe('przyrodni brat');
    expect(relationToEgo(graph, 'half_sis').text).toBe('przyrodnia siostra');
    expect(describeRelation(graph, 'ja', 'half_bro', 0)!.text).toBe('mój przyrodni brat');
  });
});

describe('possessive only when speaking as "ja"', () => {
  it('uses "mój/moja" when the start person is ja', () => {
    expect(describeRelation(graph, 'ja', 'sister', 0)!.text).toBe('moja siostra');
    expect(describeRelation(graph, 'ja', 'uncle_mat', 0)!.text).toBe('mój wujek');
  });

  it('anchors on the kinship role in genitive (never "mój") when the start is not ja', () => {
    // the sister is the mother's daughter
    const r = describeRelation(graph, 'mother', 'sister', 0)!;
    expect(r.text).toBe('córka matki');
    expect(r.text).not.toMatch(/\bmoj/i);
  });

  it('anchors a nested chain on the role too', () => {
    const r = describeRelation(graph, 'mother', 'cousin_pat', 0)!;
    expect(r.text.endsWith('matki')).toBe(true);
    expect(r.text).not.toMatch(/\bmoj/i);
  });
});

describe('complexity slider changes the strategy', () => {
  it('is monotonic-ish: the extreme level walks a longer path than the concise one', () => {
    const concise = describeRelation(graph, 'ja', 'wife_sister_spouse', 0)!;
    const extreme = describeRelation(graph, 'ja', 'wife_sister_spouse', STRATEGIES.length - 1)!;
    expect(concise.text).toBe('mój paszenog');
    expect(extreme.hops).toBeGreaterThan(concise.hops);
    expect(extreme.text.split(' ').length).toBeGreaterThan(concise.text.split(' ').length);
  });

  it('flags when an archaic term is used', () => {
    expect(describeRelation(graph, 'ja', 'wife_brother', 0)!.usesArchaic).toBe(true); // szurzy
    expect(describeRelation(graph, 'ja', 'uncle_pat', 0)!.usesArchaic).toBe(false); // stryjek - everyday
    expect(describeRelation(graph, 'ja', 'sister', 0)!.usesArchaic).toBe(false); // siostra
  });

  it('exposes a modern alias on archaic phrase words (for click-to-swap)', () => {
    const r = describeRelation(graph, 'ja', 'wife_brother', 0)!; // szurzy
    const token = r.tokens.find((t) => t.aliasText);
    expect(token?.text).toBe('szurzy');
    expect(token?.aliasText).toBe('szwagier');
  });

  it('offers different routes across variants, but is stable per variant', () => {
    const routes = new Set<string>();
    for (let v = 0; v < 8; v++) {
      const r = describeRelation(graph, 'ja', 'sister', 6, undefined, v); // scenic level
      if (r) routes.add(r.path.join('>'));
    }
    expect(routes.size).toBeGreaterThan(1); // the "different route" button has options

    const a = describeRelation(graph, 'ja', 'sister', 6, undefined, 3)!.path.join('>');
    const b = describeRelation(graph, 'ja', 'sister', 6, undefined, 3)!.path.join('>');
    expect(a).toBe(b); // same variant → same route
  });
});

describe('duplicate labels carry a side for the tooltip (visible label unchanged)', () => {
  it('keeps the grandparent label but records which side it is', () => {
    expect(egoLabelMap.get('gf_pat')!.text).toBe('dziadek');
    expect(egoLabelMap.get('gf_pat')!.side).toBe('od ojca');
    expect(egoLabelMap.get('gf_mat')!.text).toBe('dziadek');
    expect(egoLabelMap.get('gf_mat')!.side).toBe('od matki');
    expect(egoLabelMap.get('gm_pat')!.side).toBe('od ojca');
    expect(egoLabelMap.get('gm_mat')!.side).toBe('od matki');
  });

  it('leaves unique labels without a side', () => {
    expect(egoLabelMap.get('uncle_pat')!.text).toBe('stryjek');
    expect(egoLabelMap.get('uncle_pat')!.side).toBeUndefined();
    expect(egoLabelMap.get('mother')!.side).toBeUndefined();
  });
});

describe('graph integrity', () => {
  it('connects every person to ja', () => {
    for (const id of graph.persons.keys()) {
      expect(describeRelation(graph, 'ja', id, 0)).not.toBeNull();
    }
  });
});

describe('disabling a person cuts off everyone reachable only through them', () => {
  it('drops the wife-side relatives when the wife is disabled', () => {
    const active = reachableFrom(graph, 'ja', new Set(['wife']));
    expect(active.has('wife_father')).toBe(false);
    expect(active.has('wife_sister_spouse')).toBe(false);
    expect(active.has('wife_brother')).toBe(false);
    // ja's own children stay reachable directly through ja
    expect(active.has('son')).toBe(true);
    expect(active.has('sister')).toBe(true);
  });

  it('returns no relation to a cut-off person', () => {
    expect(describeRelation(graph, 'ja', 'wife_sister_spouse', 0, new Set(['wife']))).toBeNull();
  });
});
