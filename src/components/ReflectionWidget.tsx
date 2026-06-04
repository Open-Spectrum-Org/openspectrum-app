import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography, radius } from '../theme';
import type { DailyReflection } from '../types/database';

interface ReflectionWidgetProps {
  reflection: DailyReflection | null;
  onRate: (rating: 'better_than_usual' | 'typical' | 'difficult') => void;
}

const options: { key: 'better_than_usual' | 'typical' | 'difficult'; label: string; color: string }[] = [
  { key: 'better_than_usual', label: 'Better than usual', color: colors.betterThanUsual },
  { key: 'typical', label: 'Typical', color: colors.typical },
  { key: 'difficult', label: 'Difficult', color: colors.difficult },
];

export function ReflectionWidget({ reflection, onRate }: ReflectionWidgetProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How did today feel?</Text>
      <View style={styles.row}>
        {options.map((opt) => {
          const isSelected = reflection?.rating === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onRate(opt.key)}
              style={[
                styles.button,
                { borderColor: opt.color },
                isSelected && { backgroundColor: opt.color },
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: opt.color },
                  isSelected && { color: colors.white },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.label,
    textAlign: 'center',
  },
});
