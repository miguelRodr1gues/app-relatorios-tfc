import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, ChevronDown, Trash2 } from 'lucide-react';
import { deleteReport, getReports, downloadReport, type SavedReport } from '../lib/api';
import DeleteReportConfirmModal from './DeleteReportConfirmModal';
import ExportMenu from './ExportMenu';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react';
import { useAuth } from '../context/useAuth';

// Props for the ReportsTable component
interface ReportsTableProps {
  searchQuery: string;
  onDownload?: (id: string, format: 'json' | 'csv' | 'pdf') => void;
  onDelete?: (id: string) => void;
}

const formatDateTime = (raw: string) => {
  if (!raw) return '';

  const d = new Date(raw);

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const day = d.getDate();
  const month = months[d.getMonth()];
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${hours}:${minutes}`;
};

export default function ReportsTable({ searchQuery = '', onDownload, onDelete }: ReportsTableProps) {
  const { user } = useAuth();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openExportId, setOpenExportId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Floating UI setup
  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start',
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const loadReports = useCallback(async (options: { showLoading?: boolean } = {}) => {
    if (options.showLoading !== false) {
      setLoading(true);
    }
    setErrorMessage(null);

    try {
      const remote = await getReports();
      setReports(Array.isArray(remote) ? remote : []);
    } catch {
      setReports([]);
      setErrorMessage('Nao foi possivel carregar os relatorios.');
    } finally {
      if (options.showLoading !== false) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void loadReports().finally(() => {
      if (!mounted) return;
    });
    return () => { mounted = false; };
  }, [loadReports]);

  useEffect(() => {
    const handleReportsChanged = () => {
      void loadReports({ showLoading: false });
    };

    window.addEventListener('reports:changed', handleReportsChanged);
    return () => window.removeEventListener('reports:changed', handleReportsChanged);
  }, [loadReports]);

  // Set Floating UI reference when menu opens
  useEffect(() => {
    if (!openExportId) return;

    const button = document.querySelector<HTMLButtonElement>(`button[data-export-id="${openExportId}"]`);
    if (button) {
      refs.setReference(button);
    }
  }, [openExportId, refs]);

  // Handle ESC key to close menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenExportId(null);
    };

    if (openExportId) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [openExportId]);

  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;

    const query = searchQuery.toLowerCase();

    return reports.filter(report => {
      const name = (report.name).toString().toLowerCase();
      const table = (report.table).toString().toLowerCase();

      return name.includes(query) || table.includes(query);
    });
  }, [searchQuery, reports]);

  const handleDownload = async (reportId: string, format: 'json' | 'csv' | 'pdf') => {
    setExporting(reportId);
    try {
      if (typeof onDownload === 'function') {
        onDownload(reportId, format);
        return;
      }
      await downloadReport(reportId, format);
    } finally {
      setExporting(null);
      setOpenExportId(null);
    }
  };

  const toggleExportMenu = (reportId: string) => {
    setOpenExportId(prev => prev === reportId ? null : reportId);
  };

  const handleDelete = (reportId: string) => {
    setPendingDeleteId(reportId);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setDeletingId(pendingDeleteId);
    setErrorMessage(null);
    try {
      if (typeof onDelete === 'function') {
        onDelete(pendingDeleteId);
      } else {
        await deleteReport(pendingDeleteId);
      }
      setReports(prev => prev.filter(r => r.id !== pendingDeleteId));
      setPendingDeleteId(null);
    } catch {
      setErrorMessage('Nao foi possivel eliminar o relatorio.');
    } finally {
      setDeletingId(null);
    }
  };

  const reportPendingDelete = pendingDeleteId ? reports.find(r => r.id === pendingDeleteId) : null;

  return (
    <>
      <div className="bg-white dark:bg-[#2a2a2a] rounded-[20px] shadow-sm border border-[#f3f4f6] dark:border-[#3a3a3a] hover:shadow-md transition-all animate-[fadeUp_0.4s_ease_both] overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        {errorMessage ? (
          <div className="px-6 py-4 text-[13px] text-[#b91c1c] dark:text-[#fca5a5]">{errorMessage}</div>
        ) : null}
        {filteredReports.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-16 text-center">
            {loading ? (
              <div className="text-[14px] font-medium text-[#8fa899] dark:text-[#9ca3af]">
                A carregar relatórios...
              </div>
            ) : searchQuery.trim() ? (
              <div className="max-w-[360px]">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#e8ecf0] bg-[#f8faf9] text-[#8fa899] dark:border-[#3a3a3a] dark:bg-[#1a1a1a] dark:text-[#9ca3af]">
                  <FileText className="h-7 w-7" />
                </div>
                <h3 className="text-[16px] font-bold text-[#1f2937] dark:text-white">
                  Nenhum relatório encontrado
                </h3>
                <p className="mt-2 text-[13px] leading-6 text-[#8fa899] dark:text-[#9ca3af]">
                  Não existem relatórios que correspondam à pesquisa "{searchQuery}".
                </p>
              </div>
            ) : (
              <div className="max-w-[420px]">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#e8ecf0] bg-[#f8faf9] text-[#8fa899] dark:border-[#3a3a3a] dark:bg-[#1a1a1a] dark:text-[#9ca3af]">
                  <FileText className="h-7 w-7" />
                </div>
                <h3 className="text-[18px] font-bold text-[#1f2937] dark:text-white">
                  Ainda não existem relatórios
                </h3>
                <p className="mt-2 text-[14px] leading-6 text-[#8fa899] dark:text-[#9ca3af]">
                  Clique em 'Novo Relatório' para criar o seu primeiro relatório.
                </p>
              </div>
            )}
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
              {filteredReports.map((report, index) => {
                const isOwnReport = String(report.owner ?? '') === String(user.id ?? '');

                return (
                <tr
                  key={report.id}
                  className="group cursor-pointer hover:bg-[#f9fafb] dark:hover:bg-[#3a3a3a] transition-all animate-[fadeUp_0.4s_ease_both]"
                  style={{ animationDelay: `${index * 0.04}s` }}
                >
                  <td className="px-6 py-4 border-t border-[#f3f4f6] dark:border-[#3a3a3a]">
                  </td>
                  <td className="px-6 py-4 border-t border-[#f3f4f6] dark:border-[#3a3a3a]">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-[14px] text-[#1f2937] dark:text-white">{report.name}</div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        report.is_public
                          ? 'bg-[#dcfce7] text-[#166534] dark:bg-[#14532d] dark:text-[#bbf7d0]'
                          : 'bg-[#f3f4f6] text-[#6b7280] dark:bg-[#1a1a1a] dark:text-[#9ca3af]'
                      }`}>
                        {report.is_public ? 'Público' : 'Privado'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-[#1f2937] dark:text-white font-medium border-t border-[#f3f4f6] dark:border-[#3a3a3a]">
                    {report.table}
                  </td>
                  <td className="px-6 py-4 border-t border-[#f3f4f6] dark:border-[#3a3a3a]">
                    <div className="text-[13px] text-[#1f2937] dark:text-white font-medium">
                      {(report.record_count ?? 0).toLocaleString('pt-PT')}
                    </div>
                  </td>
                  <td className="px-6 py-4 border-t border-[#f3f4f6] dark:border-[#3a3a3a]">
                    <div className="text-[13px] text-[#9ca3af] dark:text-[#6b7280]">{formatDateTime(report.created_at)}</div>
                  </td>
                  <td className="px-6 py-4 border-t border-[#f3f4f6] dark:border-[#3a3a3a]">
                    <div className="flex gap-1.5 opacity-100 transition-opacity">
                      <div className="relative">
                        <button
                            className="px-3 h-8 rounded-full border border-[#e5e7eb] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] flex items-center gap-1.5 cursor-pointer transition-all hover:bg-[#f9fafb] dark:hover:bg-[#2a2a2a] hover:border-[#2d6a4f] hover:text-[#2d6a4f] text-[12px] font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                            title="Exportar"
                            data-export-id={report.id}
                            onClick={() => toggleExportMenu(report.id)}
                            disabled={exporting === report.id}
                        >
                          <span>Exportar</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {isOwnReport && (
                        <button className="w-8 h-8 rounded-full border border-[#e5e7eb] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] flex items-center justify-center cursor-pointer transition-all hover:bg-[#fef2f2] dark:hover:bg-[#3a1a1a] hover:border-[#ef4444] hover:text-[#ef4444]"
                                title="Eliminar"
                                onClick={() => handleDelete(report.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        )}
      </div>
      </div>

      <ExportMenu
        open={Boolean(openExportId)}
        onClose={() => setOpenExportId(null)}
        onSelect={(format) => void handleDownload(openExportId!, format)}
        floatingRef={refs.setFloating}
        floatingStyles={floatingStyles}
      />

      <DeleteReportConfirmModal
        open={Boolean(reportPendingDelete)}
        reportName={reportPendingDelete?.name ?? ''}
        isDeleting={deletingId === pendingDeleteId}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
