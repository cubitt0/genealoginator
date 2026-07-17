import { ComplexitySlider } from './ComplexitySlider';

interface Props {
  aId: string | null;
  bId: string | null;
  nameOf: (id: string) => string;
  level: number;
  onLevel: (level: number) => void;
  onSwap: () => void;
  onReroute: () => void;
  canReroute: boolean;
  editMode: boolean;
}

export function ControlBar({
  aId,
  bId,
  nameOf,
  level,
  onLevel,
  onSwap,
  onReroute,
  canReroute,
  editMode,
}: Props) {
  return (
    <section className="card controlbar">
      {editMode ? (
        <p className="mode__hint">
          Wpisz imiona wprost na kafelkach (opcjonalnie). Zapisują się tylko w Twojej przeglądarce.
          Kliknij <strong>Gotowe</strong> w rogu drzewa, aby wybierać osoby.
        </p>
      ) : (
        <div className="pair">
          <span className="pair__side">
            <span className="pill pill--a" title="Od kogo - punkt odniesienia">Od</span>
            <span className="pair__name">{aId ? nameOf(aId) : '?'}</span>
          </span>
          <button
            type="button"
            className="icon-btn pair__swap"
            onClick={onSwap}
            disabled={!aId || !bId}
            title="Zamień „Od” i „Do” miejscami"
            aria-label="Zamień Od i Do"
          >
            🔄
          </button>
          <span className="pair__side">
            <span className="pill pill--b" title="Do kogo - osoba, którą opisujemy">Do</span>
            <span className="pair__name">{bId ? nameOf(bId) : '?'}</span>
          </span>
        </div>
      )}

      <ComplexitySlider level={level} onChange={onLevel} />

      <button
        type="button"
        className="btn-primary"
        onClick={onReroute}
        disabled={!canReroute}
        title="Pokaż inną możliwą drogę przez drzewo (tej samej złożoności)"
      >
        🔀 Inna trasa
      </button>
    </section>
  );
}
