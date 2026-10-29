import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { DateNavigator } from '../components/DateNavigator';
import { DaySummaryRow } from '../components/DaySummaryRow';
import { AssessmentSheet } from '../components/AssessmentSheet';
import { FocusLinkSheet } from '../components/FocusLinkSheet';
import { TimelineCard } from '../components/TimelineCard';
import { TimelineRow } from '../components/TimelineRow';
import { VoiceLogCard } from '../components/VoiceLogCard';
import { ReflectionWidget } from '../components/ReflectionWidget';
import { Toast } from '../components/Toast';
import { useObservations } from '../hooks/useObservations';
import { useWeekObservations } from '../hooks/useWeekObservations';
import { useReflection } from '../hooks/useReflection';
import { useToast } from '../hooks/useToast';
import { useFocusAreas } from '../hooks/useFocusAreas';
import { todayDateString, addDays, formatDateDisplay, isToday, dayStartISO } from '../utils/date';
import { categoryColor } from '../theme/colors';
import { tagMatchesQuery } from '../utils/tagSynonyms';
import {
  getLinkedFocusAreaIdsForObservations,
  linkObservationToFocusArea,
  unlinkObservationFromFocusArea,
} from '../db/queries/focusAreas';
import type { AssessmentWithScale, FocusArea, ObservationWithTags } from '../types/database';

type ViewMode = 'day' | 'week';

function parseCats(json: string | null): string[] {
  try { return json ? JSON.parse(json) : []; } catch { return []; }
}

function formatDateForButton(dateString: string): string {
  return new Date(dateString + 'T00:00:00').toLocaleDateString([], {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

export default function Timeline() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerTime, setPickerTime] = useState('');

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
  const [editingAssessment, setEditingAssessment] = useState<{
    assessment: AssessmentWithScale;
    tagName: string;
  } | null>(null);

  const { observations, refresh, deleteObservation, undoDelete, deleteObservationGroup, undoDeleteGroup } = useObservations(date);
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
      // Skip voice log containers — they use the fake 'transcript' category
      if (obs.entry_type === 'voice' && obs.parent_observation_id === null) continue;
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

  // Group voice children under their parent; voice parents become VoiceLogCards
  const { voiceRenderList, voiceChildrenMap } = useMemo(() => {
    const voiceChildrenMap = new Map<string, ObservationWithTags[]>();
    for (const obs of filteredObservations) {
      if (obs.entry_type === 'voice' && obs.parent_observation_id) {
        const arr = voiceChildrenMap.get(obs.parent_observation_id) ?? [];
        voiceChildrenMap.set(obs.parent_observation_id, [...arr, obs]);
      }
    }
    // Drop standalone voice children — they are shown inside VoiceLogCard
    const voiceRenderList = filteredObservations.filter(
      (obs) => !(obs.entry_type === 'voice' && obs.parent_observation_id !== null)
    );
    return { voiceRenderList, voiceChildrenMap };
  }, [filteredObservations]);

  const filteredWeekDays = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return weekDays.map((day) => ({
      ...day,
      observations: applyFocusFilter(day.observations).filter((o) => {
        // Skip voice log containers in week view
        if (o.entry_type === 'voice' && o.parent_observation_id === null) return false;
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

  const handleDeleteGroup = useCallback(async (ids: string[]) => {
    await deleteObservationGroup(ids);
    showToast('Voice log deleted', {
      duration: 5000,
      undoAction: () => undoDeleteGroup(ids),
    });
  }, [deleteObservationGroup, showToast, undoDeleteGroup]);

  const handleEditAssessment = useCallback(
    (assessment: AssessmentWithScale, tagName: string) => {
      setEditingAssessment({ assessment, tagName });
    },
    []
  );

  const handleCloseEditAssessment = useCallback(() => {
    setEditingAssessment(null);
    refresh();
  }, [refresh]);

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
              voiceRenderList.map((obs) => {
                const isVoiceParent =
                  obs.entry_type === 'voice' &&
                  obs.voice_log_id !== null &&
                  obs.parent_observation_id === null;
                if (isVoiceParent) {
                  return (
                    <VoiceLogCard
                      key={obs.id}
                      parent={obs}
                      children={voiceChildrenMap.get(obs.id) ?? []}
                      onDelete={handleDeleteGroup}
                    />
                  );
                }
                return (
                  <TimelineCard
                    key={obs.id}
                    observation={obs}
                    onDelete={handleDelete}
                    onEditAssessment={handleEditAssessment}
                    activeFocusAreas={activeFocusAreas}
                    linkedAreaIds={linkedFocusAreaIds[obs.id] ?? []}
                    onLinkPress={() => setLinkSheet({ obsId: obs.id })}
                  />
                );
              })
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
            onClick={() => {
              if (isToday(date)) {
                navigate('/');
              } else {
                const now = new Date();
                setPickerTime(
                  `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
                );
                setShowTimePicker(true);
              }
            }}
            className="w-full bg-primary rounded-[10px] py-3 text-center"
          >
            <span className="text-base font-semibold text-white">
              {isToday(date) ? 'Log an Event' : `Log Event for ${formatDateForButton(date)}`}
            </span>
          </button>
        </div>
      </div>

      {/* Time-picker bottom sheet for historical dates */}
      {showTimePicker && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40"
          onClick={() => setShowTimePicker(false)}
        >
          <div
            className="w-full bg-white rounded-t-2xl p-5 pb-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-text-primary mb-1">
              What time did this happen?
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              {new Date(date + 'T00:00:00').toLocaleDateString([], {
                weekday: 'long', month: 'long', day: 'numeric',
              })}
            </p>
            <input
              type="time"
              value={pickerTime}
              onChange={(e) => setPickerTime(e.target.value)}
              className="w-full border border-border rounded-[8px] px-3 py-3 text-lg text-text-primary bg-surface mb-4"
            />
            <button
              onClick={() => {
                const occurredAt = new Date(`${date}T${pickerTime}:00`).toISOString();
                navigate('/', { state: { historicalDate: date, occurredAt, precision: 'exact' } });
                setShowTimePicker(false);
              }}
              className="w-full bg-primary text-white rounded-[10px] py-3 text-base font-semibold mb-2"
            >
              Continue
            </button>
            <button
              onClick={() => {
                navigate('/', { state: { historicalDate: date, occurredAt: dayStartISO(date), precision: 'date_only' } });
                setShowTimePicker(false);
              }}
              className="w-full text-text-secondary text-sm py-2"
            >
              I don't know the exact time
            </button>
          </div>
        </div>
      )}
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
      {editingAssessment && (
        <AssessmentSheet
          visible={true}
          observationId={editingAssessment.assessment.observation_id}
          tagName={editingAssessment.tagName}
          scale={editingAssessment.assessment.scale}
          existingAssessmentId={editingAssessment.assessment.id}
          currentNumericValue={editingAssessment.assessment.numeric_value}
          currentCategoricalValue={editingAssessment.assessment.categorical_value}
          onClose={handleCloseEditAssessment}
        />
      )}
    </div>
  );
}
