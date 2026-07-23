import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography, radius, categoryColorLight } from '../theme';
import type { DaySummary } from '../types/database';

interface DaySummaryRowProps {
  summary: DaySummary;
  activeCategories?: Set<string>;
  onToggle?: (category: string) => void;
}

const badges = [
  { key: 'behavior' as const, label: 'Behavior', emoji: '⚡', color: colors.behavior },
  { key: 'emotion' as const, label: 'Emotion', emoji: '😊', color: colors.emotion },
  { key: 'food' as const, label: 'Food', emoji: '🍽️', color: colors.food },
  { key: 'medication' as const, label: 'Medication', emoji: '💊', color: colors.medication },
];

export function DaySummaryRow({ summary, activeCategories, onToggle }: DaySummaryRowProps) {
  return (
    <View style={styles.container}>
      {badges.map((badge) => {
        const isActive = activeCategories?.has(badge.key) ?? false;
        return (
          <Pressable
            key={badge.key}
            onPress={() => onToggle?.(badge.key)}
            style={[
              styles.badge,
              { borderColor: badge.color },
              isActive && {
                borderWidth: 2,
                backgroundColor: categoryColorLight(badge.key, 0.15),
              },
            ]}
          >
            <Text style={styles.emoji}>{badge.emoji}</Text>
            <Text style={[styles.count, { color: badge.color }]}>{summary[badge.key]}</Text>
            <Text style={styles.label}>{badge.label}</Text>
          </Pressable>
        );
      })}
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
