import type { SQLiteDatabase } from 'expo-sqlite';
import type { TagWithCategory } from '../../types/database';

export async function getEnabledTagsForChild(
  db: SQLiteDatabase,
  childId: string
): Promise<TagWithCategory[]> {
  return db.getAllAsync<TagWithCategory>(
    `SELECT td.*, ct.is_enabled
     FROM tag_definitions td
     JOIN child_tags ct ON ct.tag_id = td.id
     WHERE ct.child_id = ? AND ct.is_enabled = 1 AND td.is_deleted = 0
     ORDER BY td.category, ct.display_order, td.name`,
    [childId]
  );
}

export interface GroupedTags {
  category: string;
  color: string;
  tags: TagWithCategory[];
}

export function groupTagsByCategory(tags: TagWithCategory[]): GroupedTags[] {
  const grouped = new Map<string, TagWithCategory[]>();
  for (const tag of tags) {
    const existing = grouped.get(tag.category) || [];
    existing.push(tag);
    grouped.set(tag.category, existing);
  }

  return Array.from(grouped.entries()).map(([category, categoryTags]) => ({
    category,
    color: categoryTags[0]?.color ?? '#6B7280',
    tags: categoryTags,
  }));
}
