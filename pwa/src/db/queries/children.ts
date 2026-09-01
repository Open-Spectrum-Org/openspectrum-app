import { db } from '../database';
import { generateUUID } from '../../utils/uuid';
import { nowISO } from '../../utils/date';
import type { Child } from '../../types/database';

export async function getChildrenForFamily(familyId: string): Promise<Child[]> {
  return db.children
    .where('family_id')
    .equals(familyId)
    .filter((c) => c.is_deleted === 0)
    .sortBy('display_name');
}

export async function getChildById(childId: string): Promise<Child | undefined> {
  const child = await db.children.get(childId);
  if (child && child.is_deleted === 0) return child;
  return undefined;
}

export async function addChild(
  familyId: string,
  displayName: string,
  birthYearMonth?: string,
  notes?: string
): Promise<Child> {
  const now = nowISO();
  const child: Child = {
    id: generateUUID(),
    family_id: familyId,
    display_name: displayName.trim(),
    birth_year_month: birthYearMonth || null,
    avatar_url: null,
    profile_notes: notes || null,
    created_at: now,
    updated_at: now,
    is_deleted: 0,
    sync_status: 'pending',
    last_synced_at: null,
    device_id: null,
    version: 1,
  };

  await db.transaction('rw', [db.children, db.child_tags, db.tag_definitions], async () => {
    await db.children.put(child);

    // Link all system tags to this patient
    const systemTags = await db.tag_definitions
      .filter((t) => t.is_system === 1 && t.is_deleted === 0)
      .toArray();

    const childTagEntries = systemTags.map((tag) => ({
      id: generateUUID(),
      child_id: child.id,
      tag_id: tag.id,
      is_enabled: 1 as const,
      display_order: tag.display_order,
    }));

    await db.child_tags.bulkPut(childTagEntries);
  });

  return child;
}

export async function updateChild(
  id: string,
  updates: Partial<Pick<Child, 'display_name' | 'birth_year_month' | 'profile_notes'>>
): Promise<void> {
  await db.children.update(id, { ...updates, updated_at: nowISO() });
}
