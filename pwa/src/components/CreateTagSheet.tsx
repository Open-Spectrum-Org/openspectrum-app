import { useState } from 'react';
import { SYSTEM_TAG_CATEGORIES } from '../types/database';
import { insertCustomTag } from '../db/queries/tags';
import { categoryColor } from '../theme';

const PRESET_COLORS = [
  '#7C3AED',
  '#14B8A6',
  '#F59E0B',
  '#EC4899',
  '#6366F1',
  '#EF4444',
  '#22C55E',
  '#6B7280',
];

interface CreateTagSheetProps {
  visible: boolean;
  childId: string;
  onSave: () => void;
  onClose: () => void;
}

export function CreateTagSheet({ visible, childId, onSave, onClose }: CreateTagSheetProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('behavior');
  const [color, setColor] = useState(PRESET_COLORS[0]!);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!visible) return null;

  async function handleSave() {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await insertCustomTag(name.trim(), category, color, childId);
      setName('');
      setCategory('behavior');
      setColor(PRESET_COLORS[0]!);
      onSave();
    } catch {
      setError('Failed to save tag');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-[20px] px-4 pt-4 pb-8">
        {/* Handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[18px] font-semibold text-text-primary">New tag</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center"
          >
            <span className="text-base text-text-secondary">✕</span>
          </button>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-text-secondary mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Refused food"
            className="w-full border border-border rounded-[10px] px-3 py-2.5 text-base text-text-primary bg-surface outline-none placeholder:text-text-muted"
            autoFocus
          />
          {error ? <p className="text-sm text-danger mt-1">{error}</p> : null}
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-text-secondary mb-2">Category</label>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {SYSTEM_TAG_CATEGORIES.map((cat) => {
              const catColor = categoryColor(cat);
              const selected = category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setColor(catColor);
                  }}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border capitalize transition-colors"
                  style={
                    selected
                      ? { backgroundColor: catColor, color: '#fff', borderColor: catColor }
                      : { color: catColor, borderColor: catColor, backgroundColor: 'transparent' }
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Color */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-text-secondary mb-2">Color</label>
          <div className="flex gap-3 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? '#111827' : 'transparent',
                }}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-[10px] border border-border text-base font-semibold text-text-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-[10px] bg-primary text-white text-base font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
