import { useState } from 'react';
import { useChild } from '../hooks/useChild';
import type { Child } from '../types/database';

interface PatientSheetProps {
  open: boolean;
  onClose: () => void;
}

type Mode = 'list' | 'add' | 'edit';

export function PatientSheet({ open, onClose }: PatientSheetProps) {
  const { child: activeChild, children, setActiveChild, addChild, updateChild } = useChild();
  const [mode, setMode] = useState<Mode>('list');
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [name, setName] = useState('');
  const [birthYearMonth, setBirthYearMonth] = useState('');
  const [notes, setNotes] = useState('');
  const [showOptional, setShowOptional] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const openAdd = () => {
    setEditingChild(null);
    setName('');
    setBirthYearMonth('');
    setNotes('');
    setShowOptional(false);
    setMode('add');
  };

  const openEdit = (child: Child) => {
    setEditingChild(child);
    setName(child.display_name);
    setBirthYearMonth(child.birth_year_month ?? '');
    setNotes(child.profile_notes ?? '');
    setShowOptional(!!(child.birth_year_month || child.profile_notes));
    setMode('edit');
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      if (mode === 'add') {
        const child = await addChild(trimmed, birthYearMonth || undefined, notes || undefined);
        setActiveChild(child);
      } else if (mode === 'edit' && editingChild) {
        await updateChild(editingChild.id, {
          display_name: trimmed,
          birth_year_month: birthYearMonth || null,
          profile_notes: notes || null,
        });
      }
      setMode('list');
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = (child: Child) => {
    setActiveChild(child);
    onClose();
  };

  const handleClose = () => {
    setMode('list');
    onClose();
  };

  const title = mode === 'list' ? 'Switch Patient' : mode === 'add' ? 'New Patient' : 'Edit Patient';

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative w-full bg-white rounded-t-2xl max-h-[80vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border flex-shrink-0">
          {mode !== 'list' ? (
            <button
              onClick={() => setMode('list')}
              className="w-8 h-8 flex items-center justify-center"
            >
              <span className="text-[28px] font-semibold text-primary leading-none">‹</span>
            </button>
          ) : (
            <div className="w-8" />
          )}
          <span className="text-base font-semibold text-text-primary">{title}</span>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center"
          >
            <span className="text-sm text-text-secondary">✕</span>
          </button>
        </div>

        {mode === 'list' ? (
          <div className="flex-1 overflow-y-auto">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => handleSelect(child)}
                className="w-full flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
              >
                <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">
                    {child.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-base font-medium text-text-primary">{child.display_name}</div>
                  {child.birth_year_month && (
                    <div className="text-xs text-text-muted">{child.birth_year_month}</div>
                  )}
                </div>
                {activeChild?.id === child.id && (
                  <span className="text-primary text-sm font-bold mr-1">✓</span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(child); }}
                  className="w-8 h-8 flex items-center justify-center text-text-muted text-base"
                  aria-label="Edit patient"
                >
                  ✎
                </button>
              </button>
            ))}
            <button
              onClick={openAdd}
              className="w-full flex items-center gap-3 px-4 py-4"
            >
              <div className="w-9 h-9 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                <span className="text-lg text-text-muted">+</span>
              </div>
              <span className="text-base text-primary font-medium">Add Patient</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Patient name"
                autoFocus
                className="w-full bg-surface-alt rounded-[10px] px-3 py-3 text-base text-text-primary outline-none placeholder:text-text-muted"
              />
            </div>

            <button
              onClick={() => setShowOptional(!showOptional)}
              className="flex items-center gap-1 text-sm text-primary self-start"
            >
              <span>{showOptional ? '▼' : '▶'}</span>
              <span>More details (optional)</span>
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
                    placeholder="Any additional notes about this patient..."
                    rows={3}
                    className="w-full bg-surface-alt rounded-[10px] px-3 py-3 text-base text-text-primary outline-none placeholder:text-text-muted resize-none"
                  />
                </div>
              </>
            )}

            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="w-full bg-primary rounded-[10px] py-3 text-center disabled:opacity-40"
            >
              <span className="text-base font-semibold text-white">
                {saving ? 'Saving...' : mode === 'add' ? 'Add Patient' : 'Save Changes'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
