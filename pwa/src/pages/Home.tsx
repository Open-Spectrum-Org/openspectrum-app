import { useState } from 'react';
import { AppHeader } from '../components/AppHeader';
import { AssessmentSheet } from '../components/AssessmentSheet';
import { ChildSelector } from '../components/ChildSelector';
import { CreateTagSheet } from '../components/CreateTagSheet';
import { MicButton } from '../components/MicButton';
import { QuickTagGrid } from '../components/QuickTagGrid';
import { StressFAB } from '../components/StressFAB';
import { TimeOffsetPicker, type TimeSelection } from '../components/TimeOffsetPicker';
import { Toast } from '../components/Toast';
import { VoiceReviewSheet } from '../components/VoiceReviewSheet';
import { useChild } from '../hooks/useChild';
import { useTags } from '../hooks/useTags';
import { useToast } from '../hooks/useToast';
import { useVoiceCapture } from '../hooks/useVoiceCapture';
import { insertQuickTapObservation } from '../db/queries/observations';
import { getScalesForCategory } from '../db/queries/assessments';
import { saveVoiceLogWithObservations } from '../db/queries/voiceLogs';
import { TEST_USER_ID } from '../db/seed';
import { recordTagUse } from '../utils/tagUsage';
import type { AssessmentScale, TagWithCategory } from '../types/database';

const DEFAULT_TIME: TimeSelection = { occurredAt: null, precision: 'exact' };

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeSelection, setTimeSelection] = useState<TimeSelection>(DEFAULT_TIME);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [pendingAssessment, setPendingAssessment] = useState<{
    observationId: string;
    tagName: string;
    scale: AssessmentScale;
  } | null>(null);

  const { child } = useChild();
  const { groupedTags, refresh } = useTags();
  const { toast, showToast, hideToast } = useToast();
  const voice = useVoiceCapture();

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
      const scale = scales[0]!;
      showToast(`${tag.name} logged`, {
        position,
        duration: 3500,
        action: {
          label: 'Rate ›',
          onClick: () => setPendingAssessment({ observationId, tagName: tag.name, scale }),
        },
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

  return (
    <div className="flex flex-col h-full bg-white">
      <AppHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Filter tags..."
        showHome={false}
      />
      <ChildSelector />
      <div className="flex-1 overflow-y-auto pb-[100px]">
        <MicButton
          onPress={voice.state === 'recording' ? voice.stopRecording : voice.startRecording}
          state={voice.state}
          durationSeconds={voice.durationSeconds}
        />
        <TimeOffsetPicker value={timeSelection} onChange={setTimeSelection} />
        <QuickTagGrid
          groups={groupedTags}
          onTagPress={handleTagPress}
          searchQuery={searchQuery}
          onCreateTag={() => setShowCreateTag(true)}
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
      {pendingAssessment && (
        <AssessmentSheet
          visible={true}
          observationId={pendingAssessment.observationId}
          tagName={pendingAssessment.tagName}
          scale={pendingAssessment.scale}
          onClose={() => setPendingAssessment(null)}
        />
      )}
    </div>
  );
}
