import { createPortal } from 'react-dom';

type DeleteReportConfirmModalProps = {
  open: boolean;
  reportName?: string;
  isDeleting?: boolean;
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
        aria-label="Fechar confirmacao"
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          if (!isDeleting) onCancel();
        }}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-[#e5e7eb] dark:border-[#3a3a3a] bg-white dark:bg-[#1f1f1f] p-6 shadow-xl">
        <h3 className="text-[16px] font-semibold text-[#1f2937] dark:text-white">Tem a certeza que quer eliminar este relatório?</h3>
        <p className="mb-6 text-[13px] text-[#6b7280] dark:text-[#9ca3af]">
          {reportName ? `Relatorio: ${reportName}` : 'Esta acao e permanente e nao pode ser desfeita.'}
        </p>
        <div className="flex justify-end gap-3">
          <button
            className="rounded-full border border-[#d1d5db] px-4 py-2 text-[13px] font-medium text-[#374151] transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#4b5563] dark:text-[#d1d5db] dark:hover:bg-[#2b2b2b]"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            className="rounded-full bg-[#dc2626] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'A eliminar...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

