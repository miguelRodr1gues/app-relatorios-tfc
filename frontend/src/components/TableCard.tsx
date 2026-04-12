interface TableCardProps {
  table: {
    key: string;
    name: string;
    emoji?: string;
    rows?: number;
    cols?: number;
  };
  isSelected?: boolean;
  onClick: () => void;
  variant?: 'default' | 'wizard';
  style?: React.CSSProperties;
}

export default function TableCard({ table, isSelected = false, onClick, variant = 'default', style }: TableCardProps) {
  const safeEmoji = table.emoji ?? '🍽️';
  const safeRows = table.rows ?? 0;
  const safeCols = table.cols ?? 0;

  if (variant === 'wizard') {
    return (
      <div
        onClick={onClick}
        className={`p-3 rounded-[10px] cursor-pointer transition-all ${
          isSelected
            ? 'border-[1.5px] border-[#1b4332] bg-[#1b4332]'
            : 'bg-[#f9fafb] border-[1.5px] border-[#e8ecf0] hover:border-[#40916c]'
        }`}
      >
        <div className="text-lg mb-1">{safeEmoji}</div>
        <div
          className={`font-bold text-xs ${
            isSelected ? 'text-[#74c69d]' : 'text-[#1a2e1a]'
          }`}
        >
          {table.name}
        </div>
        <div
          className={`text-[10px] mt-0.5 ${
            isSelected ? 'text-white/40' : 'text-[#8fa899]'
          }`}
        >
          {safeRows.toLocaleString('pt-PT')} reg · {safeCols} cols
        </div>
      </div>
    );
  }

  // Default variant (for Tabelas page and Wizard)
  return (
    <div
      onClick={onClick}
      style={style}
      className={`group bg-gradient-to-br from-white to-[#fafbfc] dark:from-[#2a2a2a] dark:to-[#1a1a1a] border-2 rounded-xl p-5 cursor-pointer hover:shadow-lg transition-all animate-[fadeUp_0.4s_ease_both] ${
        isSelected
          ? 'border-[#2d6a4f] shadow-lg'
          : 'border-[#f3f4f6] dark:border-[#3a3a3a] hover:border-[#2d6a4f]/20'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] dark:from-[#1b4332] dark:to-[#2d6a4f] flex items-center justify-center text-[28px] transition-transform ${
          isSelected ? 'scale-110' : 'group-hover:scale-110'
        }`}>
          {safeEmoji}
        </div>
        <div className="text-[12px] text-[#9ca3af] dark:text-[#6b7280] font-medium bg-[#f9fafb] dark:bg-[#1a1a1a] px-3 py-1.5 rounded-lg">
          {safeRows.toLocaleString('pt-PT')} reg.
        </div>
      </div>
      <div className={`font-semibold text-[15px] mb-1.5 ${
        isSelected ? 'text-[#2d6a4f]' : 'text-[#1f2937] dark:text-white'
      }`}>{table.name}</div>
      <div className="text-[13px] text-[#6b7280] dark:text-[#9ca3af]">{safeCols} colunas</div>
    </div>
  );
}