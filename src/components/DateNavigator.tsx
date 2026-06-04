import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useChild } from '../hooks/useChild';
import { formatDateDisplay, isToday } from '../utils/date';
import { colors, spacing, typography } from '../theme';

interface DateNavigatorProps {
  date: string;
  onPrev: () => void;
  onNext: () => void;
}

export function DateNavigator({ date, onPrev, onNext }: DateNavigatorProps) {
  const { child } = useChild();
  const isTodayDate = isToday(date);
  const dateLabel = formatDateDisplay(date);
  const subtitle = child ? `${dateLabel} with ${child.display_name}` : dateLabel;

  return (
    <View style={styles.container}>
      <Pressable onPress={onPrev} style={styles.arrow}>
        <Text style={styles.arrowText}>‹</Text>
      </Pressable>
      <Text style={styles.title}>{subtitle}</Text>
      <Pressable
        onPress={onNext}
        style={[styles.arrow, isTodayDate && styles.disabled]}
        disabled={isTodayDate}
      >
        <Text style={[styles.arrowText, isTodayDate && styles.disabledText]}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  arrow: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.primary,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  disabled: {
    opacity: 0.3,
  },
  disabledText: {
    color: colors.textMuted,
  },
});
