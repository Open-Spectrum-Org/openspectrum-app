import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Child } from '../types/database';
import {
  getChildrenForFamily,
  addChild as dbAddChild,
  updateChild as dbUpdateChild,
} from '../db/queries/children';
import { useDatabaseReady } from './useDatabase';
import { TEST_FAMILY_ID } from '../db/seed';

interface ChildContextValue {
  child: Child | null;
  children: Child[];
  isLoaded: boolean;
  setActiveChild: (child: Child) => void;
  addChild: (name: string, birthYearMonth?: string, notes?: string) => Promise<Child>;
  updateChild: (id: string, updates: Partial<Pick<Child, 'display_name' | 'birth_year_month' | 'profile_notes'>>) => Promise<void>;
}

const ChildContext = createContext<ChildContextValue>({
  child: null,
  children: [],
  isLoaded: false,
  setActiveChild: () => {},
  addChild: async () => { throw new Error('ChildProvider not ready'); },
  updateChild: async () => {},
});

export function ChildProvider({ children: reactChildren }: { children: React.ReactNode }) {
  const isReady = useDatabaseReady();
  const [childList, setChildList] = useState<Child[]>([]);
  const [activeChild, setActiveChild] = useState<Child | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const kids = await getChildrenForFamily(TEST_FAMILY_ID);
    setChildList(kids);
    setIsLoaded(true);
    setActiveChild((prev) => {
      if (!prev) return kids[0] ?? null;
      const updated = kids.find((k) => k.id === prev.id);
      return updated ?? kids[0] ?? null;
    });
  }, []);

  useEffect(() => {
    if (!isReady) return;
    refresh();
  }, [isReady, refresh]);

  const addChild = useCallback(async (
    name: string,
    birthYearMonth?: string,
    notes?: string
  ): Promise<Child> => {
    const child = await dbAddChild(TEST_FAMILY_ID, name, birthYearMonth, notes);
    await refresh();
    return child;
  }, [refresh]);

  const updateChild = useCallback(async (
    id: string,
    updates: Partial<Pick<Child, 'display_name' | 'birth_year_month' | 'profile_notes'>>
  ): Promise<void> => {
    await dbUpdateChild(id, updates);
    await refresh();
  }, [refresh]);

  return (
    <ChildContext.Provider value={{ child: activeChild, children: childList, isLoaded, setActiveChild, addChild, updateChild }}>
      {reactChildren}
    </ChildContext.Provider>
  );
}

export function useChild(): ChildContextValue {
  return useContext(ChildContext);
}
