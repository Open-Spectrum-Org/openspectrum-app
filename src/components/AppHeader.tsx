import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, typography } from '../theme';

interface AppHeaderProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  placeholder?: string;
  showHome?: boolean;
  editable?: boolean;
}

export function AppHeader({
  searchQuery,
  onSearchChange,
  placeholder = 'Search...',
  showHome = true,
  editable = true,
}: AppHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {showHome && (
        <Pressable onPress={() => router.push('/(tabs)')} style={styles.homeButton}>
          <Text style={styles.homeIcon}>🏠</Text>
        </Pressable>
      )}
      <View style={[styles.searchContainer, !editable && styles.searchDisabled]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          editable={editable}
          returnKeyType="search"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && editable && (
          <Pressable onPress={() => onSearchChange('')} style={styles.clearButton}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  homeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeIcon: {
    fontSize: 18,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 36,
  },
  searchDisabled: {
    opacity: 0.5,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: 0,
  },
  clearButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
