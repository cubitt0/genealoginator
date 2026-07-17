import { useEffect, useMemo, useState } from 'react';
import { EGO_ID, PEOPLE } from './engine/family';
import { reachableFrom } from './engine/graph';
import { describeRelation, egoLabelMap, graph } from './engine/strategy';
import { ControlBar } from './ui/ControlBar';
import { cap } from './ui/format';
import { ResultPanel } from './ui/ResultPanel';
import { Tree } from './ui/Tree';

const NAMES_KEY = 'genealoginator.names.v1';

// Kinship role (relationship to "ja"), computed once - never a personal name.
const KINSHIP = new Map(PEOPLE.map((p) => [p.id, egoLabelMap.get(p.id)?.text ?? p.id]));

function loadNames(): Record<string, string> {
  if (typeof localStorage === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(NAMES_KEY) || '{}');
  } catch {
    return {};
  }
}

export default function App() {
  const [aId, setAId] = useState<string | null>(null);
  const [bId, setBId] = useState<string | null>(null);
  const [level, setLevel] = useState(2);
  const [disabled, setDisabled] = useState<Set<string>>(() => new Set());
  const [names, setNames] = useState<Record<string, string>>(loadNames);
  const [editMode, setEditMode] = useState(false);
  const [variant, setVariant] = useState(0); // which of the possible routes to show

  // A fresh pair starts from the canonical route; "different route" bumps the variant.
  useEffect(() => setVariant(0), [aId, bId]);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(NAMES_KEY, JSON.stringify(names));
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [names]);

  const nameOf = (id: string) => names[id]?.trim() || cap(KINSHIP.get(id) || id);

  const activeIds = useMemo(() => reachableFrom(graph, EGO_ID, disabled), [disabled]);
  const blocked = useMemo(() => {
    const b = new Set<string>();
    for (const id of graph.persons.keys()) if (!activeIds.has(id)) b.add(id);
    return b;
  }, [activeIds]);

  useEffect(() => {
    if (aId && !activeIds.has(aId)) setAId(null);
    if (bId && !activeIds.has(bId)) setBId(null);
  }, [activeIds, aId, bId]);

  const result = useMemo(
    () =>
      aId && bId && aId !== bId ? describeRelation(graph, aId, bId, level, blocked, variant) : null,
    [aId, bId, level, blocked, variant],
  );

  const handleSelect = (id: string) => {
    if (!activeIds.has(id)) return;
    if (aId && bId) {
      setAId(id);
      setBId(null);
      return;
    }
    if (!aId) {
      setAId(id);
      return;
    }
    if (id === aId) {
      setAId(null);
      return;
    }
    setBId(id);
  };

  const handleToggle = (id: string) => {
    if (id === EGO_ID) return;
    setDisabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleName = (id: string, value: string) => setNames((prev) => ({ ...prev, [id]: value }));
  const hasNames = Object.values(names).some((v) => v.trim());

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="title">
          <span className="title__base">Genealog</span>
          <span className="title__inator">inator</span>
          <span className="title__spark" aria-hidden="true">⚡</span>
        </h1>
        <p className="app__tagline">
          Każdą osobę w rodzinie można nazwać na skróty - albo najdłuższą, najbardziej zawiłą drogą
          przez drzewo. Wybierz dwie osoby i zobacz, jak brzmi ta druga. Drzewo pokazuje same
          pokrewieństwa - imiona możesz opcjonalnie dodać sam.
        </p>
      </header>

      <section className="card card--tree">
        <Tree
          aId={aId}
          bId={bId}
          pathIds={result?.path ?? []}
          activeIds={activeIds}
          disabled={disabled}
          editMode={editMode}
          names={names}
          nameOf={nameOf}
          onSelect={handleSelect}
          onToggle={handleToggle}
          onName={handleName}
          onToggleEditMode={() => setEditMode((v) => !v)}
          onClearSelection={() => {
            setAId(null);
            setBId(null);
          }}
          canClearSelection={Boolean(aId || bId)}
          onRestoreAll={() => setDisabled(new Set())}
          canRestoreAll={disabled.size > 0}
          onClearNames={() => setNames({})}
          hasNames={hasNames}
        />
      </section>

      <div className="below">
        <ControlBar
          aId={aId}
          bId={bId}
          nameOf={nameOf}
          level={level}
          onLevel={setLevel}
          onSwap={() => {
            setAId(bId);
            setBId(aId);
          }}
          onReroute={() => setVariant((v) => v + 1)}
          canReroute={Boolean(result)}
          editMode={editMode}
        />
        <ResultPanel result={result} aId={aId} bId={bId} nameOf={nameOf} />
      </div>
    </div>
  );
}
