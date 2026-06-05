import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Copy, ExternalLink, Trash2 } from 'lucide-react';
import { deleteReport, getReports, downloadReport, type SavedReport } from '../lib/api';
import DeleteReportConfirmModal from './DeleteReportConfirmModal';
import ExportMenu from './ExportMenu';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react';

interface ReportsTableProps {
  searchQuery?: string;
  onOpen?: (id: string) => void;
  onDownload?: (id: string, format?: 'json' | 'csv' | 'pdf') => void;
  onCopy?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const formatDateTime = (raw?: string) => {
  if (!raw) return '';

  const d = new Date(raw);

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const day = d.getDate();
  const month = months[d.getMonth()];
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${hours}:${minutes}`;
};

export default function ReportsTable({ searchQuery = '', onOpen, onDownload, onCopy, onDelete }: ReportsTableProps) {
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

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const remote = await getReports();
        if (mounted) {
          setReports(Array.isArray(remote) ? remote : []);
        }
      } catch {
        if (mounted) {
          setReports([]);
          setErrorMessage('Nao foi possivel carregar os relatorios.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, []);

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

  // Default handlers (will be used if corresponding props are not provided)
  const handleOpen = (id: string) => {
    const url = `/reports/${id}`;
    window.open(url, '_blank');
  };

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

  const handleCopy = async (reportId: string) => {
    const url = `${window.location.origin}/reports/${reportId}`;
    try {
      await navigator.clipboard.writeText(url);
      // Could display a toast here; fallback is silent
    } catch {
      // ignore copy errors
    }
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
          <div className="px-6 py-12 text-center">
            <div className="text-[14px] text-[#9ca3af] dark:text-[#6b7280]">
              {loading ? 'A carregar relatórios...' : `Nenhum relatório encontrado para "${searchQuery}"`}
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
                  </td>
                  <td className="px-6 py-4 border-t border-[#f3f4f6] dark:border-[#3a3a3a]">
                    <div className="font-semibold text-[14px] text-[#1f2937] dark:text-white">{report.name}</div>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-[#1f2937] dark:text-white font-medium border-t border-[#f3f4f6] dark:border-[#3a3a3a]">
                    {report.table}
                  </td>
                  <td className="px-6 py-4 border-t border-[#f3f4f6] dark:border-[#3a3a3a]">
                    <div className="text-[13px] text-[#1f2937] dark:text-white font-medium">
                      {(((report as any).rows ?? 0) as number).toLocaleString('pt-PT')}
                    </div>
                  </td>
                  <td className="px-6 py-4 border-t border-[#f3f4f6] dark:border-[#3a3a3a]">
                    <div className="text-[13px] text-[#9ca3af] dark:text-[#6b7280]">{formatDateTime(report.created_at)}</div>
                  </td>
                  <td className="px-6 py-4 border-t border-[#f3f4f6] dark:border-[#3a3a3a]">
                    <div className="flex gap-1.5 opacity-100 transition-opacity">
                      <button className="w-8 h-8 rounded-full border border-[#e5e7eb] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] flex items-center justify-center cursor-pointer transition-all hover:bg-[#f9fafb] dark:hover:bg-[#2a2a2a] hover:border-[#2d6a4f] hover:text-[#2d6a4f]"
                              title="Abrir"
                              onClick={() => {
                          if (typeof onOpen === 'function') return onOpen(report.id);
                          handleOpen(report.id);
                        }}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
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
                      <button className="w-8 h-8 rounded-full border border-[#e5e7eb] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] flex items-center justify-center cursor-pointer transition-all hover:bg-[#f9fafb] dark:hover:bg-[#2a2a2a] hover:border-[#2d6a4f] hover:text-[#2d6a4f]"
                              title="Copiar"
                              onClick={() => {
                          if (typeof onCopy === 'function') return onCopy(report.id);
                          void handleCopy(report.id);
                        }}>
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button className="w-8 h-8 rounded-full border border-[#e5e7eb] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] flex items-center justify-center cursor-pointer transition-all hover:bg-[#fef2f2] dark:hover:bg-[#3a1a1a] hover:border-[#ef4444] hover:text-[#ef4444]"
                              title="Eliminar"
                              onClick={() => handleDelete(report.id)}>
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

      <ExportMenu
        open={Boolean(openExportId)}
        onClose={() => setOpenExportId(null)}
        onSelect={(format) => void handleDownload(openExportId!, format)}
        floatingRef={refs.setFloating}
        floatingStyles={floatingStyles}
      />

      <DeleteReportConfirmModal
        open={Boolean(pendingDeleteId)}
        reportName={reportPendingDelete?.name}
        isDeleting={deletingId === pendingDeleteId}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
