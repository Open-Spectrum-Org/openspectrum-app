import { useCallback, useMemo, useState } from 'react';
import { generateContextualPrompts, type ContextualPrompt } from '../utils/insights';

/**
 * Generates time-of-day and pattern-based contextual prompts for the Home page.
 * Runs synchronously in useMemo — no DB calls, no loading state.
 *
 * @param topCategory  Most frequently logged category (pass null if unknown)
 * @param hasReflectionToday  Whether a daily reflection has been saved today
 */
export function useContextualPrompts(
  topCategory: string | null,
  hasReflectionToday: boolean
) {
  const [dismissed, setDismissed] = useState(false);

  const prompts = useMemo<ContextualPrompt[]>(() => {
    if (dismissed) return [];
    return generateContextualPrompts({
      hourOfDay: new Date().getHours(),
      topCategory,
      hasReflectionToday,
      recentMeltdownCount: 0,
    });
  }, [dismissed, topCategory, hasReflectionToday]);

  const dismiss = useCallback(() => setDismissed(true), []);

  return { prompts, dismiss };
}
