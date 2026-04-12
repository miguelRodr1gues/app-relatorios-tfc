import { REPORTS, TABLES } from '../data/mockData';
import { Download, Copy, Trash2, ExternalLink } from 'lucide-react';
import { useMemo } from 'react';

const categoryStyles: Record<string, string> = {
  Vendas: 'bg-[#d1fae5] text-[#065f46]',
  Clientes: 'bg-[#dbeafe] text-[#1e40af]',
  Produtos: 'bg-[#e0e7ff] text-[#4338ca]',
  Operacional: 'bg-[#fef3c7] text-[#92400e]',
};

interface ReportsTableProps {
  searchQuery?: string;
}

export default function ReportsTable({ searchQuery = '' }: ReportsTableProps) {
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return REPORTS;

    const query = searchQuery.toLowerCase();
    return REPORTS.filter(report =>
      report.name.toLowerCase().includes(query) ||
      report.category.toLowerCase().includes(query) ||
      TABLES.find(t => t.key === report.table)?.name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <div className="bg-white dark:bg-[#2a2a2a] rounded-[20px] shadow-sm border border-[#f3f4f6] dark:border-[#3a3a3a] hover:shadow-md transition-all animate-[fadeUp_0.4s_ease_both]">
      {/* Table */}
      <div className="overflow-x-auto">
        {filteredReports.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-[14px] text-[#9ca3af] dark:text-[#6b7280]">
              Nenhum relatório encontrado para "{searchQuery}"
            </div>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#6b7280] text-left"></th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#6b7280] text-left">Nome</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#6b7280] text-left">Tabela</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#6b7280] text-left">Registos</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#6b7280] text-left">Data</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#6b7280] text-left"></th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report, index) => (
                <tr
                  key={report.id}
                  className="group cursor-pointer hover:bg-[#f9fafb] dark:hover:bg-[#3a3a3a] transition-all animate-[fadeUp_0.4s_ease_both]"
                  style={{ animationDelay: `${index * 0.04}s` }}
                >
                  <td className="px-6 py-4 border-t border-[#f3f4f6] dark:border-[#3a3a3a]">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] dark:from-[#1b4332] dark:to-[#2d6a4f] flex items-center justify-center text-[18px]">
                      {report.emoji}
                    </div>
                  </td>
                  <td className="px-6 py-4 border-t border-[#f3f4f6] dark:border-[#3a3a3a]">
                    <div className="font-semibold text-[14px] text-[#1f2937] dark:text-white">{report.name}</div>
                  </td>
                  <td className="px-6 py-4 border-t border-[#f3f4f6] dark:border-[#3a3a3a]">
                    <div className="text-[13px] text-[#6b7280] dark:text-[#9ca3af]">
                      {TABLES.find(t => t.key === report.table)?.name || report.table}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-[#1f2937] dark:text-white font-medium border-t border-[#f3f4f6] dark:border-[#3a3a3a]">
                    {report.rows.toLocaleString('pt-PT')}
                  </td>
                  <td className="px-6 py-4 border-t border-[#f3f4f6] dark:border-[#3a3a3a]">
                    <div className="text-[13px] text-[#9ca3af] dark:text-[#6b7280]">{report.date}</div>
                  </td>
                  <td className="px-6 py-4 border-t border-[#f3f4f6] dark:border-[#3a3a3a]">
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-8 h-8 rounded-full border border-[#e5e7eb] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] flex items-center justify-center cursor-pointer transition-all hover:bg-[#f9fafb] dark:hover:bg-[#2a2a2a] hover:border-[#2d6a4f] hover:text-[#2d6a4f]"
                              title="Abrir">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button className="w-8 h-8 rounded-full border border-[#e5e7eb] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] flex items-center justify-center cursor-pointer transition-all hover:bg-[#f9fafb] dark:hover:bg-[#2a2a2a] hover:border-[#2d6a4f] hover:text-[#2d6a4f]"
                              title="Download">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button className="w-8 h-8 rounded-full border border-[#e5e7eb] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] flex items-center justify-center cursor-pointer transition-all hover:bg-[#f9fafb] dark:hover:bg-[#2a2a2a] hover:border-[#2d6a4f] hover:text-[#2d6a4f]"
                              title="Copiar">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button className="w-8 h-8 rounded-full border border-[#e5e7eb] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] flex items-center justify-center cursor-pointer transition-all hover:bg-[#fef2f2] dark:hover:bg-[#3a1a1a] hover:border-[#ef4444] hover:text-[#ef4444]"
                              title="Eliminar">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}