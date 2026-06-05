import { useEffect, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import BarChart from '../components/BarChart';
import ReportsTable from '../components/ReportsTable';
import TableCard from '../components/TableCard';
import { useWizard } from '../context/WizardContext';
import { useSearch } from '../context/SearchContext';
import { fetchTableDefinitions, getReports, type ApiTableDefinition } from '../lib/api';

const DASHBOARD_METRICS_KEY = 'dashboard-metrics';
const MAX_METRIC_CARDS = 4;

type MetricKey = 'report_count' | `table:${string}`;

type MetricOption = {
  key: MetricKey;
  label: string;
  value: string;
  subtitle: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-PT').format(value);
}

function AddMetricCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-[140px] rounded-[20px] border border-dashed border-[#cfd8d3] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[#4b6358] dark:text-[#9ca3af] hover:border-[#2d6a4f] hover:text-[#2d6a4f] transition-all flex flex-col items-center justify-center gap-3"
    >
      <div className="w-12 h-12 rounded-full bg-[#f3f6f4] dark:bg-[#1f2937] flex items-center justify-center">
        <Plus className="w-5 h-5" />
      </div>
      <div className="text-[13px] font-semibold">Adicionar métrica</div>
    </button>
  );
}

function DashboardMetricCard({
  label,
  value,
  subtitle,
  onRemove,
}: {
  label: string;
  value: string;
  subtitle: string;
  onRemove: () => void;
}) {
  return (
    <div className="relative h-[140px] rounded-[20px] p-5 border border-[#e5e7eb] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] hover:shadow-lg transition-all">
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#f7f7f7] dark:bg-[#1a1a1a] text-[#6b7280] dark:text-[#9ca3af] hover:text-[#111827] dark:hover:text-white flex items-center justify-center"
        aria-label={`Remover métrica ${label}`}
      >
        <X className="w-4 h-4" />
      </button>
      <div className="text-[13px] font-medium uppercase tracking-wide text-[#6b7280] dark:text-[#9ca3af] pr-8">
        {label}
      </div>
      <div className="text-[36px] font-bold mt-4 leading-none text-[#1f2937] dark:text-white">
        {value}
      </div>
      <div className="text-[13px] mt-3 text-[#6b7280] dark:text-[#9ca3af]">
        {subtitle}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { openWizard } = useWizard();
  const { searchQuery } = useSearch();
  const [tables, setTables] = useState<ApiTableDefinition[]>([]);
  const [reportsCount, setReportsCount] = useState(0);
  const [selectedMetricKeys, setSelectedMetricKeys] = useState<MetricKey[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [metricSearchQuery, setMetricSearchQuery] = useState('');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(DASHBOARD_METRICS_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setSelectedMetricKeys(parsed.filter((item): item is MetricKey => typeof item === 'string').slice(0, MAX_METRIC_CARDS));
      }
    } catch {
      // ignore invalid local storage data
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(DASHBOARD_METRICS_KEY, JSON.stringify(selectedMetricKeys));
  }, [selectedMetricKeys]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [tableData, reports] = await Promise.all([
          fetchTableDefinitions({ schema: 'public' }),
          getReports(),
        ]);

        if (!isMounted) return;
        setTables(tableData);
        setReportsCount(reports.length);
      } catch {
        if (!isMounted) return;
        setTables([]);
        setReportsCount(0);
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const metricOptions = useMemo<MetricOption[]>(() => {
    const reportMetric: MetricOption = {
      key: 'report_count',
      label: 'Relatórios criados',
      value: formatNumber(reportsCount),
      subtitle: 'total de relatórios',
    };

    const tableMetrics = tables.map((table) => ({
      key: `table:${table.key}` as MetricKey,
      label: table.name,
      value: formatNumber(table.rows ?? 0),
      subtitle: `${formatNumber(table.rows ?? 0)} registos`,
    }));

    return [reportMetric, ...tableMetrics];
  }, [reportsCount, tables]);

  const selectedMetrics = useMemo(
    () =>
      selectedMetricKeys
        .map((key) => metricOptions.find((option) => option.key === key))
        .filter((option): option is MetricOption => Boolean(option)),
    [metricOptions, selectedMetricKeys]
  );

  const availableMetrics = useMemo(() => {
    const baseOptions = metricOptions.filter((option) => !selectedMetricKeys.includes(option.key));
    const normalizedQuery = metricSearchQuery.trim().toLowerCase();

    if (!normalizedQuery) return baseOptions;

    return baseOptions.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery) ||
      option.subtitle.toLowerCase().includes(normalizedQuery)
    );
  }, [metricOptions, metricSearchQuery, selectedMetricKeys]);

  const handleAddMetric = (metricKey: MetricKey) => {
    setSelectedMetricKeys((prev) => {
      if (prev.includes(metricKey) || prev.length >= MAX_METRIC_CARDS) return prev;
      return [...prev, metricKey];
    });
    setMetricSearchQuery('');
    setIsPickerOpen(false);
  };

  const handleRemoveMetric = (metricKey: MetricKey) => {
    setSelectedMetricKeys((prev) => prev.filter((key) => key !== metricKey));
  };

  const emptySlots = Math.max(0, MAX_METRIC_CARDS - selectedMetrics.length);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 bg-[#fafafa] dark:bg-[#1a1a1a]">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-[#1f2937] dark:text-white leading-tight">Dashboard</h1>
          <p className="text-[14px] text-[#9ca3af] dark:text-[#6b7280] mt-1">
            Análise, explore e gere relatórios dinâmicos com facilidade.
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

      <div className="grid grid-cols-4 gap-4 mb-4">
        {selectedMetrics.map((metric) => (
          <DashboardMetricCard
            key={metric.key}
            label={metric.label}
            value={metric.value}
            subtitle={metric.subtitle}
            onRemove={() => handleRemoveMetric(metric.key)}
          />
        ))}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <AddMetricCard key={`add-metric-${index}`} onClick={() => setIsPickerOpen(true)} />
        ))}
      </div>

      {isPickerOpen && (
        <div className="mb-6 rounded-[20px] border border-[#e5e7eb] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="text-[16px] font-semibold text-[#1f2937] dark:text-white">Escolher métricas</div>
              <div className="text-[13px] text-[#6b7280] dark:text-[#9ca3af] mt-1">
                Adiciona métricas ao topo do dashboard.
              </div>
            </div>
            <button
              onClick={() => {
                setMetricSearchQuery('');
                setIsPickerOpen(false);
              }}
              className="w-8 h-8 rounded-full bg-[#f7f7f7] dark:bg-[#1a1a1a] text-[#6b7280] dark:text-[#9ca3af] flex items-center justify-center"
              aria-label="Fechar seleção de métricas"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-4">
            <input
              type="text"
              value={metricSearchQuery}
              onChange={(e) => setMetricSearchQuery(e.target.value)}
              placeholder="Pesquisar métricas..."
              className="w-full px-4 py-3 bg-[#fafafa] dark:bg-[#1a1a1a] border border-[#e5e7eb] dark:border-[#3a3a3a] rounded-full text-[14px] text-[#1f2937] dark:text-white placeholder-[#9ca3af] dark:placeholder-[#6b7280] focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 transition-all"
            />
          </div>

          {availableMetrics.length === 0 ? (
            <div className="text-[13px] text-[#6b7280] dark:text-[#9ca3af]">
              {metricSearchQuery.trim()
                ? 'Nenhuma métrica encontrada para essa pesquisa.'
                : 'Já adicionaste o número máximo de métricas.'}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {availableMetrics.map((metric) =>
                metric.key === 'report_count' ? (
                  <button
                    key={metric.key}
                    onClick={() => handleAddMetric(metric.key)}
                    className="text-left rounded-xl border border-[#e5e7eb] dark:border-[#3a3a3a] bg-[#fafafa] dark:bg-[#1a1a1a] p-5 hover:border-[#2d6a4f] transition-all"
                  >
                    <div className="text-[15px] font-semibold text-[#1f2937] dark:text-white">{metric.label}</div>
                    <div className="text-[13px] text-[#6b7280] dark:text-[#9ca3af] mt-2">{metric.subtitle}</div>
                  </button>
                ) : (
                  <TableCard
                    key={metric.key}
                    table={{
                      key: metric.key,
                      name: metric.label,
                      rows: Number(metric.value.replace(/\./g, '')),
                      cols: 0,
                    }}
                    subtitle={metric.subtitle}
                    onClick={() => handleAddMetric(metric.key)}
                  />
                )
              )}
            </div>
          )}
        </div>
      )}

      <div className="mb-6">
        <BarChart />
      </div>

      <div className="mb-6">
        <ReportsTable searchQuery={searchQuery} />
      </div>
    </div>
  );
}
