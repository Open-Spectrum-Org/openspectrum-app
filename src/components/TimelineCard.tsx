import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryColor } from '../theme/colors';
import { colors, spacing, typography, radius } from '../theme';
import { formatTime } from '../utils/date';
import type { ObservationWithTags } from '../types/database';

interface TimelineCardProps {
  observation: ObservationWithTags;
  onDelete: (id: string) => void;
}

export function TimelineCard({ observation, onDelete }: TimelineCardProps) {
  const barColor = categoryColor(observation.category);
  const tagNames = observation.tags.map((t) => t.name).join(', ');
  const isVoice = observation.entry_type === 'voice' && observation.notes;
  const [showSummary, setShowSummary] = useState(false);

  return (
    <View style={styles.card}>
      <View style={[styles.colorBar, { backgroundColor: barColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.time}>{formatTime(observation.occurred_at)}</Text>
          <View style={styles.headerRight}>
            <Text style={[styles.category, { color: barColor }]}>
              {observation.category}
            </Text>
            <Pressable
              onPress={() => onDelete(observation.id)}
              style={styles.deleteButton}
              hitSlop={8}
            >
              <Text style={styles.deleteIcon}>✕</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.title}>
          {showSummary ? observation.notes : (observation.title ?? tagNames)}
        </Text>
        {isVoice ? (
          <Pressable onPress={() => setShowSummary((v) => !v)} style={styles.toggleBtn}>
            <Text style={styles.toggleText}>
              {showSummary ? 'Show transcript' : 'Show AI summary'}
            </Text>
          </Pressable>
        ) : (
          <>
            {observation.notes ? (
              <Text style={styles.notes} numberOfLines={2}>{observation.notes}</Text>
            ) : null}
          </>
        )}
        {tagNames && observation.title ? (
          <Text style={styles.tags}>{tagNames}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  colorBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  deleteIcon: {
    fontSize: 12,
    color: colors.textMuted,
  },
  time: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  category: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  notes: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  tags: {
    ...typography.caption,
    color: colors.textMuted,
  },
  toggleBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  toggleText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
});
