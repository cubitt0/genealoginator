import { Fragment, useEffect, useState } from 'react';
import { atomicTerm } from '../engine/lexicon';
import type { RelationResult } from '../engine/strategy';
import { cap } from './format';

interface Props {
  result: RelationResult | null;
  aId: string | null;
  bId: string | null;
  nameOf: (id: string) => string; // user's name if set, otherwise the kinship role
}

export function ResultPanel({ result, aId, bId, nameOf }: Props) {
  // Which phrase words are currently shown in their modern (non-archaic) form.
  const [swapped, setSwapped] = useState<Set<number>>(() => new Set());
  useEffect(() => setSwapped(new Set()), [result]);
  const toggle = (i: number) =>
    setSwapped((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  if (!aId || !bId) {
    return (
      <section className="panel panel--hint">
        <p>
          Wybierz na drzewie <strong>dwie osoby</strong>. Genealoginator opisze drugą z nich
          względem pierwszej - możliwie najbardziej zawiłą polską nazwą pokrewieństwa.
        </p>
      </section>
    );
  }

  if (aId === bId) {
    return (
      <section className="panel panel--hint">
        <p>To ta sama osoba. Wybierz drugą, inną osobę.</p>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="panel panel--hint">
        <p>Brak pokrewieństwa między tymi osobami.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <header className="panel__persp">
        punkt odniesienia: <strong>{nameOf(aId)}</strong>
      </header>

      <p className="panel__lead">
        <span className="panel__who">{nameOf(bId)}</span> to
      </p>

      <p className="phrase">
        {result.tokens.map((tk, i) => {
          const showModern = swapped.has(i) && tk.aliasText;
          const display = i === 0 ? cap(showModern ? tk.aliasText! : tk.text) : showModern ? tk.aliasText! : tk.text;
          const el = tk.aliasText ? (
            <button
              type="button"
              className={`alias ${showModern ? 'alias--modern' : 'alias--archaic'}`}
              onClick={() => toggle(i)}
              title={showModern ? 'Kliknij: pokaż dawną formę' : 'Kliknij: pokaż współczesną formę'}
            >
              {display}
            </button>
          ) : (
            <span>{display}</span>
          );
          return (
            <Fragment key={i}>
              {i > 0 ? ' ' : ''}
              {el}
            </Fragment>
          );
        })}
      </p>

      <div className="panel__chips">
        <span className="chip">
          {result.hops} {hopWord(result.hops)}
        </span>
        {result.usesArchaic && <span className="chip chip--archaic">dawne nazewnictwo - klik zmienia formę</span>}
      </div>

      <div className="panel__section">
        <h3>Trasa przez drzewo</h3>
        <ol className="route">
          <li className="route__person">{nameOf(aId)}</li>
          {result.steps.map((step, i) => (
            <li key={i} className="route__step">
              <span className="route__rel">{atomicTerm(step.rel, step.toGender).forms.nom}</span>
              <span className="route__person">{nameOf(step.toId)}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="panel__section">
        <h3>Z czego złożona jest nazwa</h3>
        <div className="terms">
          {result.terms.map((term, i) => (
            <span
              key={i}
              className={`term ${term.archaic ? 'term--archaic' : ''}`}
              title={[term.gloss, term.alias ? `dziś: ${term.alias.nom}` : null]
                .filter(Boolean)
                .join(' · ')}
            >
              {cap(term.forms.nom)}
              {term.archaic && <span className="term__star" aria-hidden="true"> ✦</span>}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function hopWord(n: number): string {
  if (n === 1) return 'krok';
  const last = n % 10;
  const teens = n % 100;
  if (last >= 2 && last <= 4 && !(teens >= 12 && teens <= 14)) return 'kroki';
  return 'kroków';
}
