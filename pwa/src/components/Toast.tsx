interface ToastProps {
  message: string;
  visible: boolean;
  undoAction?: () => void;
  action?: { label: string; onClick: () => void };
  onHide: () => void;
  position?: { x: number; y: number };
}

export function Toast({ message, visible, undoAction, action, onHide, position }: ToastProps) {
  if (!visible) return null;

  const posStyle = position
    ? { top: Math.max(position.y - 80, 60), bottom: 'auto' as const }
    : { bottom: 100 };

  return (
    <div
      className="fixed left-4 right-4 z-[1000] flex justify-center"
      style={posStyle}
    >
      <div className="bg-text-primary rounded-[10px] px-4 py-3 flex items-center gap-3 shadow-lg">
        <span className="text-sm text-white flex-1">{message}</span>
        {undoAction && (
          <button
            onClick={() => {
              undoAction();
              onHide();
            }}
            className="px-2 py-1 text-sm font-semibold text-primary"
          >
            Undo
          </button>
        )}
        {action && (
          <button
            onClick={() => {
              action.onClick();
              onHide();
            }}
            className="px-2 py-1 text-sm font-semibold text-primary"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
