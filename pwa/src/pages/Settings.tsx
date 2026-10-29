import { useState } from 'react';
import { AppHeader } from '../components/AppHeader';
import { useChild } from '../hooks/useChild';
import { loadDemoData, clearDemoData, DEMO_CHILD_NAME } from '../db/demoData';

export default function Settings() {
  const { children, addChild, setActiveChild } = useChild();
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoFeedback, setDemoFeedback] = useState<string | null>(null);

  async function handleDemo(action: 'load' | 'clear') {
    setDemoBusy(true);
    setDemoFeedback(null);
    try {
      let demoChild = children.find((c) => c.display_name === DEMO_CHILD_NAME);
      if (action === 'load') {
        demoChild ??= await addChild(DEMO_CHILD_NAME);
        const count = await loadDemoData(demoChild.id);
        setActiveChild(demoChild);
        setDemoFeedback(`Added ${count} demo observations for ${DEMO_CHILD_NAME}.`);
      } else if (demoChild) {
        await clearDemoData(demoChild.id);
        setDemoFeedback('Demo data removed.');
      }
    } catch {
      setDemoFeedback('Something went wrong.');
    } finally {
      setDemoBusy(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      <AppHeader
        searchQuery=""
        onSearchChange={() => {}}
        placeholder=""
        showHome={true}
        editable={false}
      />

      <div className="flex-1 overflow-y-auto p-4 pb-12 space-y-6">
        <p className="text-sm text-text-muted">
          Looking for data export? It's on the Reports page.
        </p>

        {/* Demo data */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-text-primary">Demo Data</h2>
          <p className="text-sm text-text-muted">
            Adds four weeks of sample logs to a patient named {DEMO_CHILD_NAME}. Other patients are not touched.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { void handleDemo('load'); }}
              disabled={demoBusy}
              className="flex-1 py-3 rounded-[10px] text-sm font-semibold border border-primary text-primary bg-white disabled:opacity-40"
            >
              Load demo data
            </button>
            <button
              onClick={() => { void handleDemo('clear'); }}
              disabled={demoBusy}
              className="flex-1 py-3 rounded-[10px] text-sm font-semibold border border-border text-text-secondary bg-white disabled:opacity-40"
            >
              Remove demo data
            </button>
          </div>
          {demoFeedback && <p className="text-sm text-center text-green-600">{demoFeedback}</p>}
        </div>
      </div>
    </div>
  );
}
