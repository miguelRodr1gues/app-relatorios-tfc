import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import ReportsTable from '../components/ReportsTable';
import { useWizard } from '../context/WizardContext';
import { useSearch } from '../context/SearchContext';

export default function Relatorios() {
  const { openWizard } = useWizard();
  const { searchQuery: globalSearchQuery } = useSearch();
  const [searchQuery, setSearchQuery] = useState('');

  // Use local search if it exists, otherwise use global search
  const activeSearchQuery = searchQuery || globalSearchQuery;

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 bg-[#fafafa] dark:bg-[#1a1a1a]">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-[#1f2937] dark:text-white leading-tight">Relatórios</h1>
          <p className="text-[14px] text-[#9ca3af] dark:text-[#6b7280] mt-1">
            Visualize e gerencie todos os seus relatórios criados.
          </p>
        </div>
        <button
          onClick={openWizard}
          className="flex items-center gap-2 bg-[#2d6a4f] text-white border-none rounded-full px-6 py-2.5 text-[14px] font-semibold cursor-pointer transition-all hover:bg-[#1b4332] hover:shadow-md whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Novo Relatório
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af] dark:text-[#6b7280]" />
          <input
            type="text"
            placeholder="Procurar relatórios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#2a2a2a] border border-[#e5e7eb] dark:border-[#3a3a3a] rounded-full text-[14px] text-[#1f2937] dark:text-white placeholder-[#9ca3af] dark:placeholder-[#6b7280] focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 transition-all"
          />
        </div>
      </div>

      {/* Reports Table */}
      <ReportsTable searchQuery={activeSearchQuery} />
    </div>
  );
}