import { useNavigate } from 'react-router-dom';

interface AppHeaderProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  placeholder?: string;
  showHome?: boolean;
  editable?: boolean;
}

export function AppHeader({
  searchQuery,
  onSearchChange,
  placeholder = 'Search...',
  showHome = true,
  editable = true,
}: AppHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center px-4 py-2 gap-2">
      {showHome && (
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 flex items-center justify-center"
        >
          <span className="text-lg">🏠</span>
        </button>
      )}
      <div
        className={`flex-1 flex items-center bg-surface-alt rounded-[10px] px-2 h-9 ${
          !editable ? 'opacity-50' : ''
        }`}
      >
        <span className="text-sm mr-1">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          disabled={!editable}
          className="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-muted"
        />
        {searchQuery.length > 0 && editable && (
          <button
            onClick={() => onSearchChange('')}
            className="w-6 h-6 flex items-center justify-center"
          >
            <span className="text-sm text-text-secondary">✕</span>
          </button>
        )}
      </div>
    </div>
  );
}
