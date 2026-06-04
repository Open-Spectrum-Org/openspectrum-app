import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useChild } from '../hooks/useChild';
import { colors, spacing, typography, radius } from '../theme';

export function ChildSelector() {
  const { child } = useChild();

  if (!child) return null;

  const initial = child.display_name.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <Text style={styles.name}>{child.display_name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.h3,
    color: colors.primary,
  },
  name: {
    ...typography.h2,
    color: colors.text,
  },
});
