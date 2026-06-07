import React, { useMemo, useState } from "react";
import { SearchContext, SearchContextValue } from "./SearchContextCore";

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");

  const value = useMemo<SearchContextValue>(
    () => ({ searchQuery, setSearchQuery }),
    [searchQuery]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}
