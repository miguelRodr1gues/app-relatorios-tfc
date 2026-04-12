import { TrendingUp, ArrowUpRight } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  trend?: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  highlighted?: boolean;
  delay?: number;
  onClick?: () => void;
}

export default function KpiCard({ label, value, trend, icon: Icon, highlighted, delay = 0, onClick }: KpiCardProps) {
  // Verificar se é o card "Total de Relatórios"
  const isTotalRelatorios = label === 'Total de Relatórios';
  const cardBgColor = isTotalRelatorios 
    ? 'bg-gradient-to-br from-[#2d6a4f] to-[#1b4332]' 
    : highlighted 
      ? 'bg-gradient-to-br from-[#2d6a4f] to-[#1b4332]' 
      : 'bg-white';
  const isColoredCard = highlighted || isTotalRelatorios;

  return (
    <div
      className={`rounded-[20px] p-5 border hover:shadow-lg transition-all animate-[fadeUp_0.4s_ease_both] ${cardBgColor} ${
        isColoredCard
          ? 'border-transparent text-white shadow-lg'
          : 'border-[#e5e7eb] dark:border-[#3a3a3a] dark:bg-[#2a2a2a]'
      }`}
      style={{ animationDelay: `${delay}s` }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <span className={`text-[13px] font-medium uppercase tracking-wide ${isColoredCard ? 'text-white/80' : 'text-[#6b7280] dark:text-[#9ca3af]'}`}>{label}</span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (onClick) onClick();
          }}
          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer ${
            isColoredCard 
              ? 'bg-white/10 border-white/30 hover:bg-white/20 hover:border-white/50' 
              : 'bg-white dark:bg-[#1a1a1a] border-[#e5e7eb] dark:border-[#3a3a3a] hover:border-[#2d6a4f] hover:bg-[#f0fdf4] dark:hover:bg-[#1b4332]'
          }`}
        >
          <ArrowUpRight className={`w-4 h-4 ${isColoredCard ? 'text-white' : 'text-[#2d6a4f]'}`} />
        </button>
      </div>
      <div className={`text-[42px] font-bold mb-2 leading-none ${isColoredCard ? 'text-white' : 'text-[#1f2937] dark:text-white'}`}>{value}</div>
      {trend && (
        <div className={`flex items-center gap-1.5 text-[12px] font-semibold ${ 
          isColoredCard 
            ? 'text-white' 
            : trend.startsWith('+') 
              ? 'text-[#059669]' 
              : 'text-[#dc2626]'
        }`}>
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{trend}</span>
          <span className={isColoredCard ? 'text-white/60' : 'text-[#9ca3af] dark:text-[#6b7280]'}>vs último mês</span>
        </div>
      )}
    </div>
  );
}