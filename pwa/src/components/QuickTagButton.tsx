import { useCallback, useEffect, useRef, useState } from 'react';
import { categoryColorLight } from '../theme/colors';
import type { TagWithCategory } from '../types/database';

const COOLDOWN_MS = 2000;

interface QuickTagButtonProps {
  tag: TagWithCategory;
  onPress: (tag: TagWithCategory, position: { x: number; y: number }) => void;
}

export function QuickTagButton({ tag, onPress }: QuickTagButtonProps) {
  const bgColor = categoryColorLight(tag.category, 0.15);
  const borderColor = tag.color ?? '#6B7280';
  const [cooldown, setCooldown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (cooldown) return;
      onPress(tag, { x: event.pageX, y: event.pageY });
      setCooldown(true);
      timerRef.current = setTimeout(() => setCooldown(false), COOLDOWN_MS);
    },
    [cooldown, onPress, tag]
  );

  return (
    <button
      onClick={handleClick}
      disabled={cooldown}
      className="min-h-[44px] min-w-[80px] border-[1.5px] rounded-[10px] px-3 py-2 flex items-center justify-center basis-[45%] grow m-1 active:opacity-70 active:scale-[0.96] transition-transform"
      style={{
        backgroundColor: bgColor,
        borderColor,
        opacity: cooldown ? 0.5 : undefined,
      }}
    >
      <span className="text-sm font-semibold text-center leading-tight" style={{ color: borderColor }}>
        {cooldown ? '✓' : tag.name}
      </span>
    </button>
  );
}
