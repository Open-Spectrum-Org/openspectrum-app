import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

interface ToastProps {
  message: string;
  visible: boolean;
  undoAction?: () => void;
  onHide: () => void;
}

export function Toast({ message, visible, undoAction, onHide }: ToastProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.toast}>
        <Text style={styles.message}>{message}</Text>
        {undoAction && (
          <Pressable
            onPress={() => {
              undoAction();
              onHide();
            }}
            style={styles.undoButton}
          >
            <Text style={styles.undoText}>Undo</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    backgroundColor: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  message: {
    ...typography.bodySmall,
    color: colors.white,
    flex: 1,
  },
  undoButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  undoText: {
    ...typography.label,
    color: colors.primary,
  },
});
