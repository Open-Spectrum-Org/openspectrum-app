import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { ChildSelector } from '../components/ChildSelector';
import { CreateTagSheet } from '../components/CreateTagSheet';
import { MicButton } from '../components/MicButton';
import { PromptsCard } from '../components/PromptsCard';
import { QuickTagGrid } from '../components/QuickTagGrid';
import { StressFAB } from '../components/StressFAB';
import { TimeOffsetPicker, type TimeSelection } from '../components/TimeOffsetPicker';
import { Toast } from '../components/Toast';
import { VoiceReviewSheet } from '../components/VoiceReviewSheet';
import { useChild } from '../hooks/useChild';
import { useContextualPrompts } from '../hooks/useContextualPrompts';
import { useTags } from '../hooks/useTags';
import { useToast } from '../hooks/useToast';
import { useVoiceCapture } from '../hooks/useVoiceCapture';
import { insertQuickTapObservation, getObservationCategoryCountsByDateRange } from '../db/queries/observations';
import { getScalesForCategory, insertObservationAssessment } from '../db/queries/assessments';
import { saveVoiceLogWithObservations } from '../db/queries/voiceLogs';
import { TEST_USER_ID } from '../db/seed';
import { recordTagUse } from '../utils/tagUsage';
import { todayDateString, addDays } from '../utils/date';
import type { AssessmentScale, TagWithCategory } from '../types/database';

const DEFAULT_TIME: TimeSelection = { occurredAt: null, precision: 'exact' };

interface HistoricalNavState {
  historicalDate: string;
  occurredAt: string;
  precision: 'exact' | 'date_only';
}

export default function Home() {
  const location = useLocation();
  const historicalState = (location.state as HistoricalNavState | null)?.historicalDate
    ? (location.state as HistoricalNavState)
    : null;

  const [searchQuery, setSearchQuery] = useState('');
  const [timeSelection, setTimeSelection] = useState<TimeSelection>(() =>
    historicalState
      ? { occurredAt: historicalState.occurredAt, precision: historicalState.precision }
      : DEFAULT_TIME
  );
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [inlineAssessment, setInlineAssessment] = useState<{
    observationId: string;
    tagName: string;
    category: string;
    scale: AssessmentScale;
  } | null>(null);

  const [topCategory, setTopCategory] = useState<string | null>(null);
  const [recentBehaviorCount, setRecentBehaviorCount] = useState(0);

  const { child } = useChild();
  const { groupedTags, refresh } = useTags();
  const { toast, showToast, hideToast } = useToast();
  const voice = useVoiceCapture();

  useEffect(() => {
    if (!child) return;
    const today = todayDateString();
    Promise.all([
      getObservationCategoryCountsByDateRange(child.id, addDays(today, -6), today),
      getObservationCategoryCountsByDateRange(child.id, addDays(today, -1), today),
    ]).then(([weekCounts, recentCounts]) => {
      const top = Object.entries(weekCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      setTopCategory(top);
      setRecentBehaviorCount(recentCounts['behavior'] ?? 0);
    });
  }, [child?.id]);

  const { prompts, dismiss: dismissPrompts } = useContextualPrompts(topCategory, false, recentBehaviorCount);

  const handleTagPress = async (tag: TagWithCategory, position: { x: number; y: number }) => {
    if (!child) return;

    const options =
      timeSelection.occurredAt !== null
        ? { occurredAt: timeSelection.occurredAt, precision: timeSelection.precision }
        : undefined;

    const observationId = await insertQuickTapObservation(child.id, TEST_USER_ID, tag, options);
    recordTagUse(child.id, tag.id);

    const scales = await getScalesForCategory(tag.category);
    if (scales.length > 0) {
      // Show rating pills inline — no toast
      setInlineAssessment({
        observationId,
        tagName: tag.name,
        category: tag.category,
        scale: scales[0]!,
      });
    } else {
      showToast(`${tag.name} logged`, { position });
    }
  };

  const handleVoiceConfirm = async () => {
    if (!child || !voice.parsedResult) return;
    const confirmed = voice.parsedResult.suggestedObservations.filter((o) => o.confirmed);
    if (confirmed.length === 0) return;

    try {
      await saveVoiceLogWithObservations(
        child.id,
        TEST_USER_ID,
        voice.editedTranscript || voice.transcript,
        voice.parsedResult.summary,
        voice.durationSeconds,
        confirmed
      );
      showToast(`${confirmed.length} observation${confirmed.length > 1 ? 's' : ''} logged`);
      voice.reset();
    } catch {
      showToast('Failed to save voice log');
    }
  };

  const handleRatingSelect = async (observationId: string, scaleId: string, value: number | string) => {
    if (typeof value === 'number') {
      await insertObservationAssessment(observationId, scaleId, { numeric_value: value });
    } else {
      await insertObservationAssessment(observationId, scaleId, { categorical_value: value });
    }
    const name = inlineAssessment?.tagName ?? '';
    setInlineAssessment(null);
    showToast(`${name} logged`);
  };

  const handleRatingSkip = () => {
    const name = inlineAssessment?.tagName ?? '';
    setInlineAssessment(null);
    showToast(`${name} logged`);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <AppHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Filter tags..."
        showHome={false}
      />
      <ChildSelector />

      {/* Historical event banner */}
      {historicalState && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border-b-2 border-amber-300">
          <span className="text-xl">📅</span>
          <div>
            <span className="block text-xs font-bold text-amber-700 uppercase tracking-wide">
              Logging a past event
            </span>
            <span className="block text-sm font-medium text-amber-800">
              {new Date(historicalState.historicalDate + 'T00:00:00').toLocaleDateString([], {
                weekday: 'long', month: 'long', day: 'numeric',
              })}
              {historicalState.precision === 'exact' && (
                <> &middot; {new Date(historicalState.occurredAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</>
              )}
            </span>
          </div>
        </div>
      )}

      <PromptsCard prompts={prompts} onDismiss={dismissPrompts} />
      <div className="flex-1 overflow-y-auto pb-[100px]">
        <MicButton
          onPress={voice.state === 'recording' ? voice.stopRecording : voice.startRecording}
          state={voice.state}
          durationSeconds={voice.durationSeconds}
        />
        {!historicalState && <TimeOffsetPicker value={timeSelection} onChange={setTimeSelection} />}
        <QuickTagGrid
          groups={groupedTags}
          onTagPress={handleTagPress}
          searchQuery={searchQuery}
          onCreateTag={() => setShowCreateTag(true)}
          pendingAssessment={inlineAssessment}
          onRatingSelect={handleRatingSelect}
          onRatingSkip={handleRatingSkip}
        />
      </div>
      <StressFAB />
      <VoiceReviewSheet
        visible={voice.state === 'review' || voice.state === 'analyzing'}
        transcript={voice.editedTranscript}
        parsedResult={voice.parsedResult}
        error={voice.error}
        isAnalyzing={voice.state === 'analyzing'}
        onChangeTranscript={voice.setEditedTranscript}
        onReanalyze={voice.submitForAnalysis}
        onToggleObservation={voice.toggleObservation}
        onRemoveObservation={voice.removeObservation}
        onConfirm={handleVoiceConfirm}
        onDiscard={voice.reset}
      />
      <Toast
        message={toast.message}
        visible={toast.visible}
        undoAction={toast.undoAction}
        action={toast.action}
        onHide={hideToast}
        position={toast.position}
      />
      {child && (
        <CreateTagSheet
          visible={showCreateTag}
          childId={child.id}
          onSave={() => {
            setShowCreateTag(false);
            refresh();
          }}
          onClose={() => setShowCreateTag(false)}
        />
      )}
    </div>
  );
}
