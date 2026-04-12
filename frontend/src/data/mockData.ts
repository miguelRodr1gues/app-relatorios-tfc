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
    key: "utente",
    name: "Utente",
    emoji: "🧑‍⚕️",
    description: "Dados do utente (informação pessoal e estado)",
    rows: 1280,
    cols: 10,
    columns: [
      { n: "id", label: "ID", type: "number" },
      { n: "contacto", label: "Contacto", type: "text" },
      { n: "nome", label: "Nome", type: "text" },
      { n: "nascimento", label: "Nascimento", type: "date" },
      { n: "sexo", label: "Sexo", type: "text" },
      { n: "nacionalidade", label: "Nacionalidade", type: "text" },
      { n: "ativo", label: "Ativo", type: "text" },
      { n: "local", label: "Local", type: "text" },
      { n: "created_at", label: "Criado em", type: "date" },
      { n: "criado_por", label: "Criado por", type: "number" },
    ],
  },
  {
    key: "episodio",
    name: "Episodio",
    emoji: "🗂️",
    description: "Episódios clínicos associados ao utente",
    rows: 5421,
    cols: 7,
    columns: [
      { n: "id", label: "ID", type: "number" },
      { n: "utente_id", label: "Utente ID", type: "number" },
      { n: "created_at", label: "Criado em", type: "date" },
      { n: "estado", label: "Estado", type: "text" },
      { n: "ativo", label: "Ativo", type: "text" },
      { n: "saida", label: "Saída", type: "date" },
      { n: "tipo_episodio_id", label: "Tipo episódio", type: "number" },
    ],
  },
  {
    key: "tipo_episodio",
    name: "Tipo episodio",
    emoji: "🏷️",
    description: "Tipos de episódio (classificação)",
    rows: 12,
    cols: 2,
    columns: [
      { n: "id", label: "ID", type: "number" },
      { n: "nome", label: "Nome", type: "text" },
    ],
  },
  {
    key: "diario_clinico",
    name: "Diario clinico",
    emoji: "📝",
    description: "Registo diário clínico (nota) por episódio",
    rows: 18450,
    cols: 7,
    columns: [
      { n: "id", label: "ID", type: "number" },
      { n: "episodio_id", label: "Episódio ID", type: "number" },
      { n: "user_id", label: "User ID", type: "number" },
      { n: "tipo_diario_id", label: "Tipo diário", type: "number" },
      { n: "aplicacao_id", label: "Aplicação", type: "number" },
      { n: "created_at", label: "Criado em", type: "date" },
      { n: "nota", label: "Nota", type: "text" },
    ],
  },
  {
    key: "tipo_diario",
    name: "Tipo diario",
    emoji: "📌",
    description: "Tipos de diário (classificação)",
    rows: 8,
    cols: 2,
    columns: [
      { n: "id", label: "ID", type: "number" },
      { n: "nome", label: "Nome", type: "text" },
    ],
  },
  {
    key: "equipa_clinica",
    name: "Equipa clinica",
    emoji: "👥",
    description: "Associação de utilizadores a funções na equipa (por data)",
    rows: 55,
    cols: 4,
    columns: [
      { n: "id", label: "ID", type: "number" },
      { n: "professional_user_id", label: "Professional user", type: "number" },
      { n: "funcao_id", label: "Função", type: "number" },
      { n: "data_inicio", label: "Data início", type: "date" },
    ],
  },
  {
    key: "funcao",
    name: "Funcao",
    emoji: "🧩",
    description: "Funções/roles clínicas (ex.: terapeuta, enfermeiro)",
    rows: 9,
    cols: 2,
    columns: [
      { n: "id", label: "ID", type: "number" },
      { n: "nome", label: "Nome", type: "text" },
    ],
  },
  {
    key: "registo_episodio",
    name: "Registo episodio",
    emoji: "📋",
    description: "Registos associados a um episódio (por utilizador e tipo)",
    rows: 9320,
    cols: 4,
    columns: [
      { n: "id", label: "ID", type: "number" },
      { n: "user_id", label: "User ID", type: "number" },
      { n: "episodio_id", label: "Episódio ID", type: "number" },
      { n: "tipo_episodio_id", label: "Tipo episódio", type: "number" },
    ],
  },
  {
    key: "registo_detalhe",
    name: "Registo detalhe",
    emoji: "🧾",
    description: "Detalhes/classificações do registo (ex.: enfermagem)",
    rows: 20110,
    cols: 3,
    columns: [
      { n: "registo_episodio_id", label: "Registo episódio", type: "number" },
      { n: "enfermagem_id", label: "Enfermagem", type: "number" },
      { n: "rmd", label: "RMD", type: "text" },
    ],
  },
  {
    key: "enfermagem",
    name: "Enfermagem",
    emoji: "💉",
    description: "Domínios/áreas de enfermagem",
    rows: 20,
    cols: 2,
    columns: [
      { n: "id", label: "ID", type: "number" },
      { n: "acao", label: "Ação", type: "text" },
    ],
  },
  {
    key: "programa",
    name: "Programa",
    emoji: "📚",
    description: "Programas disponíveis",
    rows: 6,
    cols: 2,
    columns: [
      { n: "id", label: "ID", type: "number" },
      { n: "nome", label: "Nome", type: "text" },
    ],
  },
  {
    key: "utente_programa",
    name: "Utente programa",
    emoji: "🔗",
    description: "Associação utente ↔ programa",
    rows: 2450,
    cols: 3,
    columns: [
      { n: "id", label: "ID", type: "number" },
      { n: "utente_id", label: "Utente ID", type: "number" },
      { n: "programa_id", label: "Programa ID", type: "number" },
    ],
  },
];

export const REPORTS: ReportDef[] = [
  {
    id: "r1",
    name: "Episódios por tipo",
    category: "Episódios",
    table: "episodio",
    rows: 5421,
    date: "2026-04-08",
    emoji: "🗂️",
  },
  {
    id: "r2",
    name: "Diário clínico — notas recentes",
    category: "Diário Clínico",
    table: "diario_clinico",
    rows: 18450,
    date: "2026-04-08",
    emoji: "📝",
  },
  {
    id: "r3",
    name: "Utentes ativos",
    category: "Utentes",
    table: "utente",
    rows: 1280,
    date: "2026-04-08",
    emoji: "🧑‍⚕️",
  },
  {
    id: "r4",
    name: "Registos de episódio por utilizador",
    category: "Registos",
    table: "registo_episodio",
    rows: 9320,
    date: "2026-04-08",
    emoji: "📋",
  },
  {
    id: "r5",
    name: "Equipa clínica por função",
    category: "Equipa",
    table: "equipa_clinica",
    rows: 55,
    date: "2026-04-08",
    emoji: "👥",
  },
];

export const KPIS: KpiDef[] = [
  { label: "Utentes", value: "1 280", trend: "+2%", highlighted: true },
  { label: "Episódios", value: "5 421", trend: "+1%" },
  { label: "Diários Clínicos", value: "18 450", trend: "+6%" },
  { label: "Relatórios", value: "5", trend: "+0%" },
];

export const ALERTS: AlertDef[] = [
  { message: "Novo diário clínico registado (episódio #431)", time: "há 6 min", color: "#2d6a4f" },
  { message: "Episódio marcado como inativo (utente #102)", time: "há 2 horas", color: "#1e88e5" },
  { message: "Agendamento mensal configurado para 'Episódios por tipo'", time: "ontem", color: "#f77f00" },
];
