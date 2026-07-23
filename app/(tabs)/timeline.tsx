import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { AppHeader } from '../../src/components/AppHeader';
import { DateNavigator } from '../../src/components/DateNavigator';
import { DaySummaryRow } from '../../src/components/DaySummaryRow';
import { TimelineCard } from '../../src/components/TimelineCard';
import { ReflectionWidget } from '../../src/components/ReflectionWidget';
import { Toast } from '../../src/components/Toast';
import { useObservations } from '../../src/hooks/useObservations';
import { useReflection } from '../../src/hooks/useReflection';
import { useToast } from '../../src/hooks/useToast';
import { todayDateString, addDays } from '../../src/utils/date';
import { colors, spacing, typography, radius } from '../../src/theme';
import { tagMatchesQuery } from '../../src/utils/tagSynonyms';
import type { ObservationWithTags } from '../../src/types/database';

export default function TimelineScreen() {
  const router = useRouter();
  const [date, setDate] = useState(todayDateString());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const { observations, summary, refresh, deleteObservation, undoDelete } = useObservations(date);
  const { reflection, setRating } = useReflection(date);
  const { toast, showToast, hideToast } = useToast();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

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
    let filtered = observations;

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

  const renderItem = useCallback(
    ({ item }: { item: ObservationWithTags }) => (
      <TimelineCard observation={item} onDelete={handleDelete} />
    ),
    [handleDelete]
  );

  const ListHeader = (
    <>
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
    </>
  );

  const ListFooter = (
    <>
      <ReflectionWidget reflection={reflection} onRate={setRating} />
      <View style={styles.logButtonContainer}>
        <Pressable
          onPress={() => router.push('/(tabs)')}
          style={styles.logButton}
        >
          <Text style={styles.logButtonText}>Log an Event</Text>
        </Pressable>
      </View>
    </>
  );

  const ListEmpty = (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>📝</Text>
      <Text style={styles.emptyText}>
        {searchQuery || activeCategories.size > 0
          ? 'No matching entries'
          : 'No entries yet for this day'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filteredObservations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
      <Toast
        message={toast.message}
        visible={toast.visible}
        undoAction={toast.undoAction}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  list: {
    paddingBottom: spacing.xxxl,
  },
  logButtonContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  logButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  logButtonText: {
    ...typography.button,
    color: colors.white,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
