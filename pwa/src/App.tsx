import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DatabaseProvider, useDatabaseReady } from './hooks/useDatabase';
import { ChildProvider, useChild } from './hooks/useChild';
import { NavBar } from './components/NavBar';
import Home from './pages/Home';
import Timeline from './pages/Timeline';
import FocusAreas from './pages/FocusAreas';
import Insights from './pages/Insights';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { SetupScreen } from './pages/SetupScreen';

function AppRoutes() {
  const { children, isLoaded } = useChild();

  if (!isLoaded) return null;

  if (children.length === 0) {
    return <SetupScreen />;
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-hidden pb-[60px]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/focus" element={<FocusAreas />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
      <NavBar />
    </div>
  );
}

function AppContent() {
  const isReady = useDatabaseReady();

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ChildProvider>
      <AppRoutes />
    </ChildProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <DatabaseProvider>
        <AppContent />
      </DatabaseProvider>
    </BrowserRouter>
  );
}
