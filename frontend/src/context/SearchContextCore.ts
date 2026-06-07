import { createContext } from "react";

export type SearchContextValue = {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
};

export const SearchContext = createContext<SearchContextValue | undefined>(undefined);
