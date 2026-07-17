import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { EGO_ID, PARENT_CHILD, PEOPLE, SPOUSES } from '../engine/family';
import { egoLabelMap } from '../engine/strategy';
import { cap } from './format';

// ---- layout constants ----
const MARGIN_X = 40;
const MARGIN_Y = 32;
const COL = 132; // horizontal distance per `order` unit
const ROW = 168; // vertical distance per generation
const NODE_W = 116;
const NODE_H = 62;
const PAD_X = 16;

const LABELS = egoLabelMap;
const BY_ID = new Map(PEOPLE.map((p) => [p.id, p]));

const left = (order: number) => MARGIN_X + order * COL;
const top = (gen: number) => MARGIN_Y + gen * ROW;
const cx = (order: number) => left(order) + NODE_W / 2;
const cy = (gen: number) => top(gen) + NODE_H / 2;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

interface Props {
  aId: string | null;
  bId: string | null;
  pathIds: string[];
  activeIds: Set<string>;
  disabled: Set<string>;
  editMode: boolean;
  names: Record<string, string>;
  nameOf: (id: string) => string;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onName: (id: string, value: string) => void;
  onToggleEditMode: () => void;
  onClearSelection: () => void;
  canClearSelection: boolean;
  onRestoreAll: () => void;
  canRestoreAll: boolean;
  onClearNames: () => void;
  hasNames: boolean;
}

export function Tree({
  aId,
  bId,
  pathIds,
  activeIds,
  disabled,
  editMode,
  names,
  nameOf,
  onSelect,
  onToggle,
  onName,
  onToggleEditMode,
  onClearSelection,
  canClearSelection,
  onRestoreAll,
  canRestoreAll,
  onClearNames,
  hasNames,
}: Props) {
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Ctrl + wheel zooms the tree (instead of the page); plain wheel scrolls normally.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoom((z) => clamp(+(z - Math.sign(e.deltaY) * 0.2).toFixed(2), 1, 3));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const maxGen = Math.max(...PEOPLE.map((p) => p.gen));
  const height = top(maxGen) + NODE_H + MARGIN_Y;

  const jaCx = cx(BY_ID.get(EGO_ID)!.order);
  const minLeft = Math.min(...PEOPLE.map((p) => left(p.order)));
  const maxRight = Math.max(...PEOPLE.map((p) => left(p.order) + NODE_W));
  const half = Math.max(jaCx - (minLeft - PAD_X), maxRight + PAD_X - jaCx);
  const viewBox = `${jaCx - half} 0 ${half * 2} ${height}`;

  const pathSet = useMemo(() => new Set(pathIds), [pathIds]);
  const routeNodes = pathIds
    .map((id) => BY_ID.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const routeSegs = routeNodes.slice(1).map((b, i) => {
    const a = routeNodes[i];
    return { x1: cx(a.order), y1: cy(a.gen), x2: cx(b.order), y2: cy(b.gen) };
  });

  const isActive = (id: string) => activeIds.has(id);

  return (
    <div className="tree-viewport" ref={viewportRef}>
      {/* top-right actions */}
      <div className="tree-actions">
        <button type="button" className={editMode ? 'btn-mode btn-mode--on' : 'btn-mode'} onClick={onToggleEditMode}>
          {editMode ? '✓ Gotowe' : '✎ Nadaj imiona'}
        </button>
        {editMode
          ? hasNames && (
              <button type="button" className="icon-btn" title="Wyczyść wszystkie imiona" onClick={onClearNames}>
                🗑️
              </button>
            )
          : (
              <>
                {canClearSelection && (
                  <button type="button" className="icon-btn" title="Wyczyść wybór A i B" onClick={onClearSelection}>
                    🧹
                  </button>
                )}
                {canRestoreAll && (
                  <button
                    type="button"
                    className="icon-btn"
                    title="Przywróć wszystkich (włącz wyłączone osoby)"
                    onClick={onRestoreAll}
                  >
                    ♻️
                  </button>
                )}
              </>
            )}
      </div>

      {/* bottom-left legend */}
      <div className="tree-legend">
        <span className="legend__item">
          <i className="dot dot--M" /> mężczyzna
        </span>
        <span className="legend__item">
          <i className="dot dot--F" /> kobieta
        </span>
        <span className="legend__item">✦ dawna nazwa</span>
      </div>

      {/* bottom-right zoom */}
      <div className="zoom">
        <button type="button" onClick={() => setZoom((z) => clamp(+(z + 0.25).toFixed(2), 1, 3))} aria-label="Powiększ">
          +
        </button>
        <button type="button" onClick={() => setZoom((z) => clamp(+(z - 0.25).toFixed(2), 1, 3))} aria-label="Pomniejsz">
          −
        </button>
        <button type="button" onClick={() => setZoom(1)} aria-label="Dopasuj" title="Dopasuj do ekranu (Ctrl + scroll powiększa)">
          ⤢
        </button>
      </div>

      <div className="tree-scroll">
        <svg
          className="tree"
          style={{ width: `${zoom * 100}%` }}
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          role="group"
          aria-label="Drzewo genealogiczne"
        >
          <defs>
            <marker
              id="route-arrow"
              viewBox="0 0 10 10"
              refX="8.5"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--route)" />
            </marker>
          </defs>

          {/* marriage links (extended slightly into both boxes so they clearly connect) */}
          {SPOUSES.map(([a, b]) => {
            const pa = BY_ID.get(a)!;
            const pb = BY_ID.get(b)!;
            const l = pa.order < pb.order ? pa : pb;
            const r = pa.order < pb.order ? pb : pa;
            const dim = !isActive(a) || !isActive(b);
            return (
              <line
                key={`m-${a}-${b}`}
                className={`edge edge--spouse ${dim ? 'edge--dim' : ''}`}
                x1={left(l.order) + NODE_W - 3}
                y1={cy(l.gen)}
                x2={left(r.order) + 3}
                y2={cy(r.gen)}
              />
            );
          })}

          {childElbows(isActive)}

          {/* selected route: arrowed steps, drawn under the tiles */}
          {routeSegs.length > 0 && (
            <g className="route">
              {routeSegs.map((s, i) => {
                const dx = s.x2 - s.x1;
                const dy = s.y2 - s.y1;
                const len = Math.hypot(dx, dy) || 1;
                const pull = Math.min(38, len * 0.42);
                return (
                  <line
                    key={`l${i}`}
                    className="route__line"
                    x1={s.x1}
                    y1={s.y1}
                    x2={s.x2 - (dx / len) * pull}
                    y2={s.y2 - (dy / len) * pull}
                    markerEnd="url(#route-arrow)"
                  />
                );
              })}
            </g>
          )}

          {PEOPLE.map((p) => {
            const label = LABELS.get(p.id)!;
            const role = label.text;
            const gloss = label.term?.gloss;
            const archaic = label.term?.archaic;
            const active = isActive(p.id);
            const userName = names[p.id]?.trim() ?? '';
            const hasName = userName.length > 0;
            const words = role.split(' ');
            const roleFull = `${cap(role)}${label.side ? ` (${label.side})` : ''}`;
            const title = hasName
              ? `${userName} - ${roleFull}${gloss ? ` (${gloss})` : ''}`
              : `${roleFull}${gloss ? ` - ${gloss}` : ''}`;
            const selBadge =
              p.id === aId
                ? { text: 'Od', cls: 'node__badge--a' }
                : p.id === bId
                  ? { text: 'Do', cls: 'node__badge--b' }
                  : null;
            const onPath = pathSet.has(p.id) && !selBadge;
            const isDisabled = disabled.has(p.id);
            const classes = [
              'node',
              `node--${p.gender}`,
              p.id === EGO_ID ? 'node--ego' : '',
              selBadge ? 'node--sel' : '',
              onPath ? 'node--path' : '',
              active ? '' : 'node--inactive',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <g key={p.id} className={classes} transform={`translate(${left(p.order)}, ${top(p.gen)})`}>
                <title>{title}</title>

                {editMode ? (
                  <>
                    <rect className="node__box" width={NODE_W} height={NODE_H} rx={13} />
                    <foreignObject x={8} y={NODE_H / 2 - 14} width={NODE_W - 16} height={28}>
                      <input
                        className="node__input"
                        value={names[p.id] ?? ''}
                        placeholder={role}
                        aria-label={`Imię dla: ${role}`}
                        onChange={(e) => onName(p.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        }}
                      />
                    </foreignObject>
                  </>
                ) : (
                  <>
                    <g
                      className="node__hit"
                      onClick={() => onSelect(p.id)}
                      role="button"
                      tabIndex={active ? 0 : -1}
                      aria-label={`Wybierz: ${nameOf(p.id)}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelect(p.id);
                        }
                      }}
                    >
                      <rect className="node__box" width={NODE_W} height={NODE_H} rx={13} />
                      {hasName ? (
                        <>
                          <text className="node__name" x={NODE_W / 2} y={29} textAnchor="middle">
                            {userName}
                          </text>
                          <text className="node__rel" x={NODE_W / 2} y={47} textAnchor="middle">
                            {cap(role)}
                            {archaic ? ' ✦' : ''}
                          </text>
                        </>
                      ) : words.length > 1 ? (
                        <>
                          <text className="node__name node__name--solo2" x={NODE_W / 2} y={29} textAnchor="middle">
                            {cap(words[0])}
                          </text>
                          <text className="node__name node__name--solo2" x={NODE_W / 2} y={48} textAnchor="middle">
                            {words.slice(1).join(' ')}
                            {archaic ? ' ✦' : ''}
                          </text>
                        </>
                      ) : (
                        <text className="node__name node__name--solo" x={NODE_W / 2} y={38} textAnchor="middle">
                          {cap(role)}
                          {archaic ? ' ✦' : ''}
                        </text>
                      )}
                    </g>

                    {selBadge && (
                      <g className={`node__badge ${selBadge.cls}`} transform="translate(5, 5)">
                        <rect className="node__badge-bg" width={28} height={19} rx={7} />
                        <text x={14} y={13.5} textAnchor="middle">
                          {selBadge.text}
                        </text>
                      </g>
                    )}

                    {p.id !== EGO_ID && (
                      <g
                        className={`node__toggle ${isDisabled ? 'node__toggle--off' : ''}`}
                        transform={`translate(${NODE_W - 24}, 6)`}
                        role="button"
                        aria-label={isDisabled ? `Włącz: ${nameOf(p.id)}` : `Wyłącz: ${nameOf(p.id)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggle(p.id);
                        }}
                      >
                        <title>{isDisabled ? 'Włącz osobę' : 'Wyłącz osobę'}</title>
                        <circle cx={9} cy={9} r={9} />
                        <text x={9} y={13.5} textAnchor="middle">
                          {isDisabled ? '+' : '−'}
                        </text>
                      </g>
                    )}
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function childElbows(isActive: (id: string) => boolean) {
  const parentsOf = new Map<string, string[]>();
  for (const [parent, child] of PARENT_CHILD) {
    (parentsOf.get(child) ?? parentsOf.set(child, []).get(child)!).push(parent);
  }

  const elbows: ReactElement[] = [];
  for (const [child, parents] of parentsOf) {
    const c = BY_ID.get(child)!;
    const pNodes = parents.map((id) => BY_ID.get(id)!);
    const anchorX = pNodes.reduce((s, p) => s + cx(p.order), 0) / pNodes.length;
    const parentGen = pNodes[0].gen;
    // For a couple, hang the connector from the marriage line (center height) so it
    // visibly joins the two tiles; for a lone parent, from its bottom edge.
    const startY = pNodes.length >= 2 ? cy(parentGen) : top(parentGen) + NODE_H;
    const endY = top(c.gen);
    const busY = top(parentGen) + NODE_H + (endY - (top(parentGen) + NODE_H)) / 2;
    const childX = cx(c.order);
    const dim = !isActive(child) || parents.some((id) => !isActive(id));
    elbows.push(
      <path
        key={`c-${child}`}
        className={`edge edge--parent ${dim ? 'edge--dim' : ''}`}
        d={`M ${anchorX} ${startY} V ${busY} H ${childX} V ${endY}`}
        fill="none"
      />,
    );
  }
  return elbows;
}
