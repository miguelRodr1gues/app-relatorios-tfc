import { Calendar } from 'lucide-react';
import BarChart from '../components/BarChart';
import KpiCard from '../components/KpiCard';
import { KPIS } from '../data/mockData';

export default function Analises() {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 bg-[#fafafa] dark:bg-[#1a1a1a]">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-[#1f2937] dark:text-white leading-tight">Análises</h1>
          <p className="text-[14px] text-[#9ca3af] dark:text-[#6b7280] mt-1">
            Análise detalhada de métricas e performance dos relatórios.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white dark:bg-[#2a2a2a] text-[#374151] dark:text-white border border-[#e5e7eb] dark:border-[#3a3a3a] rounded-full px-5 py-2.5 text-[14px] font-semibold cursor-pointer transition-all hover:bg-[#f9fafb] dark:hover:bg-[#3a3a3a]">
            <Calendar className="w-4 h-4" />
            Este Mês
          </button>
        </div>
      </div>

      {/* KPIs (reutiliza os cards do Dashboard) */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {KPIS.map((kpi, index) => (
          <KpiCard key={`kpi-analises-${kpi.label}-${index}`} {...kpi} delay={index * 0.06} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <BarChart />
      </div>
    </div>
  );
}