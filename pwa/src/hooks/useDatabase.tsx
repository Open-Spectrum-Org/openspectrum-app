import React, { createContext, useContext, useEffect, useState } from 'react';
import { initDatabase } from '../db/database';

interface DatabaseContextValue {
  isReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  isReady: false,
});

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initDatabase().then(() => setIsReady(true));
  }, []);

  return (
    <DatabaseContext.Provider value={{ isReady }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabaseReady(): boolean {
  return useContext(DatabaseContext).isReady;
}
