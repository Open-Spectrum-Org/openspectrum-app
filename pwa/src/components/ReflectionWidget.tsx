import { colors } from '../theme';
import type { DailyReflection } from '../types/database';

interface ReflectionWidgetProps {
  reflection: DailyReflection | null;
  onRate: (rating: 'better_than_usual' | 'typical' | 'difficult') => void;
}

const options: { key: 'better_than_usual' | 'typical' | 'difficult'; label: string; color: string }[] = [
  { key: 'better_than_usual', label: 'Better than usual', color: colors.betterThanUsual },
  { key: 'typical', label: 'Typical', color: colors.typical },
  { key: 'difficult', label: 'Difficult', color: colors.difficult },
];

export function ReflectionWidget({ reflection, onRate }: ReflectionWidgetProps) {
  return (
    <div className="px-4 py-4 space-y-3">
      <h3 className="text-lg font-semibold text-text-primary">How did today feel?</h3>
      <div className="flex gap-2">
        {options.map((opt) => {
          const isSelected = reflection?.rating === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => onRate(opt.key)}
              className="flex-1 border-[1.5px] rounded-[10px] py-3 text-center"
              style={{
                borderColor: opt.color,
                backgroundColor: isSelected ? opt.color : undefined,
                color: isSelected ? colors.white : opt.color,
              }}
            >
              <span className="text-sm font-semibold">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
