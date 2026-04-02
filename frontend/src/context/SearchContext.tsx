import React, { createContext, useContext, useMemo, useState } from "react";

type SearchContextValue = {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
};

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");

  const value = useMemo<SearchContextValue>(
    () => ({ searchQuery, setSearchQuery }),
    [searchQuery]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}
