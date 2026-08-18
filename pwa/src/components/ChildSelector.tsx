import { useChild } from '../hooks/useChild';

export function ChildSelector() {
  const { child } = useChild();

  if (!child) return null;

  const initial = child.display_name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-11 h-11 rounded-full bg-primary-light flex items-center justify-center">
        <span className="text-lg font-semibold text-primary">{initial}</span>
      </div>
      <span className="text-[22px] font-semibold text-text-primary">{child.display_name}</span>
    </div>
  );
}
