import { AppHeader } from '../components/AppHeader';

export default function Settings() {
  return (
    <div className="flex flex-col h-full bg-white">
      <AppHeader searchQuery="" onSearchChange={() => {}} placeholder="Search coming soon" showHome={true} editable={false} />
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        <span className="text-5xl">⚙️</span>
        <span className="text-[22px] font-semibold text-text-primary">Settings</span>
        <span className="text-base text-text-secondary">Coming Soon</span>
      </div>
    </div>
  );
}
