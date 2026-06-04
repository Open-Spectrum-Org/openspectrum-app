import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme';

export function StressFAB() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/incident')}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
    >
      <Text style={styles.icon}>🚨</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 100,
  },
  pressed: {
    backgroundColor: '#DC2626',
    transform: [{ scale: 0.95 }],
  },
  icon: {
    fontSize: 28,
  },
});
