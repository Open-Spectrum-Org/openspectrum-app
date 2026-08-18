import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { DateNavigator } from '../components/DateNavigator';
import { DaySummaryRow } from '../components/DaySummaryRow';
import { TimelineCard } from '../components/TimelineCard';
import { ReflectionWidget } from '../components/ReflectionWidget';
import { Toast } from '../components/Toast';
import { useObservations } from '../hooks/useObservations';
import { useReflection } from '../hooks/useReflection';
import { useToast } from '../hooks/useToast';
import { todayDateString, addDays } from '../utils/date';
import { tagMatchesQuery } from '../utils/tagSynonyms';
import type { ObservationWithTags } from '../types/database';

export default function Timeline() {
  const navigate = useNavigate();
  const [date, setDate] = useState(todayDateString());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const { observations, summary, deleteObservation, undoDelete } = useObservations(date);
  const { reflection, setRating } = useReflection(date);
  const { toast, showToast, hideToast } = useToast();

  const handleToggleCategory = useCallback((category: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const filteredObservations = useMemo(() => {
    let filtered: ObservationWithTags[] = observations;

    if (activeCategories.size > 0) {
      filtered = filtered.filter((o) => activeCategories.has(o.category));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((o) => {
        const titleMatch = o.title?.toLowerCase().includes(query);
        const notesMatch = o.notes?.toLowerCase().includes(query);
        const tagMatch = o.tags?.some((t) => tagMatchesQuery(t.name, query));
        return titleMatch || notesMatch || tagMatch;
      });
    }

    return filtered;
  }, [observations, activeCategories, searchQuery]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteObservation(id);
    showToast('Entry deleted', {
      duration: 5000,
      undoAction: () => undoDelete(id),
    });
  }, [deleteObservation, showToast, undoDelete]);

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex-1 overflow-y-auto pb-12">
        <AppHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search entries..."
          showHome={true}
        />
        <DateNavigator
          date={date}
          onPrev={() => setDate(addDays(date, -1))}
          onNext={() => setDate(addDays(date, 1))}
        />
        <DaySummaryRow
          summary={summary}
          activeCategories={activeCategories}
          onToggle={handleToggleCategory}
        />

        {filteredObservations.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <span className="text-5xl">📝</span>
            <span className="text-base text-text-secondary">
              {searchQuery || activeCategories.size > 0
                ? 'No matching entries'
                : 'No entries yet for this day'}
            </span>
          </div>
        ) : (
          filteredObservations.map((obs) => (
            <TimelineCard key={obs.id} observation={obs} onDelete={handleDelete} />
          ))
        )}

        <ReflectionWidget reflection={reflection} onRate={setRating} />

        <div className="px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-primary rounded-[10px] py-3 text-center"
          >
            <span className="text-base font-semibold text-white">Log an Event</span>
          </button>
        </div>
      </div>
      <Toast
        message={toast.message}
        visible={toast.visible}
        undoAction={toast.undoAction}
        onHide={hideToast}
      />
    </div>
  );
}
