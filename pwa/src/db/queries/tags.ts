import { db } from '../database';
import type { TagWithCategory } from '../../types/database';

export async function getEnabledTagsForChild(childId: string): Promise<TagWithCategory[]> {
  const childTags = await db.child_tags
    .where('child_id')
    .equals(childId)
    .filter((ct) => ct.is_enabled === 1)
    .toArray();

  const tagIds = childTags.map((ct) => ct.tag_id);
  const tags = await db.tag_definitions.bulkGet(tagIds);

  const result: TagWithCategory[] = [];
  for (const ct of childTags) {
    const tag = tags.find((t) => t?.id === ct.tag_id);
    if (tag && tag.is_deleted === 0) {
      result.push({ ...tag, is_enabled: ct.is_enabled });
    }
  }

  // Sort by category, then display_order, then name
  result.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    if (a.display_order !== b.display_order) return a.display_order - b.display_order;
    return a.name.localeCompare(b.name);
  });

  return result;
}

export interface GroupedTags {
  category: string;
  color: string;
  tags: TagWithCategory[];
}

export function groupTagsByCategory(tags: TagWithCategory[]): GroupedTags[] {
  const grouped = new Map<string, TagWithCategory[]>();
  for (const tag of tags) {
    const existing = grouped.get(tag.category) ?? [];
    existing.push(tag);
    grouped.set(tag.category, existing);
  }

  return Array.from(grouped.entries()).map(([category, categoryTags]) => ({
    category,
    color: categoryTags[0]?.color ?? '#6B7280',
    tags: categoryTags,
  }));
}
