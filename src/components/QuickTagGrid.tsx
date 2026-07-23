import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { QuickTagButton } from './QuickTagButton';
import { spacing, typography, colors } from '../theme';
import { tagMatchesQuery } from '../utils/tagSynonyms';
import type { GroupedTags } from '../db/queries/tags';
import type { TagWithCategory } from '../types/database';

interface QuickTagGridProps {
  groups: GroupedTags[];
  onTagPress: (tag: TagWithCategory, position: { x: number; y: number }) => void;
  searchQuery?: string;
}

// Show these 4 categories on the Quick Capture screen (order determines display order)
const QUICK_CAPTURE_CATEGORIES = ['behavior', 'food', 'medication', 'emotion'];

export function QuickTagGrid({ groups, onTagPress, searchQuery }: QuickTagGridProps) {
  const filteredGroups = useMemo(() => {
    const sorted = groups
      .filter((g) => QUICK_CAPTURE_CATEGORIES.includes(g.category))
      .sort((a, b) => QUICK_CAPTURE_CATEGORIES.indexOf(a.category) - QUICK_CAPTURE_CATEGORIES.indexOf(b.category));

    if (!searchQuery?.trim()) return sorted;

    return sorted
      .map((group) => ({
        ...group,
        tags: group.tags.filter((tag) => tagMatchesQuery(tag.name, searchQuery)),
      }))
      .filter((group) => group.tags.length > 0);
  }, [groups, searchQuery]);

  return (
    <View style={styles.container}>
      {filteredGroups.map((group) => (
        <View key={group.category} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: group.color }]}>
            {group.category.charAt(0).toUpperCase() + group.category.slice(1)}
          </Text>
          <View style={styles.tagRow}>
            {group.tags.map((tag) => (
              <QuickTagButton key={tag.id} tag={tag} onPress={onTagPress} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    paddingLeft: spacing.xs,
    textTransform: 'capitalize',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
