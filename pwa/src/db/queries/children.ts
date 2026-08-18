import { db } from '../database';
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
