import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChildSelector } from '../../src/components/ChildSelector';
import { MicButton } from '../../src/components/MicButton';
import { QuickTagGrid } from '../../src/components/QuickTagGrid';
import { StressFAB } from '../../src/components/StressFAB';
import { Toast } from '../../src/components/Toast';
import { useDatabase } from '../../src/hooks/useDatabase';
import { useChild } from '../../src/hooks/useChild';
import { useTags } from '../../src/hooks/useTags';
import { useToast } from '../../src/hooks/useToast';
import { insertQuickTapObservation } from '../../src/db/queries/observations';
import { TEST_USER_ID } from '../../src/db/seed';
import { colors } from '../../src/theme';
import type { TagWithCategory } from '../../src/types/database';

export default function QuickCaptureScreen() {
  const db = useDatabase();
  const { child } = useChild();
  const { groupedTags } = useTags();
  const { toast, showToast, hideToast } = useToast();

  const handleTagPress = async (tag: TagWithCategory) => {
    if (!child) return;
    await insertQuickTapObservation(db, child.id, TEST_USER_ID, tag);
    showToast(`${tag.name} logged`);
  };

  const handleMicPress = () => {
    showToast('Voice capture coming soon');
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
          <MicButton onPress={handleMicPress} />
          <QuickTagGrid groups={groupedTags} onTagPress={handleTagPress} />
        </ScrollView>
        <StressFAB />
      </View>
      <Toast
        message={toast.message}
        visible={toast.visible}
        onHide={hideToast}
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
