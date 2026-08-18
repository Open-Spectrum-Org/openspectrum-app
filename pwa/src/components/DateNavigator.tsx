import { useChild } from '../hooks/useChild';
import { formatDateDisplay, isToday } from '../utils/date';

interface DateNavigatorProps {
  date: string;
  onPrev: () => void;
  onNext: () => void;
}

export function DateNavigator({ date, onPrev, onNext }: DateNavigatorProps) {
  const { child } = useChild();
  const isTodayDate = isToday(date);
  const dateLabel = formatDateDisplay(date);
  const subtitle = child ? `${dateLabel} with ${child.display_name}` : dateLabel;

  return (
    <div className="flex items-center justify-center py-3 gap-1">
      <button onClick={onPrev} className="w-9 h-9 flex items-center justify-center">
        <span className="text-[28px] font-semibold text-primary">‹</span>
      </button>
      <span className="text-lg font-semibold text-text-primary">{subtitle}</span>
      <button
        onClick={onNext}
        className={`w-9 h-9 flex items-center justify-center ${isTodayDate ? 'opacity-30' : ''}`}
        disabled={isTodayDate}
      >
        <span className={`text-[28px] font-semibold ${isTodayDate ? 'text-text-muted' : 'text-primary'}`}>
          ›
        </span>
      </button>
    </div>
  );
}
