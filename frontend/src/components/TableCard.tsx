interface TableCardProps {
  table: {
    key: string;
    name: string;
    rows?: number;
    cols?: number;
  };
  isSelected?: boolean;
  subtitle?: string;
  onClick: () => void;
}

export default function TableCard({ table, isSelected = false, subtitle, onClick }: TableCardProps) {
  const safeCols = table.cols ?? 0;
  const defaultSubtitle = typeof table.rows === 'number'
    ? `${table.rows.toLocaleString('pt-PT')} registos`
    : `${safeCols} colunas`;

  return (
    <div
      onClick={onClick}
      className={`group bg-gradient-to-br from-white to-[#fafbfc] dark:from-[#2a2a2a] dark:to-[#1a1a1a] border-2 rounded-xl p-5 cursor-pointer hover:shadow-lg transition-all animate-[fadeUp_0.4s_ease_both] ${
        isSelected
          ? 'border-[#2d6a4f] shadow-lg'
          : 'border-[#f3f4f6] dark:border-[#3a3a3a] hover:border-[#2d6a4f]/20'
      }`}
    >
      <div className={`font-semibold text-[15px] mb-1.5 ${
        isSelected ? 'text-[#2d6a4f]' : 'text-[#1f2937] dark:text-white'
      }`}>{table.name}</div>
      <div className="text-[13px] text-[#6b7280] dark:text-[#9ca3af]">{subtitle || defaultSubtitle}</div>
    </div>
  );
}
