import { Search } from "lucide-react";
import { useSearch } from "../context/useSearch";
import { useAuth } from "../context/useAuth";

export default function Topbar() {
  const { searchQuery, setSearchQuery } = useSearch();
  const { user } = useAuth();

  const displayName = user.name;
  const displayEmail = user.email;

  const initial = (user.name || user.email || "U")
      .trim()
      .charAt(0)
      .toUpperCase();

  return (
      <div className="bg-white dark:bg-[#2a2a2a] border-b border-[#f3f4f6] dark:border-[#3a3a3a] px-8 py-4 flex items-center justify-between">

        {/* SEARCH */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9ca3af] dark:text-[#6b7280]" />

            <input
                type="text"
                placeholder="Procurar relatórios ou tabelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f9fafb] dark:bg-[#1a1a1a] border-none rounded-full pl-11 pr-4 py-2.5 text-[14px] text-[#374151] dark:text-white placeholder:text-[#9ca3af] dark:placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20"
            />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3">

          {/* USER */}
          <div className="flex items-center gap-3 ml-3 pl-3 border-l border-[#f3f4f6] dark:border-[#3a3a3a]">

            <div className="w-11 h-11 rounded-full overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-[#f87171] to-[#ef4444] flex items-center justify-center text-white font-semibold text-[15px]">
                {initial}
              </div>
            </div>

            <div className="text-left">
              <div className="text-[14px] font-semibold text-[#1f2937] dark:text-white">
                {displayName}
              </div>

              {!!displayEmail && (
                  <div className="text-[12px] text-[#9ca3af] dark:text-[#6b7280]">
                    {displayEmail}
                  </div>
              )}
            </div>

          </div>
        </div>
      </div>
  );
}
