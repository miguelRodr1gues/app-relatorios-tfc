import { useState } from 'react';
import { X, Download, FileText, FileJson, Save, Check, Plus, Trash2 } from 'lucide-react';
import { TABLES } from '../data/mockData';
import TableCard from './TableCard';
import SearchBar from './SearchBar';

interface WizardStep {
  id: string;
  label: string;
}

const STEPS: WizardStep[] = [
  { id: 'source', label: 'Fonte de dados' },
  { id: 'columns', label: 'Colunas' },
  { id: 'filters', label: 'Filtros' },
  { id: 'grouping', label: 'Agrupamento' },
  { id: 'preview', label: 'Preview' },
  { id: 'actions', label: 'Ações' },
  { id: 'settings', label: 'Configurações' },
];

const CHART_COLORS = [
  '#2d6a4f', '#40916c', '#52796f', '#1e88e5', '#e63946', '#f77f00', '#1b4332'
];

interface ReportWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportWizard({ isOpen, onClose }: ReportWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Step 2: Columns
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  
  // Step 3: Filters
  const [filters, setFilters] = useState<Array<{ column: string; operator: string; value: string }>>([
    { column: '', operator: '=', value: '' }
  ]);
  
  // Step 4: Grouping
  const [groupByColumn, setGroupByColumn] = useState('');
  const [aggregateFunctions, setAggregateFunctions] = useState<string[]>([]);
  const [showSubtotals, setShowSubtotals] = useState(false);
  const [showGrandTotal, setShowGrandTotal] = useState(true);
  const [orderBy, setOrderBy] = useState('');
  
  // Step 6: Actions
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  
  // Step 7: Settings
  const [schedule, setSchedule] = useState('never');
  const [emailTo, setEmailTo] = useState('');
  const [defaultFormat, setDefaultFormat] = useState('csv');
  const [chartColor, setChartColor] = useState('#2d6a4f');
  const [timezone, setTimezone] = useState('Europe/Lisbon (UTC+0/+1)');
  const [rowsPerPage, setRowsPerPage] = useState('10');

  if (!isOpen) return null;

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Generate report
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const filteredTables = TABLES.filter(
    table =>
      !searchQuery ||
      table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.key.includes(searchQuery.toLowerCase())
  );

  // Get all available columns from selected tables
  const availableColumns = selectedTables.flatMap(tableKey => {
    const table = TABLES.find(t => t.key === tableKey);
    return table ? table.columns.map(col => ({ table: table.name, column: col.label, key: `${tableKey}.${col.n}` })) : [];
  });

  const toggleColumn = (columnKey: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnKey) ? prev.filter(c => c !== columnKey) : [...prev, columnKey]
    );
  };

  const toggleAggregateFunction = (func: string) => {
    setAggregateFunctions(prev =>
      prev.includes(func) ? prev.filter(f => f !== func) : [...prev, func]
    );
  };

  const addFilter = () => {
    setFilters([...filters, { column: '', operator: '=', value: '' }]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, field: 'column' | 'operator' | 'value', value: string) => {
    const newFilters = [...filters];
    newFilters[index][field] = value;
    setFilters(newFilters);
  };

  const toggleAction = (action: string) => {
    setSelectedActions(prev =>
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/35 backdrop-blur-sm z-[100] flex items-start justify-center overflow-y-auto">
      <div className="bg-[#fafafa] dark:bg-[#1a1a1a] w-full min-h-screen flex flex-col animate-[fadeUp_0.2s_ease]">
        {/* Header */}
        <div className="bg-white dark:bg-[#2a2a2a] border-b-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] flex-shrink-0">
          <div className="w-full px-7">
            <div className="flex items-center justify-between w-full py-5 pb-4">
              <div>
                <div className="font-bold text-[22px] text-[#1a2e1a] dark:text-white">Novo Relatório</div>
                <div className="text-[14px] text-[#8fa899] dark:text-[#9ca3af] mt-1">
                  Passo {currentStep} de {STEPS.length} — {STEPS[currentStep - 1].label}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] bg-transparent text-[#4a6358] dark:text-[#9ca3af] flex items-center justify-center cursor-pointer transition-all hover:bg-[#f4f6f8] dark:hover:bg-[#1a1a1a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Rail */}
            <div className="w-full pb-4">
              <div className="relative flex flex-col gap-2">
                <div className="flex justify-between relative z-[2]">
                  {STEPS.map((step, index) => {
                    const stepNum = index + 1;
                    const isActive = stepNum === currentStep;
                    const isDone = stepNum < currentStep;

                    return (
                      <div key={step.id} className="flex flex-col items-center gap-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all relative z-[3] ${
                            isActive
                              ? 'bg-[#40916c] text-white shadow-[0_0_0_4px_#d8f3dc] dark:shadow-[0_0_0_4px_rgba(45,106,79,0.3)]'
                              : isDone
                              ? 'bg-[#1b4332] text-white'
                              : 'bg-[#d1e8d4] dark:bg-[#3a3a3a] text-[#52796f] dark:text-[#6b7280]'
                          }`}
                        >
                          {isDone ? '✓' : stepNum}
                        </div>
                        <div
                          className={`text-[11.5px] font-semibold whitespace-nowrap mt-2 ${
                            isActive
                              ? 'text-[#1b4332] dark:text-[#52b788] font-bold'
                              : isDone
                              ? 'text-[#1b4332] dark:text-white'
                              : 'text-[#8fa899] dark:text-[#6b7280]'
                          }`}
                        >
                          {step.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="absolute top-[14px] left-0 right-0 h-[3px] bg-[#e8ecf0] dark:bg-[#3a3a3a] rounded-sm z-[1] -translate-y-1/2">
                  <div
                    className="absolute top-0 left-0 h-full bg-[#40916c] rounded-sm transition-all duration-400"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="w-full px-7 py-6">
            {/* Step 1: Data Source */}
            {currentStep === 1 && (
              <div>
                <div className="mb-3.5">
                  <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#8fa899] dark:text-[#9ca3af] mb-2">
                    Selecionar tabelas ou views {selectedTables.length > 0 && `(${selectedTables.length} selecionadas)`}
                  </label>
                  <div className="mb-4">
                    <SearchBar
                      placeholder="Pesquisar tabelas…"
                      value={searchQuery}
                      onChange={setSearchQuery}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-5 max-h-[400px] overflow-y-auto mb-3.5">
                    {filteredTables.length > 0 ? (
                      filteredTables.map((table, index) => (
                        <TableCard
                          key={table.key}
                          table={table}
                          isSelected={selectedTables.includes(table.key)}
                          onClick={() => setSelectedTables(prev => prev.includes(table.key) ? prev.filter(t => t !== table.key) : [...prev, table.key])}
                          variant="default"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        />
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-5 text-[13px] text-[#8fa899] dark:text-[#9ca3af]">
                        Nenhuma tabela encontrada para "<b>{searchQuery}</b>"
                      </div>
                    )}
                  </div>
                </div>

                {selectedTables.length > 0 && (
                  <div className="border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] rounded-[10px] p-4 bg-[#f9fafb] dark:bg-[#2a2a2a]">
                    <div className="text-[12px] font-bold uppercase tracking-wider text-[#8fa899] dark:text-[#9ca3af] mb-3">
                      Preview — primeiras linhas
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-[12px]">
                        <thead>
                          <tr>
                            {TABLES.find(t => t.key === selectedTables[0])
                              ?.columns.slice(0, 6)
                              .map(col => (
                                <th
                                  key={col.n}
                                  className="px-3 py-2 bg-[#f9fafb] dark:bg-[#2a2a2a] text-[#8fa899] dark:text-[#9ca3af] text-[10px] uppercase tracking-wider font-semibold text-left border-b border-[#e8ecf0] dark:border-[#3a3a3a]"
                                >
                                  {col.label}
                                </th>
                              ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[0, 1, 2].map(rowIndex => (
                            <tr key={rowIndex}>
                              {TABLES.find(t => t.key === selectedTables[0])
                                ?.columns.slice(0, 6)
                                .map((col, colIndex) => (
                                  <td
                                    key={col.n}
                                    className="px-3 py-2 border-b border-[#e8ecf0]/50 dark:border-[#3a3a3a]/50 text-[#1a2e1a] dark:text-[#9ca3af]"
                                  >
                                    {colIndex === 0 ? rowIndex + 1 : '—'}
                                  </td>
                                ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Columns */}
            {currentStep === 2 && (
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#8fa899] dark:text-[#9ca3af] mb-3">
                  Selecionar colunas para incluir no relatório
                </label>
                {availableColumns.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {availableColumns.map(({ table, column, key }) => (
                      <div
                        key={key}
                        onClick={() => toggleColumn(key)}
                        className={`p-4 rounded-lg border-[1.5px] cursor-pointer transition-all ${
                          selectedColumns.includes(key)
                            ? 'bg-[#d8f3dc] dark:bg-[#1b4332] border-[#40916c]'
                            : 'bg-white dark:bg-[#2a2a2a] border-[#e8ecf0] dark:border-[#3a3a3a] hover:border-[#40916c]/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded border-[1.5px] flex items-center justify-center transition-all ${
                              selectedColumns.includes(key)
                                ? 'bg-[#40916c] border-[#40916c]'
                                : 'bg-white dark:bg-[#2a2a2a] border-[#d1e8d4] dark:border-[#3a3a3a]'
                            }`}
                          >
                            {selectedColumns.includes(key) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1">
                            <div className="text-[13px] font-semibold text-[#1a2e1a] dark:text-white">{column}</div>
                            <div className="text-[11px] text-[#8fa899] dark:text-[#6b7280]">{table}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-[#8fa899] dark:text-[#9ca3af]">
                    <div className="text-[13px]">Selecione pelo menos uma tabela no passo anterior</div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Filters */}
            {currentStep === 3 && (
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#8fa899] dark:text-[#9ca3af] mb-3">
                  Definir filtros para os dados
                </label>
                <div className="space-y-3">
                  {filters.map((filter, index) => (
                    <div key={index} className="bg-white dark:bg-[#2a2a2a] border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] rounded-lg p-4">
                      <div className="flex gap-3 items-start">
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#8fa899] dark:text-[#9ca3af] mb-1.5 uppercase tracking-wide">
                              Coluna
                            </label>
                            <select
                              value={filter.column}
                              onChange={(e) => updateFilter(index, 'column', e.target.value)}
                              className="w-full px-3 py-2 bg-[#f9fafb] dark:bg-[#2a2a2a] border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] rounded-lg text-[13px] text-[#1a2e1a] dark:text-[#9ca3af] outline-none transition-colors focus:border-[#40916c]"
                            >
                              <option value="">-- Selecionar coluna --</option>
                              {availableColumns.map(({ column, key }) => (
                                <option key={key} value={key}>{column}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[#8fa899] dark:text-[#9ca3af] mb-1.5 uppercase tracking-wide">
                              Operador
                            </label>
                            <select
                              value={filter.operator}
                              onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                              className="w-full px-3 py-2 bg-[#f9fafb] dark:bg-[#2a2a2a] border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] rounded-lg text-[13px] text-[#1a2e1a] dark:text-[#9ca3af] outline-none transition-colors focus:border-[#40916c]"
                            >
                              <option value="=">=</option>
                              <option value="!=">≠</option>
                              <option value=">">{'>'}</option>
                              <option value="<">{'<'}</option>
                              <option value=">=">≥</option>
                              <option value="<=">≤</option>
                              <option value="LIKE">Contém</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[#8fa899] dark:text-[#9ca3af] mb-1.5 uppercase tracking-wide">
                              Valor
                            </label>
                            <input
                              type="text"
                              value={filter.value}
                              onChange={(e) => updateFilter(index, 'value', e.target.value)}
                              placeholder="Digite o valor..."
                              className="w-full px-3 py-2 bg-[#f9fafb] dark:bg-[#2a2a2a] border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] rounded-lg text-[13px] text-[#1a2e1a] dark:text-[#9ca3af] outline-none transition-colors focus:border-[#40916c] placeholder:text-[#8fa899] dark:placeholder:text-[#9ca3af]"
                            />
                          </div>
                        </div>
                        {filters.length > 1 && (
                          <button
                            onClick={() => removeFilter(index)}
                            className="mt-6 p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addFilter}
                  className="mt-4 px-4 py-2.5 rounded-full text-[13px] font-semibold bg-white border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] text-[#1a2e1a] dark:text-[#9ca3af] hover:border-[#40916c] transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar filtro
                </button>
              </div>
            )}

            {/* Step 4: Grouping */}
            {currentStep === 4 && (
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8fa899] dark:text-[#9ca3af] mb-2">
                      Agrupar por
                    </label>
                    <select
                      value={groupByColumn}
                      onChange={(e) => setGroupByColumn(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-[#2a2a2a] border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] rounded-lg text-[14px] text-[#1a2e1a] dark:text-[#9ca3af] outline-none transition-colors focus:border-[#40916c]"
                    >
                      <option value="">-- Selecionar coluna --</option>
                      {availableColumns.map(({ column, key }) => (
                        <option key={key} value={key}>{column}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8fa899] dark:text-[#9ca3af] mb-3">
                      Funções agregadas
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {['SOMA', 'MÉDIA', 'CONTAGEM', 'MIN', 'MAX'].map(func => (
                        <button
                          key={func}
                          onClick={() => toggleAggregateFunction(func)}
                          className={`px-4 py-2 rounded-full text-[12px] font-semibold transition-all ${
                            aggregateFunctions.includes(func)
                              ? 'bg-[#2d6a4f] text-white'
                              : 'bg-[#f0f0f0] text-[#6b7280] hover:bg-[#e0e0e0]'
                          }`}
                        >
                          {func}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8fa899] dark:text-[#9ca3af] mb-3">
                      Totais
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] text-[#1a2e1a] dark:text-[#9ca3af]">Subtotais por grupo</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showSubtotals}
                            onChange={(e) => setShowSubtotals(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-[#d1e8d4] dark:bg-[#3a3a3a] rounded-full peer peer-checked:bg-[#40916c] peer-focus:ring-2 peer-focus:ring-[#40916c]/20 transition-all">
                            <div className="w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform peer-checked:translate-x-5 translate-x-0.5 translate-y-0.5"></div>
                          </div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] text-[#1a2e1a] dark:text-[#9ca3af]">Total geral</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showGrandTotal}
                            onChange={(e) => setShowGrandTotal(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-[#d1e8d4] dark:bg-[#3a3a3a] rounded-full peer peer-checked:bg-[#40916c] peer-focus:ring-2 peer-focus:ring-[#40916c]/20 transition-all">
                            <div className="w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform peer-checked:translate-x-5 translate-x-0.5 translate-y-0.5"></div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8fa899] dark:text-[#9ca3af] mb-2">
                      Ordenação
                    </label>
                    <select
                      value={orderBy}
                      onChange={(e) => setOrderBy(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-[#2a2a2a] border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] rounded-lg text-[14px] text-[#1a2e1a] dark:text-[#9ca3af] outline-none transition-colors focus:border-[#40916c]"
                    >
                      <option value="">-- Sem ordem --</option>
                      {availableColumns.map(({ column, key }) => (
                        <option key={key} value={key}>{column}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Preview */}
            {currentStep === 5 && (
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#8fa899] dark:text-[#9ca3af] mb-3">
                  Preview do relatório
                </label>
                <div className="bg-white border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] rounded-lg p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[13px]">
                      <thead>
                        <tr>
                          {selectedColumns.length > 0 ? (
                            selectedColumns.slice(0, 6).map(colKey => {
                              const col = availableColumns.find(c => c.key === colKey);
                              return (
                                <th
                                  key={colKey}
                                  className="px-4 py-3 bg-[#f9fafb] dark:bg-[#2a2a2a] text-[#8fa899] dark:text-[#9ca3af] text-[11px] uppercase tracking-wider font-semibold text-left border-b-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a]"
                                >
                                  {col?.column || 'Coluna'}
                                </th>
                              );
                            })
                          ) : (
                            <th className="px-4 py-3 bg-[#f9fafb] dark:bg-[#2a2a2a] text-[#8fa899] dark:text-[#9ca3af] text-[11px] uppercase tracking-wider font-semibold text-left border-b-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a]">
                              Nenhuma coluna selecionada
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {[0, 1, 2, 3, 4].map(rowIndex => (
                          <tr key={rowIndex} className="hover:bg-[#f9fafb] transition-colors">
                            {selectedColumns.length > 0 ? (
                              selectedColumns.slice(0, 6).map((colKey, colIndex) => (
                                <td
                                  key={colKey}
                                  className="px-4 py-3 border-b border-[#e8ecf0]/50 dark:border-[#3a3a3a]/50 text-[#1a2e1a] dark:text-[#9ca3af]"
                                >
                                  {colIndex === 0 ? `Linha ${rowIndex + 1}` : '—'}
                                </td>
                              ))
                            ) : (
                              <td className="px-4 py-3 border-b border-[#e8ecf0]/50 dark:border-[#3a3a3a]/50 text-[#8fa899] dark:text-[#9ca3af] text-center">
                                Dados de exemplo
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-blue-50 border-[1.5px] border-blue-200 rounded-lg">
                  <div className="text-[13px] text-blue-900">
                    <strong>ℹ️ Informação:</strong> Esta é uma pré-visualização dos dados. Os valores reais serão carregados após gerar o relatório.
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Actions */}
            {currentStep === 6 && (
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#8fa899] dark:text-[#9ca3af] mb-4">
                  Selecionar ações para o relatório
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'save', label: 'Guardar na aplicação', icon: Save, color: 'bg-[#2d6a4f]' },
                    { id: 'csv', label: 'Exportar para CSV', icon: Download, color: 'bg-[#1e88e5]' },
                    { id: 'pdf', label: 'Exportar para PDF', icon: FileText, color: 'bg-[#e63946]' },
                    { id: 'json', label: 'Exportar para JSON', icon: FileJson, color: 'bg-[#f77f00]' },
                  ].map(({ id, label, icon: Icon, color }) => (
                    <div
                      key={id}
                      onClick={() => toggleAction(id)}
                      className={`p-6 rounded-xl border-[1.5px] cursor-pointer transition-all ${
                        selectedActions.includes(id)
                          ? 'bg-[#d8f3dc] dark:bg-[#1b4332] border-[#40916c] shadow-md'
                          : 'bg-white dark:bg-[#2a2a2a] border-[#e8ecf0] dark:border-[#3a3a3a] hover:border-[#40916c]/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="text-[14px] font-semibold text-[#1a2e1a] dark:text-[#9ca3af]">{label}</div>
                        </div>
                        <div
                          className={`w-6 h-6 rounded border-[1.5px] flex items-center justify-center transition-all ${
                            selectedActions.includes(id)
                              ? 'bg-[#40916c] border-[#40916c]'
                              : 'bg-white border-[#d1e8d4] dark:border-[#3a3a3a]'
                          }`}
                        >
                          {selectedActions.includes(id) && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 7: Settings */}
            {currentStep === 7 && (
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8fa899] dark:text-[#9ca3af] mb-2">
                      Agendamento automático
                    </label>
                    <div className="flex gap-2">
                      {['never', 'daily', 'weekly', 'monthly'].map(option => (
                        <button
                          key={option}
                          onClick={() => setSchedule(option)}
                          className={`flex-1 px-3 py-2.5 rounded-lg text-[12px] font-semibold transition-all ${
                            schedule === option
                              ? 'bg-[#2d6a4f] text-white'
                              : 'bg-[#f0f0f0] text-[#6b7280] hover:bg-[#e0e0e0]'
                          }`}
                        >
                          {option === 'never' && 'Nunca'}
                          {option === 'daily' && 'Diário'}
                          {option === 'weekly' && 'Semanal'}
                          {option === 'monthly' && 'Mensal'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8fa899] dark:text-[#9ca3af] mb-2">
                      Enviar por e-mail para
                    </label>
                    <input
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="email@empresa.pt"
                      className="w-full px-4 py-3 bg-white border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] rounded-lg text-[14px] text-[#1a2e1a] dark:text-[#9ca3af] outline-none transition-colors focus:border-[#40916c] placeholder:text-[#8fa899] dark:placeholder:text-[#9ca3af]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8fa899] dark:text-[#9ca3af] mb-2">
                      Formato padrão
                    </label>
                    <select
                      value={defaultFormat}
                      onChange={(e) => setDefaultFormat(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] rounded-lg text-[14px] text-[#1a2e1a] dark:text-[#9ca3af] outline-none transition-colors focus:border-[#40916c]"
                    >
                      <option value="csv">CSV</option>
                      <option value="pdf">PDF</option>
                      <option value="json">JSON</option>
                      <option value="xlsx">Excel (XLSX)</option>
                    </select>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8fa899] dark:text-[#9ca3af] mb-2">
                      Cor dos gráficos
                    </label>
                    <div className="flex gap-2">
                      {CHART_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setChartColor(color)}
                          className={`w-10 h-10 rounded-full transition-all ${
                            chartColor === color ? 'ring-2 ring-[#1a2e1a] ring-offset-2' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8fa899] dark:text-[#9ca3af] mb-2">
                      Fuso horário
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] rounded-lg text-[14px] text-[#1a2e1a] dark:text-[#9ca3af] outline-none transition-colors focus:border-[#40916c]"
                    >
                      <option value="Europe/Lisbon (UTC+0/+1)">Europe/Lisbon (UTC+0/+1)</option>
                      <option value="Europe/London (UTC+0)">Europe/London (UTC+0)</option>
                      <option value="America/New_York (UTC-5)">America/New_York (UTC-5)</option>
                      <option value="Asia/Tokyo (UTC+9)">Asia/Tokyo (UTC+9)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8fa899] dark:text-[#9ca3af] mb-2">
                      Linhas por página
                    </label>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => setRowsPerPage(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] rounded-lg text-[14px] text-[#1a2e1a] dark:text-[#9ca3af] outline-none transition-colors focus:border-[#40916c]"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#e8ecf0] dark:border-[#3a3a3a] flex-shrink-0 bg-[#f9fafb] dark:bg-[#2a2a2a]">
          <div className="w-full px-7 py-3.5 flex items-center justify-end gap-2.5">
            {currentStep > 1 && (
              <button
                onClick={handlePrev}
                className="px-5 py-2.5 rounded-full text-[13px] font-semibold cursor-pointer border-[1.5px] bg-transparent border-[#e8ecf0] dark:border-[#3a3a3a] text-[#4a6358] dark:text-[#9ca3af] transition-all hover:border-[#4a6358] hover:text-[#1a2e1a]"
              >
                ← Anterior
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-[13px] font-semibold cursor-pointer border-[1.5px] bg-transparent border-[#e8ecf0] dark:border-[#3a3a3a] text-[#4a6358] dark:text-[#9ca3af] transition-all hover:border-[#4a6358] hover:text-[#1a2e1a]"
            >
              Cancelar
            </button>
            <button
              onClick={handleNext}
              className={`px-5 py-2.5 rounded-full text-[13px] font-semibold cursor-pointer border-[1.5px] transition-all ${
                currentStep === STEPS.length
                  ? 'bg-[#40916c] text-white border-[#40916c] hover:bg-[#2d6a4f]'
                  : 'bg-[#1b4332] text-white border-[#1b4332] hover:bg-[#2d6a4f]'
              }`}
            >
              {currentStep === STEPS.length ? '✓ Gerar Relatório' : 'Próximo →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}