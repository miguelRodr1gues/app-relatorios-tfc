import { useCallback, useEffect, useMemo, useState } from 'react';
import { X, Plus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import TableCard from './TableCard';
import SearchBar from './SearchBar';
import { createReport, fetchTableDefinitions, previewReport, type ApiTableDefinition } from '../lib/api';
import { useWizard } from '../context/WizardContext';

interface WizardStep {
  id: string;
  label: string;
}

interface FilterState {
  column: string;
  operator: string;
  value: string;
}

interface AvailableColumn {
  tableKey: string;
  tableName: string;
  columnName: string;
  columnLabel: string;
  key: string;
}

const STEPS: WizardStep[] = [
  { id: 'source', label: 'Fonte de dados' },
  { id: 'columns', label: 'Colunas' },
  { id: 'filters', label: 'Filtros' },
  { id: 'grouping', label: 'Agrupamento' },
  { id: 'preview', label: 'Preview' },
];

const EMPTY_FILTER: FilterState = { column: '', operator: '=', value: '' };

interface ReportWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

function buildColumnKey(tableKey: string, columnName: string) {
  return `${tableKey}::${columnName}`;
}

export default function ReportWizard({ isOpen, onClose }: ReportWizardProps) {
  const wizardContext = useWizard();
  const [currentStep, setCurrentStep] = useState(1);
  const [baseTableKey, setBaseTableKey] = useState('');
  const [selectedRelatedTables, setSelectedRelatedTables] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState[]>([EMPTY_FILTER]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tables, setTables] = useState<ApiTableDefinition[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [tablesError, setTablesError] = useState('');

  const [groupByColumn, setGroupByColumn] = useState('');
  const [aggregateFunctions, setAggregateFunctions] = useState<string[]>([]);
  const [showSubtotals, setShowSubtotals] = useState(false);
  const [showGrandTotal, setShowGrandTotal] = useState(true);
  const [orderBy, setOrderBy] = useState('');

  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [previewRows, setPreviewRows] = useState<Array<Record<string, unknown>>>([]);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState('');

  const loadTables = useCallback(async () => {
    setIsLoadingTables(true);
    setTablesError('');

    try {
      const data = await fetchTableDefinitions({ schema: 'public' });
      setTables(data);
    } catch (error) {
      setTables([]);
      setTablesError(error instanceof Error ? error.message : 'Não foi possível carregar as tabelas da API.');
    } finally {
      setIsLoadingTables(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void loadTables();
  }, [isOpen, loadTables]);

  useEffect(() => {
    setSelectedRelatedTables([]);
    setSelectedColumns([]);
    setFilters([EMPTY_FILTER]);
    setGroupByColumn('');
    setAggregateFunctions([]);
    setShowSubtotals(false);
    setShowGrandTotal(true);
    setOrderBy('');
    setPreviewRows([]);
    setPreviewColumns([]);
    setPreviewError('');
  }, [baseTableKey]);

  const tableLookup = useMemo(
    () => new Map(tables.map((table) => [table.key, table])),
    [tables]
  );

  const filteredTables = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return tables.filter((table) => {
      if (!normalizedQuery) return true;
      return (
        table.name.toLowerCase().includes(normalizedQuery) ||
        table.key.toLowerCase().includes(normalizedQuery) ||
        table.schema?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [tables, searchQuery]);

  const baseTableDefinition = baseTableKey ? tableLookup.get(baseTableKey) : undefined;

  const relatedTableOptions = useMemo(
    () =>
      (baseTableDefinition?.related_tables || [])
        .map((relation) => {
          const table = tableLookup.get(relation.key);
          if (!table) return null;

          return {
            ...table,
            relation,
          };
        })
        .filter((table): table is ApiTableDefinition & { relation: NonNullable<ApiTableDefinition['related_tables']>[number] } => Boolean(table)),
    [baseTableDefinition, tableLookup]
  );

  const includedTables = useMemo(() => {
    const includedTableKeys = baseTableKey ? [baseTableKey, ...selectedRelatedTables] : [];
    return includedTableKeys
      .map((tableKey) => tableLookup.get(tableKey))
      .filter((table): table is ApiTableDefinition => Boolean(table));
  }, [baseTableKey, selectedRelatedTables, tableLookup]);

  const availableColumns = useMemo<AvailableColumn[]>(
    () =>
      includedTables.flatMap((table) =>
        table.columns.map((column) => ({
          tableKey: table.key,
          tableName: table.name,
          columnName: column.n,
          columnLabel: column.label,
          key: buildColumnKey(table.key, column.n),
        }))
      ),
    [includedTables]
  );

  const availableColumnsByKey = useMemo(
    () => new Map(availableColumns.map((column) => [column.key, column])),
    [availableColumns]
  );

  useEffect(() => {
    setSelectedColumns((prev) => prev.filter((columnKey) => availableColumnsByKey.has(columnKey)));
    setFilters((prev) => prev.map((filter) => (
      filter.column && !availableColumnsByKey.has(filter.column)
        ? { ...filter, column: '', value: '' }
        : filter
    )));
    if (groupByColumn && !availableColumnsByKey.has(groupByColumn)) {
      setGroupByColumn('');
    }
    if (orderBy && !availableColumnsByKey.has(orderBy)) {
      setOrderBy('');
    }
  }, [availableColumnsByKey, groupByColumn, orderBy]);

  const selectedColumnLabels = useMemo(
    () =>
      selectedColumns
        .map((columnKey) => availableColumnsByKey.get(columnKey))
        .filter((column): column is AvailableColumn => Boolean(column)),
    [availableColumnsByKey, selectedColumns]
  );

  const activeFilters = useMemo(
    () => filters.filter((filter) => filter.column && filter.value),
    [filters]
  );

  const normalizedColumnSelections = useMemo(
    () =>
      selectedColumns
        .map((columnKey) => {
          const column = availableColumnsByKey.get(columnKey);
          if (!column) return null;
          return {
            table: column.tableKey,
            column: column.columnName,
          };
        })
        .filter((column): column is { table: string; column: string } => Boolean(column)),
    [availableColumnsByKey, selectedColumns]
  );

  const normalizedPreviewFilters = useMemo(
    () =>
      activeFilters
        .map((activeFilter) => {
          const selectedColumn = availableColumnsByKey.get(activeFilter.column);
          if (!selectedColumn) return null;
          return {
            table: selectedColumn.tableKey,
            column: selectedColumn.columnName,
            operator: activeFilter.operator,
            value: activeFilter.value,
          };
        })
        .filter((normalizedFilter): normalizedFilter is { table: string; column: string; operator: string; value: string } => Boolean(normalizedFilter)),
    [activeFilters, availableColumnsByKey]
  );

  useEffect(() => {
    if (currentStep !== 5) return;
    if (!baseTableKey || normalizedColumnSelections.length === 0) {
      setPreviewRows([]);
      setPreviewColumns([]);
      setPreviewError('');
      setIsLoadingPreview(false);
      return;
    }

    let isMounted = true;

    const loadPreview = async () => {
      setIsLoadingPreview(true);
      setPreviewError('');

      try {
        const response = await previewReport({
          base_table: baseTableKey,
          related_tables: selectedRelatedTables,
          columns: normalizedColumnSelections,
          filters: normalizedPreviewFilters,
        });

        if (!isMounted) return;
        setPreviewColumns(response.columns);
        setPreviewRows(response.rows.slice(0, 10));
      } catch (error) {
        if (!isMounted) return;
        setPreviewRows([]);
        setPreviewColumns([]);
        setPreviewError(error instanceof Error ? error.message : 'Não foi possível carregar a pré-visualização.');
      } finally {
        if (isMounted) setIsLoadingPreview(false);
      }
    };

    void loadPreview();

    return () => {
      isMounted = false;
    };
  }, [baseTableKey, currentStep, normalizedColumnSelections, normalizedPreviewFilters, selectedRelatedTables]);

  const toggleRelatedTable = (tableKey: string) => {
    setSelectedRelatedTables((prev) =>
      prev.includes(tableKey) ? prev.filter((key) => key !== tableKey) : [...prev, tableKey]
    );
  };

  const toggleColumn = (columnKey: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnKey) ? prev.filter((key) => key !== columnKey) : [...prev, columnKey]
    );
  };

  const toggleAggregateFunction = (func: string) => {
    setAggregateFunctions((prev) =>
      prev.includes(func) ? prev.filter((item) => item !== func) : [...prev, func]
    );
  };

  const addFilter = () => {
    setFilters((prev) => [...prev, EMPTY_FILTER]);
  };

  const removeFilter = (index: number) => {
    setFilters((prev) => prev.filter((_, filterIndex) => filterIndex !== index));
  };

  const updateFilter = (index: number, field: keyof FilterState, value: string) => {
    setFilters((prev) =>
      prev.map((filter, filterIndex) => (
        filterIndex === index ? { ...filter, [field]: value } : filter
      ))
    );
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    setErrorMessage('');

    if (!reportName.trim()) {
      setErrorMessage('Por favor indique um nome para o relatório');
      return;
    }

    if (!baseTableKey) {
      setErrorMessage('Selecione uma tabela principal');
      return;
    }

    if (normalizedColumnSelections.length === 0) {
      setErrorMessage('Selecione pelo menos uma coluna para incluir no relatório');
      return;
    }

    try {
      setIsCreating(true);
      await createReport({
        name: reportName.trim(),
        description: reportDescription.trim(),
        base_table: baseTableKey,
        related_tables: selectedRelatedTables,
        columns: normalizedColumnSelections,
        filters: normalizedPreviewFilters,
        generate_files: false,
      });
      wizardContext.closeWizard();
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao guardar o relatório');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="fixed inset-0 bg-black/35 backdrop-blur-sm z-[100] flex items-start justify-center overflow-y-auto">
      <div className="bg-[#fafafa] dark:bg-[#1a1a1a] w-full min-h-screen flex flex-col animate-[fadeUp_0.2s_ease]">
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
                onClick={() => { wizardContext.closeWizard(); onClose(); }}
                className="w-8 h-8 rounded-full border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] bg-transparent text-[#4a6358] dark:text-[#9ca3af] flex items-center justify-center cursor-pointer transition-all hover:bg-[#f4f6f8] dark:hover:bg-[#1a1a1a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full">
          <div className="w-full px-7 py-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#8fa899] dark:text-[#9ca3af] mb-2">
                    Selecionar tabela principal
                  </label>
                  <div className="mb-4">
                    <SearchBar
                      placeholder="Pesquisar tabelas..."
                      value={searchQuery}
                      onChange={setSearchQuery}
                    />
                  </div>
                  <div className="grid grid-cols-5 gap-4 max-h-[400px] overflow-y-auto">
                    {isLoadingTables && tables.length === 0 ? (
                      <div className="col-span-3 text-center py-10 text-[13px] text-[#8fa899] dark:text-[#9ca3af]">
                        A carregar tabelas a partir da API...
                      </div>
                    ) : tablesError ? (
                      <div className="col-span-3 rounded-[10px] border-[1.5px] border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/40 px-4 py-5 text-center">
                        <div className="text-[13px] font-semibold text-red-700 dark:text-red-400 mb-2">
                          Não foi possível carregar as tabelas
                        </div>
                        <div className="text-[12px] text-red-600 dark:text-red-300 mb-4">{tablesError}</div>
                        <button
                          onClick={() => void loadTables()}
                          className="px-4 py-2 rounded-full text-[12px] font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                          Tentar novamente
                        </button>
                      </div>
                    ) : filteredTables.length > 0 ? (
                      filteredTables.map((table) => (
                        <TableCard
                          key={table.key}
                          table={table}
                          isSelected={baseTableKey === table.key}
                          onClick={() => setBaseTableKey((prev) => prev === table.key ? '' : table.key)}
                        />
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-5 text-[13px] text-[#8fa899] dark:text-[#9ca3af]">
                        {searchQuery
                          ? <>Nenhuma tabela encontrada para "<b>{searchQuery}</b>"</>
                          : 'Nenhuma tabela disponível na API.'}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#8fa899] dark:text-[#9ca3af] mb-2">
                    Selecionar tabelas relacionadas
                  </label>
                  {baseTableKey ? (
                    relatedTableOptions.length > 0 ? (
                      <div className="grid grid-cols-5 gap-4 max-h-[320px] overflow-y-auto">
                        {relatedTableOptions.map((table) => (
                          <TableCard
                            key={table.key}
                            table={table}
                            subtitle={`${table.relation.direction === 'incoming' ? 'Relacionada por' : 'Ligada por'} ${table.relation.from_column}`}
                            isSelected={selectedRelatedTables.includes(table.key)}
                            onClick={() => toggleRelatedTable(table.key)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-[13px] text-[#8fa899] dark:text-[#9ca3af]">
                        Esta tabela não tem relações diretas disponíveis.
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12 text-[13px] text-[#8fa899] dark:text-[#9ca3af]">
                      Selecione primeiro a tabela principal.
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#8fa899] dark:text-[#9ca3af] mb-3">
                  Selecionar colunas para incluir no relatório
                </label>
                {availableColumns.length > 0 ? (
                  <div className="grid grid-cols-5 gap-4 max-h-[400px] overflow-y-auto">
                    {availableColumns.map((column) => (
                      <TableCard
                        key={column.key}
                        table={{ key: column.key, name: column.columnLabel }}
                        subtitle={column.tableName}
                        isSelected={selectedColumns.includes(column.key)}
                        onClick={() => toggleColumn(column.key)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-[#8fa899] dark:text-[#9ca3af]">
                    <div className="text-[13px]">Selecione a tabela principal e as tabelas relacionadas no passo anterior</div>
                  </div>
                )}
              </div>
            )}

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
                              {availableColumns.map((column) => (
                                <option key={column.key} value={column.key}>
                                  {column.tableName} — {column.columnLabel}
                                </option>
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

            {currentStep === 4 && (
              <div className="grid grid-cols-2 gap-6">
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
                      {availableColumns.map((column) => (
                        <option key={column.key} value={column.key}>
                          {column.tableName} — {column.columnLabel}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8fa899] dark:text-[#9ca3af] mb-3">
                      Funções agregadas
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {['SOMA', 'MÉDIA', 'CONTAGEM', 'MIN', 'MAX'].map((func) => (
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
                            <div className="w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform peer-checked:translate-x-5 translate-x-0.5 translate-y-0.5" />
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
                            <div className="w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform peer-checked:translate-x-5 translate-x-0.5 translate-y-0.5" />
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
                      {availableColumns.map((column) => (
                        <option key={column.key} value={column.key}>
                          {column.tableName} — {column.columnLabel}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#8fa899] dark:text-[#9ca3af] mb-3">
                  Preview do relatório
                </label>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-[#2a2a2a] border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] rounded-lg p-4">
                      <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#8fa899] dark:text-[#9ca3af] mb-2">
                        Nome do relatório
                      </label>
                      <input
                        type="text"
                        value={reportName}
                        onChange={(e) => setReportName(e.target.value)}
                        placeholder="Ex: Relatório de Utentes Ativos"
                        className="w-full px-4 py-3 bg-[#f9fafb] dark:bg-[#1a1a1a] border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] rounded-lg text-[14px] text-[#1a2e1a] dark:text-[#9ca3af] outline-none transition-colors focus:border-[#40916c]"
                      />
                    </div>
                    <div className="bg-white dark:bg-[#2a2a2a] border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] rounded-lg p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8fa899] dark:text-[#9ca3af] mb-2">
                        Tabelas incluídas
                      </div>
                      <div className="text-[14px] font-semibold text-[#1a2e1a] dark:text-white">
                        {includedTables.length > 0
                          ? includedTables.map((table) => table.name).join(', ')
                          : 'Nenhuma tabela selecionada'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#2a2a2a] border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] rounded-lg p-4">
                    <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#8fa899] dark:text-[#9ca3af] mb-2">
                      Descrição do relatório
                    </label>
                    <input
                      type="text"
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Breve descrição do relatório"
                      className="w-full px-4 py-3 bg-[#f9fafb] dark:bg-[#1a1a1a] border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] rounded-lg text-[14px] text-[#1a2e1a] dark:text-[#9ca3af] outline-none transition-colors focus:border-[#40916c]"
                    />
                  </div>

                  <div className="bg-white dark:bg-[#2a2a2a] border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] rounded-lg p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8fa899] dark:text-[#9ca3af] mb-2">
                      Colunas selecionadas
                    </div>
                    {selectedColumnLabels.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedColumnLabels.map((column) => (
                          <span
                            key={column.key}
                            className="px-3 py-1.5 rounded-full bg-[#f3f6f4] dark:bg-[#1a1a1a] text-[12px] font-medium text-[#1a2e1a] dark:text-[#9ca3af]"
                          >
                            {column.tableName} — {column.columnLabel}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[13px] text-[#8fa899] dark:text-[#9ca3af]">
                        Nenhuma coluna selecionada.
                      </div>
                    )}
                  </div>

                  <div className="bg-white dark:bg-[#2a2a2a] border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] rounded-lg p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8fa899] dark:text-[#9ca3af] mb-2">
                      Filtros aplicados
                    </div>
                    {activeFilters.length > 0 ? (
                      <div className="space-y-2">
                        {activeFilters.map((filter, index) => {
                          const column = availableColumnsByKey.get(filter.column);
                          const filterLabel = column ? `${column.tableName} — ${column.columnLabel}` : filter.column;
                          return (
                            <div key={`${filter.column}-${index}`} className="text-[13px] text-[#1a2e1a] dark:text-[#9ca3af]">
                              <strong>{filterLabel}</strong> {filter.operator} <span>{filter.value}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-[13px] text-[#8fa899] dark:text-[#9ca3af]">
                        Sem filtros aplicados.
                      </div>
                    )}
                  </div>

                  <div className="bg-white dark:bg-[#2a2a2a] border-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8fa899] dark:text-[#9ca3af]">
                        Pré-visualização dos dados
                      </div>
                      <div className="text-[12px] text-[#8fa899] dark:text-[#9ca3af]">
                        Máximo de 10 linhas
                      </div>
                    </div>

                    {isLoadingPreview ? (
                      <div className="text-[13px] text-[#8fa899] dark:text-[#9ca3af] py-6 text-center">
                        A carregar pré-visualização...
                      </div>
                    ) : previewError ? (
                      <div className="text-[13px] text-red-600 dark:text-red-400 py-4">
                        {previewError}
                      </div>
                    ) : previewColumns.length > 0 && previewRows.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-[13px]">
                          <thead>
                            <tr>
                              {previewColumns.map((column) => (
                                <th
                                  key={column}
                                  className="px-4 py-3 bg-[#f9fafb] dark:bg-[#1a1a1a] text-[#8fa899] dark:text-[#9ca3af] text-[11px] uppercase tracking-wider font-semibold text-left border-b-[1.5px] border-[#e8ecf0] dark:border-[#3a3a3a]"
                                >
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewRows.map((row, rowIndex) => (
                              <tr key={rowIndex} className="hover:bg-[#f9fafb] dark:hover:bg-[#1f2937] transition-colors">
                                {previewColumns.map((column) => (
                                  <td
                                    key={`${rowIndex}-${column}`}
                                    className="px-4 py-3 border-b border-[#e8ecf0]/50 dark:border-[#3a3a3a]/50 text-[#1a2e1a] dark:text-[#9ca3af]"
                                  >
                                    {String(row[column] ?? '—')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-[13px] text-[#8fa899] dark:text-[#9ca3af] py-4">
                        Ainda não existem dados carregados para mostrar. O resumo da configuração do relatório está acima.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[#e8ecf0] dark:border-[#3a3a3a] flex-shrink-0 bg-[#f9fafb] dark:bg-[#2a2a2a]">
          <div className="w-full px-7 py-3.5">
            {errorMessage && (
              <div className="mb-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 p-3">
                <div className="text-[13px] text-red-700 dark:text-red-400 font-medium flex items-start gap-2">
                  <span className="flex-shrink-0 mt-0.5">⚠</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-end gap-2.5">
              {currentStep > 1 && (
                <button
                  onClick={handlePrev}
                  disabled={isCreating}
                  className="px-5 py-2.5 rounded-full text-[13px] font-semibold cursor-pointer border-[1.5px] bg-transparent border-[#e8ecf0] dark:border-[#3a3a3a] text-[#4a6358] dark:text-[#9ca3af] transition-all hover:border-[#4a6358] hover:text-[#1a2e1a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Anterior
                </button>
              )}
              <button
                onClick={() => { wizardContext.closeWizard(); onClose(); }}
                disabled={isCreating}
                className="px-5 py-2.5 rounded-full text-[13px] font-semibold cursor-pointer border-[1.5px] bg-transparent border-[#e8ecf0] dark:border-[#3a3a3a] text-[#4a6358] dark:text-[#9ca3af] transition-all hover:border-[#4a6358] hover:text-[#1a2e1a] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleNext}
                disabled={isCreating}
                className={`px-5 py-2.5 rounded-full text-[13px] font-semibold cursor-pointer border-[1.5px] transition-all flex items-center gap-2 ${
                  currentStep === STEPS.length
                    ? 'bg-[#40916c] text-white border-[#40916c] hover:bg-[#2d6a4f] disabled:opacity-50 disabled:cursor-not-allowed'
                    : 'bg-[#1b4332] text-white border-[#1b4332] hover:bg-[#2d6a4f] disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {isCreating && (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {currentStep === STEPS.length
                  ? (isCreating ? 'A guardar...' : 'Gerar Relatório')
                  : (
                    <>
                      Seguinte
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
