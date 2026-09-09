import type { ContextualPrompt } from '../utils/insights';

interface PromptsCardProps {
  prompts: ContextualPrompt[];
  onDismiss: () => void;
}

export function PromptsCard({ prompts, onDismiss }: PromptsCardProps) {
  if (prompts.length === 0) return null;

  return (
    <div className="mx-4 mt-3 bg-surface border border-border rounded-[10px] p-4 flex gap-3">
      <span className="text-[22px] leading-none mt-0.5">💬</span>
      <div className="flex-1 min-w-0">
        {prompts.map((p) => (
          <p key={p.id} className="text-sm text-text-secondary leading-5 mb-1 last:mb-0">
            {p.text}
          </p>
        ))}
      </div>
      <button
        onClick={onDismiss}
        className="text-text-muted text-lg leading-none mt-0.5 flex-shrink-0"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
