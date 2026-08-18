import { useState } from 'react';
import { AppHeader } from '../components/AppHeader';
import { ChildSelector } from '../components/ChildSelector';
import { MicButton } from '../components/MicButton';
import { QuickTagGrid } from '../components/QuickTagGrid';
import { StressFAB } from '../components/StressFAB';
import { Toast } from '../components/Toast';
import { VoiceReviewSheet } from '../components/VoiceReviewSheet';
import { useChild } from '../hooks/useChild';
import { useTags } from '../hooks/useTags';
import { useToast } from '../hooks/useToast';
import { useVoiceCapture } from '../hooks/useVoiceCapture';
import { insertQuickTapObservation } from '../db/queries/observations';
import { saveVoiceLogWithObservations } from '../db/queries/voiceLogs';
import { TEST_USER_ID } from '../db/seed';
import type { TagWithCategory } from '../types/database';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const { child } = useChild();
  const { groupedTags } = useTags();
  const { toast, showToast, hideToast } = useToast();
  const voice = useVoiceCapture();

  const handleTagPress = async (tag: TagWithCategory, position: { x: number; y: number }) => {
    if (!child) return;
    await insertQuickTapObservation(child.id, TEST_USER_ID, tag);
    showToast(`${tag.name} logged`, { position });
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
        <QuickTagGrid groups={groupedTags} onTagPress={handleTagPress} searchQuery={searchQuery} />
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
        onHide={hideToast}
        position={toast.position}
      />
    </div>
  );
}
