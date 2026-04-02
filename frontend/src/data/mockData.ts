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
  trend?: string;
  highlighted?: boolean;
};

export type AlertDef = {
  message: string;
  time: string;
  color: string;
};

// Nota: estes dados são placeholders para o UI compilar.
// Quando ligares ao backend, vais substituir isto por chamadas à tua API.
export const TABLES: TableDef[] = [
  {
    key: "clientes",
    name: "Clientes",
    emoji: "👥",
    description: "Tabela de clientes",
    rows: 1280,
    cols: 4,
    columns: [
      { n: "id", label: "ID", type: "number" },
      { n: "nome", label: "Nome", type: "text" },
      { n: "email", label: "Email", type: "text" },
      { n: "data_criacao", label: "Data Criação", type: "date" },
    ],
  },
  {
    key: "vendas",
    name: "Vendas",
    emoji: "🧾",
    description: "Registos de vendas",
    rows: 54210,
    cols: 4,
    columns: [
      { n: "id", label: "ID", type: "number" },
      { n: "cliente_id", label: "Cliente", type: "number" },
      { n: "valor", label: "Valor", type: "number" },
      { n: "data", label: "Data", type: "date" },
    ],
  },
  {
    key: "produtos",
    name: "Produtos",
    emoji: "📦",
    description: "Catálogo de produtos",
    rows: 350,
    cols: 3,
    columns: [
      { n: "id", label: "ID", type: "number" },
      { n: "nome", label: "Nome", type: "text" },
      { n: "preco", label: "Preço", type: "number" },
    ],
  },
];

export const REPORTS: ReportDef[] = [
  {
    id: "r1",
    name: "Vendas por dia",
    category: "Vendas",
    table: "vendas",
    rows: 54210,
    date: "2026-04-02",
    emoji: "📈",
  },
  {
    id: "r2",
    name: "Clientes ativos",
    category: "Clientes",
    table: "clientes",
    rows: 1280,
    date: "2026-04-02",
    emoji: "👥",
  },
];

export const KPIS: KpiDef[] = [
  { label: "Total de Relatórios", value: "12", trend: "+8%", highlighted: true },
  { label: "Relatórios Concluídos", value: "9", trend: "+3%" },
  { label: "Tabelas Disponíveis", value: "3", trend: "+0%" },
  { label: "Alertas Ativos", value: "1", trend: "-1" },
];

export const ALERTS: AlertDef[] = [
  { message: "Falha na sincronização da tabela 'vendas' (retry agendado)", time: "há 5 min", color: "#e63946" },
  { message: "Nova tabela detetada: produtos_importados", time: "há 2 horas", color: "#1e88e5" },
  { message: "Relatório 'Vendas por dia' gerado com sucesso", time: "ontem", color: "#2d6a4f" },
];
