# Casos de Uso

## Indice

1. [Objetivo](#objetivo)
2. [Atores](#atores)
3. [Resumo dos casos de uso](#resumo-dos-casos-de-uso)
4. [Autenticacao e sessao](#autenticacao-e-sessao)
5. [Dashboard](#dashboard)
6. [Criacao de relatorios](#criacao-de-relatorios)
7. [Gestao de relatorios](#gestao-de-relatorios)
8. [Exportacao](#exportacao)
9. [Estrutura da base de dados](#estrutura-da-base-de-dados)
10. [Configuracoes e navegacao](#configuracoes-e-navegacao)

## Objetivo

Este documento descreve os principais casos de uso do MVP da aplicacao de relatorios. O foco e permitir que um utilizador autenticado consulte a estrutura da base de dados, crie relatorios dinamicos, visualize resultados, guarde configuracoes e exporte dados sem persistir ficheiros no servidor.

## Atores

| Ator | Descricao |
| --- | --- |
| Visitante | Utilizador sem sessao iniciada. Pode aceder aos ecras de login, registo e verificacao de codigo. |
| Utilizador autenticado | Utilizador com sessao JWT ativa. Pode aceder a dashboard, relatorios, wizard, exportacoes e estrutura. |
| Criador do relatorio | Utilizador autenticado que criou um relatorio. Pode eliminar o seu relatorio e definir visibilidade. |
| Outro utilizador autenticado | Utilizador que pode consultar relatorios publicos criados por terceiros. |
| Sistema externo Google | Fornecedor OAuth usado no login social. |
| Base de dados operacional | PostgreSQL com as tabelas usadas para pesquisa, preview, contagem e exportacao. |

## Resumo dos casos de uso

| ID | Caso de uso | Ator principal | Prioridade MVP |
| --- | --- | --- | --- |
| UC-01 | Registar conta por email | Visitante | Alta |
| UC-02 | Verificar codigo OTP | Visitante | Alta |
| UC-03 | Login por email | Visitante | Alta |
| UC-04 | Login com Google | Visitante | Alta |
| UC-05 | Renovar sessao JWT | Utilizador autenticado | Alta |
| UC-06 | Terminar sessao | Utilizador autenticado | Alta |
| UC-07 | Consultar dashboard | Utilizador autenticado | Alta |
| UC-08 | Configurar KPIs da dashboard | Utilizador autenticado | Media |
| UC-09 | Pesquisar entidades | Utilizador autenticado | Alta |
| UC-10 | Criar relatorio no wizard | Utilizador autenticado | Alta |
| UC-11 | Pre-visualizar relatorio | Utilizador autenticado | Alta |
| UC-12 | Guardar relatorio | Utilizador autenticado | Alta |
| UC-13 | Definir visibilidade publica ou privada | Criador do relatorio | Alta |
| UC-14 | Listar relatorios | Utilizador autenticado | Alta |
| UC-15 | Pesquisar relatorios | Utilizador autenticado | Media |
| UC-16 | Eliminar relatorio | Criador do relatorio | Alta |
| UC-17 | Exportar relatorio | Utilizador autenticado | Alta |
| UC-18 | Consultar diagrama ER | Utilizador autenticado | Alta |
| UC-19 | Usar layout responsivo e navegacao lateral | Utilizador autenticado | Media |
| UC-20 | Consultar mensagens de erro e estados vazios | Utilizador autenticado | Alta |

## Autenticacao e sessao

### UC-01 Registar conta por email

**Objetivo:** Criar uma conta atraves de nome, apelido e email.

**Pre-condicoes:** O visitante nao esta autenticado.

**Fluxo principal:**

1. O visitante acede a `/register`.
2. Preenche nome, apelido e email.
3. O sistema valida os dados.
4. O sistema cria ou atualiza um utilizador inativo.
5. O sistema envia codigo OTP por email.
6. O visitante e encaminhado para verificacao de codigo.

**Fluxos alternativos:**

1. Email ja registado e ativo: o sistema apresenta erro.
2. Falha SMTP: o sistema informa que nao foi possivel enviar o codigo.
3. Dados invalidos: o sistema bloqueia o envio e mostra validacao.

### UC-02 Verificar codigo OTP

**Objetivo:** Confirmar login ou registo atraves de codigo temporario.

**Pre-condicoes:** Existe um desafio OTP valido.

**Fluxo principal:**

1. O utilizador acede a `/verify-code`.
2. Introduz o codigo recebido por email.
3. O sistema valida token, codigo, expiracao e tentativas.
4. O sistema ativa a conta quando o objetivo e registo.
5. O sistema emite cookies JWT.
6. O utilizador e redirecionado para `/dashboard`.

**Fluxos alternativos:**

1. Codigo incorreto: incrementa tentativas e apresenta erro.
2. Codigo expirado: bloqueia validacao e pede novo codigo.
3. Codigo ja usado: rejeita a tentativa.
4. Token inexistente: apresenta erro de codigo invalido.

### UC-03 Login por email

**Objetivo:** Iniciar sessao com email e codigo OTP.

**Pre-condicoes:** Conta ativa e verificada.

**Fluxo principal:**

1. O visitante acede a `/login`.
2. Introduz o email.
3. O sistema envia OTP.
4. O visitante introduz o codigo.
5. O sistema cria sessao JWT.

**Fluxos alternativos:**

1. Conta inexistente ou nao verificada: apresenta erro.
2. Falha no envio de email: apresenta erro operacional.

### UC-04 Login com Google

**Objetivo:** Iniciar sessao atraves de token Google.

**Pre-condicoes:** O frontend obtem um token Google valido.

**Fluxo principal:**

1. O visitante clica em login Google.
2. O Google devolve token de identidade ou acesso.
3. O backend valida o token.
4. O sistema cria ou atualiza o utilizador.
5. O sistema emite cookies JWT.

**Fluxos alternativos:**

1. Token invalido: apresenta erro e nao autentica.
2. Dados Google incompletos: cria utilizador com os dados disponiveis.

### UC-05 Renovar sessao JWT

**Objetivo:** Manter a sessao ativa quando o access token expira.

**Pre-condicoes:** Existe refresh token valido em cookie.

**Fluxo principal:**

1. Um pedido protegido recebe 401.
2. O frontend chama `/api/auth/refresh/`.
3. O backend valida o refresh token.
4. O backend emite novo access token.
5. O pedido original e repetido.

**Fluxos alternativos:**

1. Refresh token ausente: utilizador deixa de estar autenticado.
2. Refresh token invalido: cookies sao limpos e o utilizador deve voltar ao login.

### UC-06 Terminar sessao

**Objetivo:** Sair da aplicacao com limpeza dos cookies JWT.

**Fluxo principal:**

1. O utilizador aciona logout.
2. O backend remove cookies de access e refresh.
3. O frontend limpa o utilizador em memoria.
4. O utilizador e enviado para login.

## Dashboard

### UC-07 Consultar dashboard

**Objetivo:** Visualizar resumo dos relatorios e metricas principais.

**Fluxo principal:**

1. O utilizador acede a `/dashboard`.
2. O sistema carrega relatorios e entidades.
3. O sistema apresenta KPIs configurados.
4. O sistema apresenta a tabela de relatorios recentes.

**Fluxos alternativos:**

1. Falha na API: mostra estado de erro e evita quebra da pagina.
2. Sem relatorios: mostra estado vazio orientativo.

### UC-08 Configurar KPIs da dashboard

**Objetivo:** Escolher ate quatro metricas visiveis na dashboard.

**Fluxo principal:**

1. O utilizador clica em adicionar metrica.
2. Pesquisa ou escolhe uma metrica disponivel.
3. O sistema adiciona o card.
4. O sistema persiste a escolha no `localStorage` por utilizador.

**Fluxos alternativos:**

1. Limite de metricas atingido: nao permite adicionar mais.
2. Metrica removida: o card desaparece e a configuracao e atualizada.
3. Logout e novo login: as metricas do utilizador sao restauradas.

## Criacao de relatorios

### UC-09 Pesquisar entidades

**Objetivo:** Encontrar tabelas ou views disponiveis para relatorios.

**Fluxo principal:**

1. O utilizador abre o wizard.
2. O frontend chama `/api/entities/`.
3. O utilizador pesquisa por nome, schema ou chave.
4. O sistema lista entidades com colunas, total estimado de linhas e relacoes.

**Fluxos alternativos:**

1. Nenhuma entidade encontrada: mostra estado vazio.
2. Falha de schema ou base de dados: mostra erro claro.

### UC-10 Criar relatorio no wizard

**Objetivo:** Configurar relatorio atraves de passos validados.

**Fluxo principal:**

1. Seleciona tabela principal.
2. Seleciona tabelas relacionadas quando existem.
3. Seleciona colunas.
4. Define filtros opcionais.
5. Revê preview e resumo.
6. Indica nome, descricao e visibilidade.
7. Guarda o relatorio.

**Regras funcionais:**

1. Nao e possivel avancar sem tabela principal.
2. Nao e possivel avancar sem colunas.
3. Filtros incompletos bloqueiam o avanco.
4. Passos anteriores podem ser reabertos sem perder dados.
5. Passos futuros so ficam disponiveis quando os anteriores estao validos.
6. Cancelar com dados preenchidos abre confirmacao.

### UC-11 Pre-visualizar relatorio

**Objetivo:** Ver amostra dos dados antes de guardar.

**Fluxo principal:**

1. O utilizador chega ao passo de preview.
2. O sistema envia tabela, colunas, relacoes e filtros.
3. O backend valida os dados contra a base.
4. O backend devolve ate 10 linhas.
5. O frontend apresenta resumo e tabela de preview.

**Fluxos alternativos:**

1. Coluna inexistente: apresenta mensagem de dado inexistente.
2. Tabela inexistente: apresenta erro de tabela invalida.
3. Filtro invalido: apresenta erro sem bloquear a aplicacao.
4. Sem resultados: mostra estado vazio de preview.

### UC-12 Guardar relatorio

**Objetivo:** Persistir a configuracao do relatorio.

**Fluxo principal:**

1. O utilizador preenche nome.
2. O sistema valida tabela e colunas.
3. O backend executa contagem exata.
4. O backend guarda configuracao em `SavedReport`.
5. O frontend dispara refresh da listagem.

**Fluxos alternativos:**

1. Nome em branco: bloqueia a criacao.
2. Falha na query: mostra erro do backend.
3. Falha na contagem: nao guarda relatorio com total incorreto.

### UC-13 Definir visibilidade publica ou privada

**Objetivo:** Controlar quem pode ver e exportar o relatorio.

**Fluxo principal:**

1. O utilizador alterna o switch Publico/Privado.
2. O estado fica visivel no header do preview.
3. O valor `is_public` e enviado ao backend.
4. O backend guarda a visibilidade.

**Regras funcionais:**

1. Relatorio privado aparece apenas ao dono.
2. Relatorio publico aparece a outros utilizadores autenticados.
3. Relatorio privado nao pode ser exportado por terceiros.

## Gestao de relatorios

### UC-14 Listar relatorios

**Objetivo:** Ver relatorios do utilizador e relatorios publicos.

**Fluxo principal:**

1. O utilizador acede a `/relatorios` ou `/dashboard`.
2. O frontend chama `/api/reports/`.
3. O backend devolve relatorios do dono e publicos.
4. A tabela mostra nome, tabela, registos, data, visibilidade e acoes.

### UC-15 Pesquisar relatorios

**Objetivo:** Filtrar a listagem por nome ou tabela.

**Fluxo principal:**

1. O utilizador escreve na pesquisa.
2. O frontend filtra os relatorios carregados.
3. A tabela apresenta apenas correspondencias.

**Fluxo alternativo:**

1. Sem resultados: mostra estado vazio de pesquisa.

### UC-16 Eliminar relatorio

**Objetivo:** Remover definitivamente um relatorio criado pelo proprio utilizador.

**Fluxo principal:**

1. O criador clica em eliminar.
2. O sistema apresenta modal de confirmacao.
3. O utilizador confirma.
4. O backend elimina o relatorio.
5. A tabela e atualizada.

**Fluxos alternativos:**

1. O utilizador cancela: nada e eliminado.
2. Terceiro tenta eliminar: backend devolve 404 ou rejeita a operacao.
3. Falha de rede: mostra erro e mantem o relatorio na lista.

## Exportacao

### UC-17 Exportar relatorio

**Objetivo:** Descarregar resultados em JSON, CSV ou PDF.

**Fluxo principal:**

1. O utilizador abre o menu Exportar.
2. Escolhe formato.
3. O backend executa a query do relatorio.
4. O ficheiro e gerado em memoria.
5. O browser descarrega o ficheiro.

**Regras funcionais:**

1. Formatos suportados: `json`, `csv`, `pdf`.
2. Formato ausente ou invalido devolve erro.
3. Ficheiros nao sao guardados no servidor.
4. Exportacao de relatorio privado por terceiro e bloqueada.
5. PDF deve apresentar nomes legiveis de colunas e horario de Portugal.

## Estrutura da base de dados

### UC-18 Consultar diagrama ER

**Objetivo:** Visualizar tabelas, colunas e relacoes.

**Fluxo principal:**

1. O utilizador acede a `/estrutura`.
2. O frontend chama `/api/schema/`.
3. O sistema constroi nos e ligacoes.
4. O diagrama e apresentado com zoom, pan, minimap e controlos.

**Fluxos alternativos:**

1. Sem tabelas: mostra mensagem de ausencia de resultados.
2. Pesquisa sem resultados: mostra estado vazio.
3. Falha da API: mostra erro no ecra.

## Configuracoes e navegacao

### UC-19 Usar layout responsivo e navegacao lateral

**Objetivo:** Navegar pela aplicacao de forma consistente.

**Fluxo principal:**

1. O utilizador usa sidebar e topbar.
2. O layout protege rotas autenticadas.
3. A sidebar pode ser colapsada.
4. O conteudo adapta-se a desktop, tablet e mobile.

### UC-20 Consultar mensagens de erro e estados vazios

**Objetivo:** Receber feedback claro em falhas ou ausencia de dados.

**Casos cobertos:**

1. Dashboard sem relatorios.
2. Pesquisa de relatorios sem resultados.
3. Falha ao carregar relatorios.
4. Falha ao carregar tabelas.
5. Falha no preview.
6. Filtros incompletos.
7. Exportacao sem permissao.
8. Erros de autenticacao.
