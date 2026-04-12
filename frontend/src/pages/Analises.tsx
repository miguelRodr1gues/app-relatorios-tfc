import { Calendar } from 'lucide-react';
import BarChart from '../components/BarChart';
import KpiCard from '../components/KpiCard';
import { KPIS, REPORTS, ALERTS } from '../data/mockData';

export default function Analises() {
  const categories = [
    { name: 'Utentes', count: REPORTS.filter(r => r.category === 'Utentes').length, percentage: 28, color: '#2d6a4f' },
    { name: 'Episódios', count: REPORTS.filter(r => r.category === 'Episódios').length, percentage: 24, color: '#40916c' },
    { name: 'Diário Clínico', count: REPORTS.filter(r => r.category === 'Diário Clínico').length, percentage: 20, color: '#52b788' },
    { name: 'Equipa', count: REPORTS.filter(r => r.category === 'Equipa').length, percentage: 14, color: '#74c69d' },
    { name: 'Registos', count: REPORTS.filter(r => r.category === 'Registos').length, percentage: 14, color: '#95d5b2' },
  ];

  const activity = [
    { action: 'Relatório criado', name: REPORTS[0]?.name ?? 'Relatório', time: 'Há 2 horas', icon: '📊' },
    { action: 'Exportação concluída', name: 'Diário clínico — notas recentes', time: 'Há 5 horas', icon: '⬇️' },
    { action: 'Alerta', name: ALERTS[0]?.message ?? 'Aviso', time: 'Hoje', icon: '🔔' },
  ];

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

      {/* Additional Analytics */}
      <div className="grid grid-cols-2 gap-6">
        {/* Categorias */}
        <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl shadow-sm border border-[#f3f4f6] dark:border-[#3a3a3a] p-6 hover:shadow-md transition-all">
          <h3 className="text-[17px] font-semibold text-[#1f2937] dark:text-white mb-5">Categorias Mais Usadas</h3>
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium text-[#1f2937] dark:text-white">{category.name}</span>
                  <span className="text-[13px] font-semibold text-[#6b7280] dark:text-[#9ca3af]">
                    {category.count} relatórios
                  </span>
                </div>
                <div className="w-full h-2 bg-[#f3f4f6] dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${category.percentage}%`, backgroundColor: category.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Atividade Recente */}
        <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl shadow-sm border border-[#f3f4f6] dark:border-[#3a3a3a] p-6 hover:shadow-md transition-all">
          <h3 className="text-[17px] font-semibold text-[#1f2937] dark:text-white mb-5">Atividade Recente</h3>
          <div className="space-y-4">
            {activity.map((item, index) => (
              <div key={index} className="flex items-start gap-3 pb-4 border-b border-[#f3f4f6] dark:border-[#3a3a3a] last:border-0 last:pb-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] dark:from-[#1b4332] dark:to-[#2d6a4f] flex items-center justify-center flex-shrink-0 text-[16px]">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-[#1f2937] dark:text-white">{item.name}</div>
                  <div className="text-[12px] text-[#9ca3af] dark:text-[#6b7280] mt-0.5">{item.action}</div>
                </div>
                <div className="text-[11px] text-[#9ca3af] dark:text-[#6b7280] whitespace-nowrap">{item.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}