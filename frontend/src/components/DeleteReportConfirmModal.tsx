import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type DeleteReportConfirmModalProps = {
  open: boolean;
  reportName: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteReportConfirmModal({
  open,
  reportName,
  isDeleting = false,
  onCancel,
  onConfirm,
}: DeleteReportConfirmModalProps) {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
      <button
        aria-label="Fechar confirmação"
        className="absolute inset-0 bg-[#111827]/45 backdrop-blur-sm"
        onClick={() => {
          if (!isDeleting) onCancel();
        }}
      />

      <div className="relative w-full max-w-[440px] overflow-hidden rounded-[28px] border border-[#e8ecf0] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)] animate-[fadeUp_0.2s_ease_both] dark:border-[#3a3a3a] dark:bg-[#242424]">
        <button
          aria-label="Fechar"
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-[#e8ecf0] bg-transparent text-[#4a6358] transition-all hover:bg-[#f4f6f8] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#3a3a3a] dark:text-[#9ca3af] dark:hover:bg-[#1a1a1a]"
          onClick={onCancel}
          disabled={isDeleting}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pb-2 pt-6 pr-16">
          <h3 className="text-[20px] font-bold leading-tight text-[#172132] dark:text-white">
            Eliminar relatório
          </h3>
        </div>

        <div className="px-6 py-4">
          <p className="text-[14px] leading-6 text-[#667085] dark:text-[#9ca3af]">
            O relatório será removido definitivamente e não poderá ser recuperado.
          </p>

          {reportName && (
            <div className="mt-5 rounded-2xl border border-[#e8ecf0] bg-[#fbfcfd] px-4 py-3.5 dark:border-[#3a3a3a] dark:bg-[#1a1a1a]">
              <div className="text-[11px] font-bold uppercase tracking-wide text-[#8fa899] dark:text-[#6b7280] mb-1.5">
                Relatório selecionado
              </div>
              <div className="text-[14px] font-semibold text-[#172132] dark:text-white truncate">
                {reportName}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 bg-white px-6 pb-6 pt-1 sm:flex-row sm:justify-end dark:bg-[#242424]">
          <button
            className="rounded-full border border-[#d1d5db] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#374151] transition hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#3a3a3a] dark:bg-[#2a2a2a] dark:text-[#d1d5db] dark:hover:bg-[#333]"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            className="flex items-center justify-center gap-2 rounded-full bg-[#dc2626] px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting && (
              <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            )}
            {isDeleting ? 'A eliminar...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
