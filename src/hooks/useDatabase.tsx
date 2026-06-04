import React, { createContext, useContext, useEffect, useState } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from '../db/database';

interface DatabaseContextValue {
  db: SQLiteDatabase | null;
  isReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  isReady: false,
});

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    getDatabase().then((database) => {
      setDb(database);
      setIsReady(true);
    });
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, isReady }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): SQLiteDatabase {
  const { db } = useContext(DatabaseContext);
  if (!db) throw new Error('Database not initialized. Wrap your app in <DatabaseProvider>.');
  return db;
}

export function useDatabaseReady(): boolean {
  return useContext(DatabaseContext).isReady;
}
