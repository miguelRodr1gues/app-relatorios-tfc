interface KpiCardProps {
  label: string;
  value: string;
  highlighted?: boolean;
}

export default function KpiCard({ label, value, highlighted }: KpiCardProps) {

  const cardBgColor = highlighted
      ? 'bg-gradient-to-br from-[#2d6a4f] to-[#1b4332]'
      : 'bg-white';

  const isColoredCard = highlighted;

  return (
    <div
      className={`rounded-[20px] p-5 border hover:shadow-lg transition-all animate-[fadeUp_0.4s_ease_both] ${cardBgColor} ${
        isColoredCard
          ? 'border-transparent text-white shadow-lg'
          : 'border-[#e5e7eb] dark:border-[#3a3a3a] dark:bg-[#2a2a2a]'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className={`text-[13px] font-medium uppercase tracking-wide ${isColoredCard ? 'text-white/80' : 'text-[#6b7280] dark:text-[#9ca3af]'}`}>{label}</span>
      </div>
        <div className={`text-[42px] font-bold mb-2 leading-none ${isColoredCard ? 'text-white' : 'text-[#1f2937] dark:text-white'}`}>{value}</div>
      </div>
  );
}