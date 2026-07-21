import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChildSelector } from '../../src/components/ChildSelector';
import { MicButton } from '../../src/components/MicButton';
import { QuickTagGrid } from '../../src/components/QuickTagGrid';
import { StressFAB } from '../../src/components/StressFAB';
import { Toast } from '../../src/components/Toast';
import { VoiceReviewSheet } from '../../src/components/VoiceReviewSheet';
import { useDatabase } from '../../src/hooks/useDatabase';
import { useChild } from '../../src/hooks/useChild';
import { useTags } from '../../src/hooks/useTags';
import { useToast } from '../../src/hooks/useToast';
import { useVoiceCapture } from '../../src/hooks/useVoiceCapture';
import { insertQuickTapObservation } from '../../src/db/queries/observations';
import { saveVoiceLogWithObservations } from '../../src/db/queries/voiceLogs';
import { TEST_USER_ID } from '../../src/db/seed';
import { colors } from '../../src/theme';
import type { TagWithCategory } from '../../src/types/database';

export default function QuickCaptureScreen() {
  const db = useDatabase();
  const { child } = useChild();
  const { groupedTags } = useTags();
  const { toast, showToast, hideToast } = useToast();
  const voice = useVoiceCapture();

  const handleTagPress = async (tag: TagWithCategory, position: { x: number; y: number }) => {
    if (!child) return;
    await insertQuickTapObservation(db, child.id, TEST_USER_ID, tag);
    showToast(`${tag.name} logged`, { position });
  };

  const handleVoiceConfirm = async () => {
    if (!child || !voice.parsedResult) return;
    const confirmed = voice.parsedResult.suggestedObservations.filter((o) => o.confirmed);
    if (confirmed.length === 0) return;

    try {
      await saveVoiceLogWithObservations(
        db,
        child.id,
        TEST_USER_ID,
        voice.editedTranscript || voice.transcript,
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <ChildSelector />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <MicButton
            onPressIn={voice.startRecording}
            onPressOut={voice.stopRecording}
            state={voice.state}
            durationSeconds={voice.durationSeconds}
          />
          <QuickTagGrid groups={groupedTags} onTagPress={handleTagPress} />
        </ScrollView>
        <StressFAB />
      </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
});
