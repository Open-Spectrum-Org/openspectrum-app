import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { categoryColorLight } from '../theme/colors';
import { spacing, radius, typography } from '../theme';
import type { TagWithCategory } from '../types/database';

interface QuickTagButtonProps {
  tag: TagWithCategory;
  onPress: (tag: TagWithCategory, position: { x: number; y: number }) => void;
}

export function QuickTagButton({ tag, onPress }: QuickTagButtonProps) {
  const bgColor = categoryColorLight(tag.category, 0.15);
  const borderColor = tag.color ?? '#6B7280';

  return (
    <Pressable
      onPress={(event) => onPress(tag, { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY })}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bgColor, borderColor },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, { color: borderColor }]} numberOfLines={2}>
        {tag.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    minWidth: 80,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    flexBasis: '45%',
    flexGrow: 1,
    margin: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  label: {
    ...typography.label,
    textAlign: 'center',
  },
});
