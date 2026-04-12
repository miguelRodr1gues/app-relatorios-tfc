import { Plus, X, Filter, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { TABLES } from '../data/mockData';
import { useMemo, useState } from 'react';
import TableCard from './TableCard';

interface TablesGridProps {
  onNewQuery: () => void;
  searchQuery?: string;
}

// Mock data generator for table rows
const generateMockData = (table: typeof TABLES[0], rowCount: number = 100) => {
  const data = [];
  for (let i = 0; i < rowCount; i++) {
    const row: Record<string, any> = {};
    table.columns.forEach(col => {
      switch (String(col.type)) {
        case 'INT':
        case 'number':
          row[col.n] = Math.floor(Math.random() * 10000) + 1;
          break;
        case 'STR':
        case 'text':
          row[col.n] = `${col.label} ${i + 1}`;
          break;
        case 'DATE':
        case 'date':
          row[col.n] = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString('pt-PT');
          break;
        case 'DEC':
          row[col.n] = (Math.random() * 1000).toFixed(2) + '€';
          break;
        case 'ENUM':
          row[col.n] = ['Ativo', 'Pendente', 'Concluído', 'Cancelado'][Math.floor(Math.random() * 4)];
          break;
        case 'BOOL':
          row[col.n] = Math.random() > 0.5 ? 'Sim' : 'Não';
          break;
        default:
          row[col.n] = '-';
      }
    });
    data.push(row);
  }
  return data;
};

const ITEMS_PER_PAGE = 20;

export default function TablesGrid({ onNewQuery, searchQuery = '' }: TablesGridProps) {
  const [selectedTable, setSelectedTable] = useState<typeof TABLES[0] | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [searchFilter, setSearchFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return TABLES;
    
    const query = searchQuery.toLowerCase();
    return TABLES.filter(table => 
      table.name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const allMockData = useMemo(() => {
    if (!selectedTable) return [];
    return generateMockData(selectedTable, 100);
  }, [selectedTable]);

  const filteredData = useMemo(() => {
    let data = allMockData;

    // Apply search filter
    if (searchFilter.trim()) {
      const query = searchFilter.toLowerCase();
      data = data.filter(row => 
        Object.values(row).some(value => 
          String(value).toLowerCase().includes(query)
        )
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([column, filterValue]) => {
      if (filterValue.trim()) {
        data = data.filter(row => 
          String(row[column]).toLowerCase().includes(filterValue.toLowerCase())
        );
      }
    });

    return data;
  }, [allMockData, searchFilter, filters]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchFilter, filters]);

  const handleFilterChange = (column: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchFilter.trim() !== '' || Object.values(filters).some(v => v.trim() !== '');

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <div className="bg-white dark:bg-[#2a2a2a] rounded-[20px] shadow-sm border border-[#f3f4f6] dark:border-[#3a3a3a] p-6 hover:shadow-md transition-all animate-[fadeUp_0.4s_ease_both]">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[17px] font-semibold text-[#1f2937] dark:text-white">
            Tabelas Alteradas Recentemente
            {searchQuery && (
              <span className="ml-2 text-[13px] font-normal text-[#9ca3af] dark:text-[#6b7280]">
                ({filteredTables.length} encontrada{filteredTables.length !== 1 ? 's' : ''})
              </span>
            )}
          </h3>
          <button
            onClick={onNewQuery}
            className="text-[13px] font-medium text-[#6b7280] dark:text-[#9ca3af] px-4 py-2 rounded-full border border-[#e5e7eb] dark:border-[#3a3a3a] transition-all hover:bg-[#f9fafb] dark:hover:bg-[#3a3a3a] hover:text-[#374151] dark:hover:text-white flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Query
          </button>
        </div>

        {/* Grid */}
        {filteredTables.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-[14px] text-[#9ca3af] dark:text-[#6b7280]">
              Nenhuma tabela encontrada para "{searchQuery}"
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {filteredTables.map((table, index) => (
              <TableCard
                key={table.key}
                table={table}
                onClick={() => setSelectedTable(table)}
                style={{ animationDelay: `${index * 0.05}s` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Table Data Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8" onClick={() => setSelectedTable(null)}>
          <div className="bg-white dark:bg-[#2a2a2a] rounded-[24px] shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#f3f4f6] dark:border-[#3a3a3a]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] dark:from-[#1b4332] dark:to-[#2d6a4f] flex items-center justify-center text-[24px]">
                  {selectedTable.emoji}
                </div>
                <div>
                  <h2 className="text-[24px] font-bold text-[#1f2937] dark:text-white">{selectedTable.name}</h2>
                  <p className="text-[13px] text-[#9ca3af] dark:text-[#6b7280]">
                    {selectedTable.rows.toLocaleString('pt-PT')} registos · {selectedTable.cols} colunas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedTable(null);
                    onNewQuery();
                  }}
                  className="flex items-center gap-2 bg-[#2d6a4f] text-white border-none rounded-full px-5 py-2.5 text-[14px] font-semibold cursor-pointer transition-all hover:bg-[#1b4332] hover:shadow-md"
                >
                  <FileText className="w-4 h-4" />
                  Criar Relatório
                </button>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="w-10 h-10 rounded-full text-[#9ca3af] dark:text-[#6b7280] hover:text-[#1f2937] dark:hover:text-white hover:bg-[#f9fafb] dark:hover:bg-[#3a3a3a] transition-all flex items-center justify-center"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Filters Section */}
            <div className="border-b border-[#f3f4f6] dark:border-[#3a3a3a] p-6 bg-[#fafbfc] dark:bg-[#1a1a1a]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-medium transition-all ${
                      showFilters
                        ? 'bg-[#2d6a4f] text-white'
                        : 'bg-white dark:bg-[#2a2a2a] text-[#6b7280] dark:text-[#9ca3af] border border-[#e5e7eb] dark:border-[#3a3a3a] hover:bg-[#f9fafb] dark:hover:bg-[#3a3a3a]'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    Filtros
                    {hasActiveFilters && !showFilters && (
                      <span className="w-2 h-2 bg-[#2d6a4f] rounded-full"></span>
                    )}
                  </button>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-[13px] text-[#dc2626] hover:text-[#b91c1c] font-medium transition-colors"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              </div>

              {/* Global Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Pesquisar em todos os campos..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-[#2a2a2a] border border-[#e5e7eb] dark:border-[#3a3a3a] rounded-full text-[14px] text-[#1f2937] dark:text-white placeholder-[#9ca3af] dark:placeholder-[#6b7280] focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 transition-all"
                />
              </div>

              {/* Column Filters */}
              {showFilters && (
                <div className="grid grid-cols-4 gap-3 animate-[fadeUp_0.3s_ease_both]">
                  {selectedTable.columns.map((col) => (
                    <div key={col.n}>
                      <label className="block text-[11px] font-semibold text-[#9ca3af] dark:text-[#6b7280] uppercase tracking-wider mb-1.5">
                        {col.label}
                      </label>
                      <input
                        type="text"
                        placeholder={`Filtrar ${col.label.toLowerCase()}...`}
                        value={filters[col.n] || ''}
                        onChange={(e) => handleFilterChange(col.n, e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-[#2a2a2a] border border-[#e5e7eb] dark:border-[#3a3a3a] rounded-lg text-[13px] text-[#1f2937] dark:text-white placeholder-[#9ca3af] dark:placeholder-[#6b7280] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20 transition-all"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Content - Table Data */}
            <div className="flex-1 overflow-auto p-6">
              {filteredData.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="text-[14px] text-[#9ca3af] dark:text-[#6b7280] mb-2">
                    Nenhum registo encontrado com os filtros aplicados
                  </div>
                  <button
                    onClick={clearFilters}
                    className="text-[13px] text-[#2d6a4f] hover:text-[#1b4332] font-medium transition-colors"
                  >
                    Limpar filtros
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-[#f9fafb] dark:bg-[#1a1a1a] z-10">
                      <tr>
                        {selectedTable.columns.map((col) => (
                          <th
                            key={col.n}
                            className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#6b7280] text-left border-b border-[#e5e7eb] dark:border-[#3a3a3a]"
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentData.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className="hover:bg-[#f9fafb] dark:hover:bg-[#1a1a1a] transition-colors border-b border-[#f3f4f6] dark:border-[#3a3a3a]"
                        >
                          {selectedTable.columns.map((col) => (
                            <td
                              key={col.n}
                              className="px-4 py-3 text-[13px] text-[#1f2937] dark:text-[#9ca3af] whitespace-nowrap"
                            >
                              {row[col.n]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#f3f4f6] dark:border-[#3a3a3a] flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="text-[13px] font-semibold text-[#1f2937] dark:text-white">
                  Total: {selectedTable.rows.toLocaleString('pt-PT')} registos
                </div>
                <div className="text-[13px] text-[#9ca3af] dark:text-[#6b7280]">
                  |
                </div>
                <div className="text-[13px] text-[#9ca3af] dark:text-[#6b7280]">
                  Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} de {filteredData.length}
                  {hasActiveFilters && ' (filtrado)'}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-medium transition-all ${
                    currentPage === 1
                      ? 'bg-[#f9fafb] dark:bg-[#1a1a1a] text-[#d1d5db] dark:text-[#4b5563] cursor-not-allowed'
                      : 'bg-white dark:bg-[#2a2a2a] text-[#6b7280] dark:text-[#9ca3af] border border-[#e5e7eb] dark:border-[#3a3a3a] hover:bg-[#f9fafb] dark:hover:bg-[#3a3a3a] hover:text-[#374151] dark:hover:text-white'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
                <div className="px-4 py-2 bg-[#f9fafb] dark:bg-[#1a1a1a] rounded-full text-[13px] font-medium text-[#1f2937] dark:text-white">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || filteredData.length === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-medium transition-all ${
                    currentPage === totalPages || filteredData.length === 0
                      ? 'bg-[#f9fafb] dark:bg-[#1a1a1a] text-[#d1d5db] dark:text-[#4b5563] cursor-not-allowed'
                      : 'bg-[#2d6a4f] text-white hover:bg-[#1b4332] hover:shadow-md'
                  }`}
                >
                  Próximos 20
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => setSelectedTable(null)}
                className="px-6 py-2.5 bg-white dark:bg-[#2a2a2a] text-[#6b7280] dark:text-[#9ca3af] border border-[#e5e7eb] dark:border-[#3a3a3a] rounded-full text-[14px] font-semibold hover:bg-[#f9fafb] dark:hover:bg-[#3a3a3a] transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}