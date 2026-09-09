import { useCallback, useEffect, useState } from 'react';
import { useChild } from './useChild';
import {
  getFocusAreasByChild,
  insertFocusArea,
  updateFocusArea,
  updateFocusAreaStatus,
  softDeleteFocusArea,
} from '../db/queries/focusAreas';
import { TEST_USER_ID } from '../db/seed';
import type { FocusArea } from '../types/database';

const STATUS_ORDER: Record<FocusArea['status'], number> = { active: 0, paused: 1, completed: 2 };

export function useFocusAreas() {
  const { child } = useChild();
  const [areas, setAreas] = useState<FocusArea[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!child) return;
    setLoading(true);
    const data = await getFocusAreasByChild(child.id);
    data.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
    setAreas(data);
    setLoading(false);
  }, [child?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (
      title: string,
      description: string | null,
      relatedCategories: string[],
      questions: string[]
    ) => {
      if (!child) return;
      await insertFocusArea({
        child_id: child.id,
        created_by: TEST_USER_ID,
        title,
        description,
        status: 'active',
        related_tag_ids: null,
        related_categories: relatedCategories.length > 0 ? JSON.stringify(relatedCategories) : null,
        questions:
          questions.length > 0 ? JSON.stringify(questions) : null,
      });
      await refresh();
    },
    [child?.id, refresh]
  );

  const update = useCallback(
    async (
      id: string,
      title: string,
      description: string | null,
      relatedCategories: string[],
      questions: string[],
      status: FocusArea['status']
    ) => {
      await updateFocusArea(id, {
        title,
        description,
        status,
        related_categories:
          relatedCategories.length > 0 ? JSON.stringify(relatedCategories) : null,
        questions: questions.length > 0 ? JSON.stringify(questions) : null,
      });
      await refresh();
    },
    [refresh]
  );

  const changeStatus = useCallback(
    async (id: string, status: FocusArea['status']) => {
      await updateFocusAreaStatus(id, status);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await softDeleteFocusArea(id);
      await refresh();
    },
    [refresh]
  );

  return { areas, loading, refresh, create, update, changeStatus, remove };
}
