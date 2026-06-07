import { useContext } from "react";
import { SearchContext } from "./SearchContextCore";

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}
