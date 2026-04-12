import { Plus } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import BarChart from '../components/BarChart';
import ReportsTable from '../components/ReportsTable';
import { useWizard } from '../context/WizardContext';
import { useSearch } from '../context/SearchContext';
import { KPIS } from '../data/mockData';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { openWizard } = useWizard();
  const { searchQuery } = useSearch();
  const navigate = useNavigate();

  const handleKpiClick = (label: string) => {
    switch (label) {
      case 'Total de Relatórios':
      case 'Relatórios Concluídos':
        navigate('/relatorios');
        break;
      case 'Tabelas Disponíveis':
        // As tabelas são exploradas na Estrutura e no Wizard.
        navigate('/estrutura');
        break;
      case 'Alertas Ativos':
        console.log('Alertas ativos clicado');
        break;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 bg-[#fafafa] dark:bg-[#1a1a1a]">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-[#1f2937] dark:text-white leading-tight">Dashboard</h1>
          <p className="text-[14px] text-[#9ca3af] dark:text-[#6b7280] mt-1">
            Analise, explore e gere relatórios dinâmicos com facilidade.
          </p>
        </div>
        <button
          onClick={openWizard}
          className="flex items-center gap-2 bg-[#2d6a4f] text-white border-none rounded-full px-6 py-2.5 text-[14px] font-semibold cursor-pointer transition-all hover:bg-[#1b4332] hover:shadow-md whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Novo Relatório
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {KPIS.map((kpi, index) => (
          <KpiCard key={`kpi-${kpi.label}-${index}`} {...kpi} delay={index * 0.06} onClick={() => handleKpiClick(kpi.label)} />
        ))}
      </div>

      {/* Análises (Bar Chart) */}
      <div className="mb-6">
        <BarChart />
      </div>

      {/* Últimos Relatórios */}
      <div className="mb-6">
        <ReportsTable searchQuery={searchQuery} />
      </div>

      {/* Nota: 'Tabelas' foram removidas do Dashboard. Estão disponíveis no Wizard e/ou Estrutura. */}
    </div>
  );
}