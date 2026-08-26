import React, { createContext, useContext, useRef } from 'react';

const DataCacheContext = createContext(null);

export function DataCacheProvider({ children }) {
  // Store cached responses in memory keyed by query/endpoint signature
  const cacheRef = useRef(new Map());

  const getCachedData = (key) => {
    return cacheRef.current.get(key) || null;
  };

  const setCachedData = (key, data) => {
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
    });
  };

  return (
    <DataCacheContext.Provider value={{ getCachedData, setCachedData }}>
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache() {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error('useDataCache must be used within a DataCacheProvider');
  }
  return context;
}