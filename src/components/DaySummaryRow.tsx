import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography, radius } from '../theme';
import type { DaySummary } from '../types/database';

interface DaySummaryRowProps {
  summary: DaySummary;
}

const badges = [
  { key: 'behavior' as const, label: 'Behavior', emoji: '⚡', color: colors.behavior },
  { key: 'emotion' as const, label: 'Emotion', emoji: '😊', color: colors.emotion },
  { key: 'food' as const, label: 'Food', emoji: '🍽️', color: colors.food },
  { key: 'medication' as const, label: 'Medication', emoji: '💊', color: colors.medication },
];

export function DaySummaryRow({ summary }: DaySummaryRowProps) {
  return (
    <View style={styles.container}>
      {badges.map((badge) => (
        <View key={badge.key} style={[styles.badge, { borderColor: badge.color }]}>
          <Text style={styles.emoji}>{badge.emoji}</Text>
          <Text style={[styles.count, { color: badge.color }]}>{summary[badge.key]}</Text>
          <Text style={styles.label}>{badge.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  badge: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  emoji: {
    fontSize: 18,
  },
  count: {
    ...typography.h3,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
