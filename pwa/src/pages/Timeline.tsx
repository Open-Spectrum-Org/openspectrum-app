import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { DateNavigator } from '../components/DateNavigator';
import { DaySummaryRow } from '../components/DaySummaryRow';
import { FocusLinkSheet } from '../components/FocusLinkSheet';
import { TimelineCard } from '../components/TimelineCard';
import { TimelineRow } from '../components/TimelineRow';
import { ReflectionWidget } from '../components/ReflectionWidget';
import { Toast } from '../components/Toast';
import { useObservations } from '../hooks/useObservations';
import { useWeekObservations } from '../hooks/useWeekObservations';
import { useReflection } from '../hooks/useReflection';
import { useToast } from '../hooks/useToast';
import { useFocusAreas } from '../hooks/useFocusAreas';
import { todayDateString, addDays, formatDateDisplay } from '../utils/date';
import { categoryColor } from '../theme/colors';
import { tagMatchesQuery } from '../utils/tagSynonyms';
import {
  getLinkedFocusAreaIdsForObservations,
  linkObservationToFocusArea,
  unlinkObservationFromFocusArea,
} from '../db/queries/focusAreas';
import type { FocusArea, ObservationWithTags } from '../types/database';

type ViewMode = 'day' | 'week';

function parseCats(json: string | null): string[] {
  try { return json ? JSON.parse(json) : []; } catch { return []; }
}

export default function Timeline() {
  const navigate = useNavigate();
  const location = useLocation();

  const [date, setDate] = useState(todayDateString());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  // Initialise from navigation state when coming from Focus Areas page
  const [activeFocusAreaId, setActiveFocusAreaId] = useState<string | null>(
    (location.state as { focusAreaId?: string } | null)?.focusAreaId ?? null
  );

  const [linkedFocusAreaIds, setLinkedFocusAreaIds] = useState<Record<string, string[]>>({});
  const [linkSheet, setLinkSheet] = useState<{ obsId: string } | null>(null);

  const { observations, deleteObservation, undoDelete } = useObservations(date);
  const { days: weekDays } = useWeekObservations(date);
  const { reflection, setRating } = useReflection(date);
  const { toast, showToast, hideToast } = useToast();
  const { areas: focusAreas } = useFocusAreas();

  const activeFocusAreas = useMemo(
    () => focusAreas.filter((a) => a.status === 'active'),
    [focusAreas]
  );

  const activeFocusArea = useMemo(
    () => (activeFocusAreaId ? focusAreas.find((a) => a.id === activeFocusAreaId) ?? null : null),
    [focusAreas, activeFocusAreaId]
  );

  const focusCategories = useMemo(
    () => (activeFocusArea ? new Set(parseCats(activeFocusArea.related_categories)) : null),
    [activeFocusArea]
  );

  const handleToggleCategory = useCallback((category: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const handleToggleFocus = useCallback((area: FocusArea) => {
    setActiveFocusAreaId((prev) => (prev === area.id ? null : area.id));
    setActiveCategories(new Set()); // clear category filter when switching focus
  }, []);

  // Apply focus-area category filter on top of everything else
  const applyFocusFilter = useCallback(
    (obs: ObservationWithTags[]) =>
      focusCategories && focusCategories.size > 0
        ? obs.filter((o) => focusCategories.has(o.category))
        : obs,
    [focusCategories]
  );

  const allCategories = useMemo(() => {
    const source: ObservationWithTags[] =
      viewMode === 'week'
        ? weekDays.flatMap((d) => d.observations)
        : observations;
    const focusFiltered = applyFocusFilter(source);
    const counts: Record<string, number> = {};
    for (const obs of focusFiltered) {
      counts[obs.category] = (counts[obs.category] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([key, count]) => ({ key, count, color: categoryColor(key) }))
      .sort((a, b) => b.count - a.count);
  }, [observations, weekDays, viewMode, applyFocusFilter]);

  const filteredObservations = useMemo(() => {
    let filtered = applyFocusFilter(observations);

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
  }, [observations, activeCategories, searchQuery, applyFocusFilter]);

  const filteredWeekDays = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return weekDays.map((day) => ({
      ...day,
      observations: applyFocusFilter(day.observations).filter((o) => {
        if (activeCategories.size > 0 && !activeCategories.has(o.category)) return false;
        if (query) {
          const titleMatch = o.title?.toLowerCase().includes(query);
          const notesMatch = o.notes?.toLowerCase().includes(query);
          const tagMatch = o.tags?.some((t) => tagMatchesQuery(t.name, query));
          return titleMatch || notesMatch || tagMatch;
        }
        return true;
      }),
    }));
  }, [weekDays, activeCategories, searchQuery, applyFocusFilter]);

  useEffect(() => {
    if (observations.length === 0) { setLinkedFocusAreaIds({}); return; }
    getLinkedFocusAreaIdsForObservations(observations.map((o) => o.id))
      .then(setLinkedFocusAreaIds);
  }, [observations]);

  const handleLink = useCallback(async (areaId: string) => {
    if (!linkSheet) return;
    await linkObservationToFocusArea(linkSheet.obsId, areaId, 'explicit');
    getLinkedFocusAreaIdsForObservations([linkSheet.obsId]).then((updated) =>
      setLinkedFocusAreaIds((prev) => ({ ...prev, ...updated }))
    );
  }, [linkSheet]);

  const handleUnlink = useCallback(async (areaId: string) => {
    if (!linkSheet) return;
    await unlinkObservationFromFocusArea(linkSheet.obsId, areaId);
    getLinkedFocusAreaIdsForObservations([linkSheet.obsId]).then((updated) =>
      setLinkedFocusAreaIds((prev) => ({ ...prev, ...updated }))
    );
  }, [linkSheet]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteObservation(id);
    showToast('Entry deleted', {
      duration: 5000,
      undoAction: () => undoDelete(id),
    });
  }, [deleteObservation, showToast, undoDelete]);

  const handleWeekRowTap = useCallback((tapDate: string) => {
    setDate(tapDate);
    setViewMode('day');
  }, []);

  const handlePrev = useCallback(() => {
    setDate((d) => addDays(d, viewMode === 'week' ? -7 : -1));
  }, [viewMode]);

  const handleNext = useCallback(() => {
    setDate((d) => addDays(d, viewMode === 'week' ? 7 : 1));
  }, [viewMode]);

  const isFiltered = activeCategories.size > 0 || !!activeFocusAreaId || !!searchQuery.trim();

  return (
    <div className="flex flex-col h-full bg-surface">
      <AppHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search entries..."
        showHome={true}
      />
      <DateNavigator
        date={date}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={() => setDate(todayDateString())}
      />

      {/* Day / Week toggle */}
      <div className="flex px-4 pb-1 gap-2">
        <button
          onClick={() => setViewMode('day')}
          className={`text-sm px-3 py-1 rounded-full font-medium transition-colors ${
            viewMode === 'day'
              ? 'bg-primary text-white'
              : 'bg-surface text-text-secondary border border-border'
          }`}
        >
          Day
        </button>
        <button
          onClick={() => setViewMode('week')}
          className={`text-sm px-3 py-1 rounded-full font-medium transition-colors ${
            viewMode === 'week'
              ? 'bg-primary text-white'
              : 'bg-surface text-text-secondary border border-border'
          }`}
        >
          Week
        </button>
      </div>

      {/* Focus Area filter chips */}
      {activeFocusAreas.length > 0 && (
        <div className="flex gap-2 px-4 pb-1 overflow-x-auto">
          {activeFocusAreas.map((area) => {
            const isActive = activeFocusAreaId === area.id;
            return (
              <button
                key={area.id}
                onClick={() => handleToggleFocus(area)}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  isActive
                    ? 'bg-primary text-white border-primary'
                    : 'border-border text-text-secondary bg-white'
                }`}
              >
                <span>🎯</span>
                <span>{area.title}</span>
                {isActive && <span className="ml-0.5 opacity-70">✕</span>}
              </button>
            );
          })}
        </div>
      )}

      <DaySummaryRow
        categories={allCategories}
        activeCategories={activeCategories}
        onToggle={handleToggleCategory}
      />

      <div className="flex-1 overflow-y-auto pb-12">
        {viewMode === 'day' ? (
          <>
            {filteredObservations.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <span className="text-5xl">📝</span>
                <span className="text-base text-text-secondary">
                  {isFiltered ? 'No matching entries' : 'No entries yet for this day'}
                </span>
              </div>
            ) : (
              filteredObservations.map((obs) => (
                <TimelineCard
                  key={obs.id}
                  observation={obs}
                  onDelete={handleDelete}
                  activeFocusAreas={activeFocusAreas}
                  linkedAreaIds={linkedFocusAreaIds[obs.id] ?? []}
                  onLinkPress={() => setLinkSheet({ obsId: obs.id })}
                />
              ))
            )}
            <ReflectionWidget reflection={reflection} onRate={setRating} />
          </>
        ) : (
          <>
            {filteredWeekDays.map((day) => (
              <div key={day.date}>
                <div className="px-4 py-2 bg-surface-alt border-b border-border">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    {formatDateDisplay(day.date)}
                  </span>
                </div>
                {day.observations.length === 0 ? (
                  <p className="px-4 py-2 text-xs text-text-muted">Nothing logged</p>
                ) : (
                  day.observations.map((obs) => (
                    <TimelineRow key={obs.id} observation={obs} onTap={handleWeekRowTap} />
                  ))
                )}
              </div>
            ))}
          </>
        )}

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
      {linkSheet && (
        <FocusLinkSheet
          visible={true}
          activeFocusAreas={activeFocusAreas}
          linkedAreaIds={linkedFocusAreaIds[linkSheet.obsId] ?? []}
          onLink={handleLink}
          onUnlink={handleUnlink}
          onClose={() => setLinkSheet(null)}
        />
      )}
    </div>
  );
}
