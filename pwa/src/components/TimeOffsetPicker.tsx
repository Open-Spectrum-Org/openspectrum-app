import { useRef, useState } from 'react';

export interface TimeSelection {
  occurredAt: string | null; // null = use nowISO() at tap time
  precision: 'exact' | 'date_only';
}

interface TimeOffsetPickerProps {
  value: TimeSelection;
  onChange: (selection: TimeSelection) => void;
}

type ChipDef = {
  label: string;
  getSelection: () => TimeSelection;
};

const CHIPS: ChipDef[] = [
  {
    label: 'Now',
    getSelection: () => ({ occurredAt: null, precision: 'exact' }),
  },
  {
    label: '30 min ago',
    getSelection: () => ({
      occurredAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      precision: 'exact',
    }),
  },
  {
    label: '1 hr ago',
    getSelection: () => ({
      occurredAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      precision: 'exact',
    }),
  },
  {
    label: '2 hrs ago',
    getSelection: () => ({
      occurredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      precision: 'exact',
    }),
  },
  {
    label: 'Earlier today',
    getSelection: () => ({
      occurredAt: new Date().toISOString().split('T')[0]!,
      precision: 'date_only',
    }),
  },
  {
    label: 'Yesterday',
    getSelection: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return { occurredAt: d.toISOString().split('T')[0]!, precision: 'date_only' };
    },
  },
];

export function TimeOffsetPicker({ onChange }: TimeOffsetPickerProps) {
  const [activeLabel, setActiveLabel] = useState<string>('Now');
  const [showCustom, setShowCustom] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function selectChip(chip: ChipDef) {
    setActiveLabel(chip.label);
    setShowCustom(false);
    onChange(chip.getSelection());
  }

  function selectCustom() {
    setActiveLabel('Custom…');
    setShowCustom(true);
  }

  return (
    <div className="px-3 pt-1 pb-2">
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {CHIPS.map((chip) => (
          <button
            key={chip.label}
            onClick={() => selectChip(chip)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeLabel === chip.label
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-text-secondary border-border'
            }`}
          >
            {chip.label}
          </button>
        ))}
        <button
          onClick={selectCustom}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            activeLabel === 'Custom…'
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-text-secondary border-border'
          }`}
        >
          Custom…
        </button>
      </div>
      {showCustom && (
        <div className="mt-2">
          <input
            ref={inputRef}
            type="datetime-local"
            className="w-full border border-border rounded-[8px] px-3 py-2 text-sm text-text-primary bg-surface"
            onChange={(e) => {
              if (e.target.value) {
                onChange({
                  occurredAt: new Date(e.target.value).toISOString(),
                  precision: 'exact',
                });
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
