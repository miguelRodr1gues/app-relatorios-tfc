# Casos de Uso do Sistema

## Autenticação

### UC-01 — Iniciar Sessão

**Descrição:**
O utilizador autentica-se na aplicação através do endereço de email e de um código de verificação enviado automaticamente.

**Ator Principal:**

* Utilizador

**Pré-condições:**

* O utilizador deve possuir uma conta registada.

**Fluxo Principal:**

1. O utilizador introduz o endereço de email.
2. O sistema envia um código de verificação para o email indicado.
3. O utilizador introduz o código recebido.
4. O sistema valida o código.
5. O sistema autentica o utilizador e inicia a sessão.

**Pós-condições:**

* A sessão do utilizador fica ativa.

---

### UC-02 — Criar Conta

**Descrição:**
Um novo utilizador pode registar-se na plataforma através do preenchimento dos seus dados pessoais e validação do código enviado por email.

**Ator Principal:**

* Utilizador

**Fluxo Principal:**

1. O utilizador preenche o formulário de registo.
2. O sistema valida os dados inseridos.
3. O sistema envia um código de verificação para o email fornecido.
4. O utilizador introduz o código recebido.
5. O sistema cria a conta.

**Pós-condições:**

* A conta do utilizador fica registada no sistema.

---

### UC-03 — Iniciar Sessão com Google

**Descrição:**
O utilizador autentica-se utilizando uma conta Google.

**Ator Principal:**

* Utilizador

**Fluxo Principal:**

1. O utilizador seleciona a opção “Continuar com Google”.
2. O sistema redireciona para a autenticação Google.
3. O utilizador autoriza o acesso.
4. O sistema autentica o utilizador.

**Pós-condições:**

* A sessão do utilizador fica ativa.

---

### UC-04 — Reenviar Código de Verificação

**Descrição:**
O utilizador pode solicitar um novo código de verificação caso o anterior tenha expirado ou não tenha sido recebido.

**Ator Principal:**

* Utilizador

**Fluxo Principal:**

1. O utilizador seleciona a opção de reenviar código.
2. O sistema gera um novo código.
3. O sistema envia o novo código para o email do utilizador.

---

### UC-05 — Terminar Sessão

**Descrição:**
O utilizador pode terminar a sessão ativa através da funcionalidade de logout.

**Ator Principal:**

* Utilizador

**Fluxo Principal:**

1. O utilizador seleciona a opção “Terminar Sessão”.
2. O sistema encerra a sessão ativa.
3. O sistema redireciona o utilizador para a página inicial.

---

# Navegação

### UC-06 — Navegar entre Módulos

**Descrição:**
O utilizador pode navegar entre as diferentes áreas da aplicação.

**Módulos Disponíveis:**

* Dashboard
* Relatórios
* Estrutura
* Análises
* Definições

---

### UC-07 — Minimizar ou Expandir o Menu Lateral

**Descrição:**
O utilizador pode ajustar o tamanho do menu lateral para melhorar a experiência de navegação.

---

### UC-08 — Pesquisar Conteúdo

**Descrição:**
O utilizador pode utilizar a pesquisa global para encontrar relatórios, tabelas e conteúdos rapidamente.

---

# Dashboard

### UC-09 — Visualizar Indicadores

**Descrição:**
O utilizador pode consultar métricas, gráficos e indicadores resumidos no dashboard principal.

---

### UC-10 — Aceder Rapidamente a Funcionalidades

**Descrição:**
O dashboard permite acesso rápido às funcionalidades principais da aplicação.

---

### UC-11 — Visualizar Relatórios Recentes

**Descrição:**
O utilizador pode visualizar os relatórios mais recentes diretamente no dashboard.

---

# Gestão de Relatórios

### UC-12 — Consultar Relatórios

**Descrição:**
O utilizador pode visualizar a lista de relatórios disponíveis.

---

### UC-13 — Pesquisar Relatórios

**Descrição:**
O utilizador pode pesquisar e filtrar relatórios através do nome ou tabela associada.

---

### UC-14 — Abrir Relatório

**Descrição:**
O utilizador pode abrir um relatório para consultar os seus dados detalhados.

---

### UC-15 — Exportar Relatório

**Descrição:**
O utilizador pode exportar relatórios em diferentes formatos.

**Formatos Disponíveis:**

* JSON
* CSV
* PDF

---

### UC-16 — Copiar Ligação do Relatório

**Descrição:**
O utilizador pode copiar a ligação direta de um relatório para partilha.

---

### UC-17 — Eliminar Relatório

**Descrição:**
O utilizador pode eliminar relatórios existentes após confirmação.

---

# Criação de Relatórios

### UC-18 — Selecionar Fonte de Dados

**Descrição:**
O utilizador pode selecionar as tabelas que irão servir de base ao relatório.

---

### UC-19 — Selecionar Colunas

**Descrição:**
O utilizador pode escolher as colunas que pretende visualizar no relatório.

---

### UC-20 — Definir Filtros

**Descrição:**
O utilizador pode aplicar filtros aos dados apresentados no relatório.

---

### UC-21 — Configurar Agrupamentos

**Descrição:**
O utilizador pode configurar agrupamentos, ordenação e totais.

---

### UC-22 — Visualizar Pré-visualização

**Descrição:**
O utilizador pode consultar uma pré-visualização do relatório antes de o guardar.

---

### UC-23 — Guardar Relatório

**Descrição:**
O utilizador pode guardar o relatório criado.

---

### UC-24 — Cancelar Criação de Relatório

**Descrição:**
O utilizador pode cancelar o processo de criação sem guardar alterações.

---

# Estrutura da Base de Dados

### UC-25 — Explorar Estrutura da Base de Dados

**Descrição:**
O utilizador pode visualizar tabelas e relações através de um grafo interativo.

---

### UC-26 — Pesquisar no Grafo

**Descrição:**
O utilizador pode procurar tabelas, colunas e relações específicas no grafo.

---

### UC-27 — Interagir com o Grafo

**Descrição:**
O utilizador pode mover elementos, aplicar zoom e navegar livremente no esquema visual.

---

# Área de Análises

### UC-28 — Consultar Métricas e Gráficos

**Descrição:**
O utilizador pode visualizar métricas analíticas e gráficos estatísticos.

---

# Definições

### UC-29 — Alterar Tema da Aplicação

**Descrição:**
O utilizador pode alternar entre o modo claro e escuro.

---

### UC-30 — Gerir Preferências de Notificações

**Descrição:**
O utilizador pode ativar ou desativar notificações da aplicação.

---

### UC-31 — Editar Dados da Conta

**Descrição:**
O utilizador pode alterar informações básicas do perfil.

---

# Sistema

### UC-32 — Validação Automática de Sessão

**Descrição:**
O sistema verifica automaticamente se existe uma sessão válida ativa.

---

### UC-33 — Tratamento de Erros

**Descrição:**
O sistema apresenta mensagens de erro quando ocorre uma falha de comunicação ou operação.

---

### UC-34 — Redirecionamento de Rotas Inválidas

**Descrição:**
O sistema redireciona automaticamente acessos inválidos para uma rota válida.
