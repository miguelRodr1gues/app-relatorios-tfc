export type TableColumn = {
  n: string;
  label: string;
  type?: "text" | "number" | "date";
};

export type TableDef = {
  key: string;
  name: string;
  emoji?: string;
  description?: string;
  rows?: number;
  cols?: number;
  columns: TableColumn[];
};

export type ReportDef = {
  id: string;
  name: string;
  category: string;
  table: string;
  rows: number;
  date: string;
  emoji: string;
};

export type KpiDef = {
  label: string;
  value: string;
  highlighted?: boolean;
};

export const KPIS: KpiDef[] = [
  { label: "Utentes", value: "1 280", highlighted: true },
  { label: "Episódios", value: "5 421"},
  { label: "Diários Clínicos", value: "18 450" },
  { label: "Relatórios", value: "5"},
];
