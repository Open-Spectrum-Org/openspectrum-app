import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { categoryColorLight } from '../theme/colors';
import { spacing, radius, typography } from '../theme';
import type { TagWithCategory } from '../types/database';

const COOLDOWN_MS = 2000;

interface QuickTagButtonProps {
  tag: TagWithCategory;
  onPress: (tag: TagWithCategory, position: { x: number; y: number }) => void;
}

export function QuickTagButton({ tag, onPress }: QuickTagButtonProps) {
  const bgColor = categoryColorLight(tag.category, 0.15);
  const borderColor = tag.color ?? '#6B7280';
  const [cooldown, setCooldown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handlePress = useCallback(
    (event: { nativeEvent: { pageX: number; pageY: number } }) => {
      if (cooldown) return;
      onPress(tag, { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY });
      setCooldown(true);
      timerRef.current = setTimeout(() => setCooldown(false), COOLDOWN_MS);
    },
    [cooldown, onPress, tag]
  );

  return (
    <Pressable
      onPress={handlePress}
      disabled={cooldown}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bgColor, borderColor },
        pressed && styles.pressed,
        cooldown && styles.cooldown,
      ]}
    >
      <Text style={[styles.label, { color: borderColor }]} numberOfLines={2}>
        {cooldown ? '✓' : tag.name}
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
  cooldown: {
    opacity: 0.5,
  },
  label: {
    ...typography.label,
    textAlign: 'center',
  },
});
