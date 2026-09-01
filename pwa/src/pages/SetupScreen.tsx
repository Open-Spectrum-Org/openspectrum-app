import { useState } from 'react';
import { useChild } from '../hooks/useChild';

export function SetupScreen() {
  const { addChild, setActiveChild } = useChild();
  const [name, setName] = useState('');
  const [birthYearMonth, setBirthYearMonth] = useState('');
  const [notes, setNotes] = useState('');
  const [showOptional, setShowOptional] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleStart = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const child = await addChild(trimmed, birthYearMonth || undefined, notes || undefined);
      setActiveChild(child);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white px-6 overflow-y-auto">
      <div className="flex-1 flex flex-col justify-center gap-8 py-12">
        <div className="text-center">
          <div className="text-6xl mb-4">🌈</div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Welcome to OpenSpectrum</h1>
          <p className="text-base text-text-secondary">
            Let's start by adding your first patient.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-text-secondary mb-1 block">
              Patient name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              placeholder="e.g. Alex"
              autoFocus
              className="w-full bg-surface-alt rounded-[10px] px-3 py-3 text-base text-text-primary outline-none placeholder:text-text-muted"
            />
          </div>

          <button
            onClick={() => setShowOptional(!showOptional)}
            className="flex items-center gap-1 text-sm text-primary self-start"
          >
            <span>{showOptional ? '▼' : '▶'}</span>
            <span>Add more details (optional)</span>
          </button>

          {showOptional && (
            <>
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1 block">
                  Birth year / month
                </label>
                <input
                  type="month"
                  value={birthYearMonth}
                  onChange={(e) => setBirthYearMonth(e.target.value)}
                  className="w-full bg-surface-alt rounded-[10px] px-3 py-3 text-base text-text-primary outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1 block">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Diagnosis, preferences, anything useful..."
                  rows={3}
                  className="w-full bg-surface-alt rounded-[10px] px-3 py-3 text-base text-text-primary outline-none placeholder:text-text-muted resize-none"
                />
              </div>
            </>
          )}

          <button
            onClick={handleStart}
            disabled={!name.trim() || saving}
            className="w-full bg-primary rounded-[10px] py-3 text-center disabled:opacity-40"
          >
            <span className="text-base font-semibold text-white">
              {saving ? 'Setting up...' : 'Get Started'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
