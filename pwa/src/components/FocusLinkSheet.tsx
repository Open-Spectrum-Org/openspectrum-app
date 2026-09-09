import type { FocusArea } from '../types/database';

interface FocusLinkSheetProps {
  visible: boolean;
  activeFocusAreas: FocusArea[];
  linkedAreaIds: string[];
  onLink: (areaId: string) => void;
  onUnlink: (areaId: string) => void;
  onClose: () => void;
}

export function FocusLinkSheet({
  visible,
  activeFocusAreas,
  linkedAreaIds,
  onLink,
  onUnlink,
  onClose,
}: FocusLinkSheetProps) {
  if (!visible) return null;

  const linkedSet = new Set(linkedAreaIds);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
      <div className="bg-white rounded-t-2xl max-h-[60vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold text-text-primary">Link to Focus Area</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-text-muted">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeFocusAreas.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2">
              <span className="text-3xl">🎯</span>
              <span className="text-sm text-text-secondary">No active focus areas yet</span>
            </div>
          ) : (
            activeFocusAreas.map((area) => {
              const isLinked = linkedSet.has(area.id);
              return (
                <button
                  key={area.id}
                  onClick={() => (isLinked ? onUnlink(area.id) : onLink(area.id))}
                  className="w-full flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0"
                >
                  <span className="text-base text-text-primary">{area.title}</span>
                  <span className="text-lg">{isLinked ? '🎯' : '○'}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
