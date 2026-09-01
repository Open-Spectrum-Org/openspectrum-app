import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/timeline', label: 'Timeline', icon: '📋' },
  { to: '/insights', label: 'Insights', icon: '📊' },
  { to: '/reports', label: 'Reports', icon: '📄' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border h-[60px] flex items-center z-50">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-1 pb-2 relative"
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 left-3 right-3 h-0.5 bg-primary rounded-b-full" />
              )}
              <span className={`text-xl ${isActive ? 'text-primary' : 'text-text-muted'}`}>{tab.icon}</span>
              <span className={`text-[11px] font-semibold ${isActive ? 'text-primary' : 'text-text-muted'}`}>{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
