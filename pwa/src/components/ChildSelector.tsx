import { useState } from 'react';
import { useChild } from '../hooks/useChild';
import { PatientSheet } from './PatientSheet';

export function ChildSelector() {
  const { child, children } = useChild();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!child) return null;

  const initial = child.display_name.charAt(0).toUpperCase();

  return (
    <>
      <button
        onClick={() => setSheetOpen(true)}
        className="flex items-center gap-3 px-4 py-3 w-full"
      >
        <div className="w-11 h-11 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-semibold text-primary">{initial}</span>
        </div>
        <span className="text-[22px] font-semibold text-text-primary flex-1 text-left">
          {child.display_name}
        </span>
        {children.length > 1 && (
          <span className="text-xs text-text-muted bg-surface-alt rounded-full px-2 py-0.5">
            {children.length}
          </span>
        )}
        <span className="text-text-muted text-base">▾</span>
      </button>
      <PatientSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
