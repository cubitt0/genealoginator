import { STRATEGIES } from '../engine/strategy';

// Green (simple) -> red (convoluted); used only to tint the current-level label.
const COLORS = ['#2fb56b', '#7ec24a', '#b7c23c', '#e6bd39', '#f0972f', '#ea6c2c', '#df4a41'];
const colorAt = (i: number) => COLORS[i] ?? COLORS[COLORS.length - 1];

interface Props {
  level: number;
  onChange: (level: number) => void;
}

export function ComplexitySlider({ level, onChange }: Props) {
  const strategy = STRATEGIES[level];
  return (
    <div className="fader">
      <div className="fader__head">
        <span className="fader__label">Poziom zawiłości</span>
        <span className="fader__value" style={{ color: colorAt(level) }}>
          {level + 1}. {strategy.name}
        </span>
      </div>

      <input
        className="fader__input"
        type="range"
        min={0}
        max={STRATEGIES.length - 1}
        step={1}
        value={level}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Poziom zawiłości"
      />

      <div className="fader__ends">
        <span>prosto</span>
        <span>zawile</span>
      </div>
    </div>
  );
}
