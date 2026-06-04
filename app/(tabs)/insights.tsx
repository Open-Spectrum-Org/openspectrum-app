import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../../src/theme';

export default function InsightsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📊</Text>
      <Text style={styles.text}>Insights</Text>
      <Text style={styles.subtitle}>Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 8,
  },
  emoji: {
    fontSize: 48,
  },
  text: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
