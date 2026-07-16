import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { QuickTagButton } from './QuickTagButton';
import { spacing, typography, colors } from '../theme';
import type { GroupedTags } from '../db/queries/tags';
import type { TagWithCategory } from '../types/database';

interface QuickTagGridProps {
  groups: GroupedTags[];
  onTagPress: (tag: TagWithCategory, position: { x: number; y: number }) => void;
}

// Show these 4 categories on the Quick Capture screen (order determines display order)
const QUICK_CAPTURE_CATEGORIES = ['behavior', 'food', 'medication', 'emotion'];

export function QuickTagGrid({ groups, onTagPress }: QuickTagGridProps) {
  const filteredGroups = groups
    .filter((g) => QUICK_CAPTURE_CATEGORIES.includes(g.category))
    .sort((a, b) => QUICK_CAPTURE_CATEGORIES.indexOf(a.category) - QUICK_CAPTURE_CATEGORIES.indexOf(b.category));

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
