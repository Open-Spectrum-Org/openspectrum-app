import React from 'react';
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

  return (
    <Pressable
      onLongPress={() => onDelete(observation.id)}
      style={styles.card}
    >
      <View style={[styles.colorBar, { backgroundColor: barColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.time}>{formatTime(observation.occurred_at)}</Text>
          <Text style={[styles.category, { color: barColor }]}>
            {observation.category}
          </Text>
        </View>
        <Text style={styles.title}>{observation.title ?? tagNames}</Text>
        {observation.notes ? (
          <Text style={styles.notes} numberOfLines={2}>{observation.notes}</Text>
        ) : null}
        {tagNames && observation.title ? (
          <Text style={styles.tags}>{tagNames}</Text>
        ) : null}
      </View>
    </Pressable>
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
});
