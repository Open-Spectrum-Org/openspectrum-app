import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Child } from '../types/database';
import { getChildrenForFamily } from '../db/queries/children';
import { useDatabaseReady } from './useDatabase';
import { TEST_FAMILY_ID } from '../db/seed';

interface ChildContextValue {
  child: Child | null;
  children: Child[];
  setActiveChild: (child: Child) => void;
}

const ChildContext = createContext<ChildContextValue>({
  child: null,
  children: [],
  setActiveChild: () => {},
});

export function ChildProvider({ children: reactChildren }: { children: React.ReactNode }) {
  const isReady = useDatabaseReady();
  const [childList, setChildList] = useState<Child[]>([]);
  const [activeChild, setActiveChild] = useState<Child | null>(null);

  useEffect(() => {
    if (!isReady) return;
    getChildrenForFamily(TEST_FAMILY_ID).then((kids) => {
      setChildList(kids);
      if (kids.length > 0 && !activeChild) {
        setActiveChild(kids[0]!);
      }
    });
  }, [isReady]);

  return (
    <ChildContext.Provider value={{ child: activeChild, children: childList, setActiveChild }}>
      {reactChildren}
    </ChildContext.Provider>
  );
}

export function useChild(): ChildContextValue {
  return useContext(ChildContext);
}
