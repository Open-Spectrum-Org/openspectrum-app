import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography, radius } from '../theme';

interface MicButtonProps {
  onPress: () => void;
}

export function MicButton({ onPress }: MicButtonProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.icon}>🎙️</Text>
      </Pressable>
      <Text style={styles.label}>Hold to Speak</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  button: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryLight,
    borderWidth: 3,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    backgroundColor: colors.primary,
    transform: [{ scale: 0.95 }],
  },
  icon: {
    fontSize: 48,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
