import { createPortal } from 'react-dom';
import { FileJson, FileText } from 'lucide-react';

interface ExportFormat {
  format: 'json' | 'csv' | 'pdf';
  label: string;
  icon: React.ReactNode;
}

interface ExportMenuProps {
  open: boolean;
  onClose: () => void;
  onSelect: (format: 'json' | 'csv' | 'pdf') => void;
  floatingRef: (node: HTMLDivElement | null) => void;
  floatingStyles: React.CSSProperties;
}

const EXPORT_FORMATS: ExportFormat[] = [
  {
    format: 'json',
    label: 'JSON',
    icon: <FileJson className="w-4 h-4" />,
  },
  {
    format: 'csv',
    label: 'CSV',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    format: 'pdf',
    label: 'PDF',
    icon: <FileText className="w-4 h-4" />,
  },
];

export default function ExportMenu({
  open,
  onClose,
  onSelect,
  floatingRef,
  floatingStyles,
}: ExportMenuProps) {
  if (!open || typeof document === 'undefined') {
    return null;
  }

  const handleSelect = (format: 'json' | 'csv' | 'pdf') => {
    onSelect(format);
  };

  return createPortal(
    <>
      <button
        aria-label="Fechar menu de exportação"
        className="fixed inset-0 z-[9998] cursor-default"
        onClick={onClose}
      />
      <div
        ref={floatingRef}
        className="fixed z-[9999] min-w-[180px] rounded-xl border border-[#e5e7eb] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] shadow-lg overflow-hidden"
        style={floatingStyles}
      >
        {EXPORT_FORMATS.map(({ format, label, icon }) => (
          <button
            key={format}
            className="w-full px-4 py-3 text-left text-[13px] flex items-center gap-2 hover:bg-[#f9fafb] dark:hover:bg-[#2a2a2a]"
            onClick={() => handleSelect(format)}
          >
            {icon} {label}
          </button>
        ))}
      </div>
    </>,
    document.body,
  );
}
