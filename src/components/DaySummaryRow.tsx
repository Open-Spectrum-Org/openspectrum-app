import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography, radius } from '../theme';
import type { DaySummary } from '../types/database';

interface DaySummaryRowProps {
  summary: DaySummary;
}

const badges = [
  { key: 'sleep' as const, label: 'Sleep', emoji: '😴', color: colors.sleep },
  { key: 'meals' as const, label: 'Meals', emoji: '🍽️', color: colors.food },
  { key: 'meds' as const, label: 'Meds', emoji: '💊', color: colors.medication },
  { key: 'incidents' as const, label: 'Incidents', emoji: '⚡', color: colors.behavior },
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
