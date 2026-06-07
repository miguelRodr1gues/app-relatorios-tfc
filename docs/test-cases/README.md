# Test Cases

## Indice

1. [Objetivo](#objetivo)
2. [Estrategia de teste](#estrategia-de-teste)
3. [Mapa de cobertura](#mapa-de-cobertura)
4. [Testes funcionais](#testes-funcionais)
5. [Testes de integracao](#testes-de-integracao)
6. [Testes de API automatizados](#testes-de-api-automatizados)
7. [Testes E2E recomendados](#testes-e2e-recomendados)
8. [Testes de regressao visual e UX](#testes-de-regressao-visual-e-ux)
9. [Testes negativos e edge cases](#testes-negativos-e-edge-cases)
10. [Comandos de execucao](#comandos-de-execucao)

## Objetivo

Este documento define uma cobertura de testes mais abrangente para o MVP da aplicacao. Inclui casos funcionais, integracao frontend/backend/base de dados, testes automatizados ja implementados e testes recomendados para uma fase seguinte com Playwright, Cypress ou ferramenta equivalente.

## Estrategia de teste

| Nivel | Objetivo | Ferramenta sugerida | Estado |
| --- | --- | --- | --- |
| Unitario | Validar helpers, normalizacao e formatacao | Django TestCase, Vitest | Parcial |
| API | Validar endpoints REST e permissoes | Django REST Framework APITestCase | Implementado parcialmente |
| Integracao | Validar React + Django + PostgreSQL/SQLite | Django test DB, ambiente local | Parcial |
| E2E | Validar fluxos reais no browser | Playwright ou Cypress | Recomendado |
| Visual/UX | Validar responsividade, modais, estados vazios | Playwright screenshots | Recomendado |
| Regressao | Garantir que mudancas nao quebram MVP | CI com lint/build/test | Recomendado |

## Mapa de cobertura

| Area | Funcional | API | Integracao | E2E recomendado |
| --- | --- | --- | --- | --- |
| Registo | Sim | Sim | Sim | Sim |
| Login email OTP | Sim | Sim | Sim | Sim |
| Login Google | Sim | Sim | Sim | Sim |
| JWT refresh/logout | Sim | Sim | Sim | Sim |
| Dashboard KPIs | Sim | Parcial | Sim | Sim |
| Wizard steps | Sim | Parcial | Sim | Sim |
| Preview | Sim | Sim | Sim | Sim |
| Guardar relatorio | Sim | Sim | Sim | Sim |
| Relatorios publicos/privados | Sim | Sim | Sim | Sim |
| Exportacao CSV/PDF/JSON | Sim | Sim | Sim | Sim |
| Delete relatorio | Sim | Sim | Sim | Sim |
| Estrutura ER | Sim | Sim | Sim | Sim |
| Estados vazios/erros | Sim | Parcial | Sim | Sim |
| Responsividade | Sim | Nao aplicavel | Nao aplicavel | Sim |

## Testes funcionais

| ID | Area | Cenario | Pre-condicao | Passos resumidos | Resultado esperado | Prioridade |
| --- | --- | --- | --- | --- | --- | --- |
| TC-FUNC-001 | Registo | Registo com dados validos | Visitante em `/register` | Preencher nome, apelido e email | Codigo OTP enviado e utilizador vai para verificacao | Alta |
| TC-FUNC-002 | Registo | Email ja registado | Email ativo existe | Tentar registar o mesmo email | Erro "email ja registado" | Alta |
| TC-FUNC-003 | Registo | Dados obrigatorios em falta | Visitante em `/register` | Submeter formulario vazio | Validacao impede envio | Media |
| TC-FUNC-004 | OTP | Codigo correto | Desafio OTP valido | Introduzir codigo correto | Sessao criada e redirect para dashboard | Alta |
| TC-FUNC-005 | OTP | Codigo incorreto | Desafio OTP valido | Introduzir codigo errado | Erro apresentado e tentativas incrementadas | Alta |
| TC-FUNC-006 | OTP | Codigo expirado | Desafio expirado | Introduzir codigo expirado | Erro de expiracao | Alta |
| TC-FUNC-007 | OTP | Codigo ja usado | Desafio consumido | Reutilizar codigo | Erro de codigo ja utilizado | Alta |
| TC-FUNC-008 | Login | Login email valido | Conta ativa | Pedir codigo e validar OTP | JWT criado | Alta |
| TC-FUNC-009 | Login | Login email inexistente | Conta nao existe | Inserir email inexistente | Erro e sem redirect | Alta |
| TC-FUNC-010 | Login | Login Google valido | Token Google valido | Clicar login Google | Sessao criada e redirect | Alta |
| TC-FUNC-011 | Login | Login Google invalido | Token invalido | Enviar token invalido | Erro e sem sessao | Alta |
| TC-FUNC-012 | Sessao | Acesso sem auth | Sem cookies | Abrir `/dashboard` | Redirect para login | Alta |
| TC-FUNC-013 | Sessao | Refresh automatico | Access expirado, refresh valido | Chamar endpoint protegido | Novo access token e pedido repetido | Alta |
| TC-FUNC-014 | Sessao | Refresh invalido | Refresh invalido | Chamar endpoint protegido | Sessao termina | Alta |
| TC-FUNC-015 | Sessao | Logout | Utilizador autenticado | Clicar logout | Cookies limpos e redirect login | Alta |
| TC-FUNC-016 | Dashboard | Carregar dashboard | Utilizador autenticado | Abrir `/dashboard` | KPIs e tabela aparecem | Alta |
| TC-FUNC-017 | Dashboard | Adicionar KPI | Tabelas disponiveis | Clicar adicionar metrica | Card aparece | Media |
| TC-FUNC-018 | Dashboard | Limite de KPIs | Quatro metricas selecionadas | Tentar adicionar outra | Nao permite exceder limite | Media |
| TC-FUNC-019 | Dashboard | Persistencia de KPIs | KPIs selecionados | Logout/login mesmo user | KPIs mantidos | Alta |
| TC-FUNC-020 | Dashboard | Cache de KPIs | Dados ja carregados | Navegar e voltar | Nao mostra loading desnecessario | Media |
| TC-FUNC-021 | Dashboard | Refresh apos criar relatorio | Relatorio criado | Voltar a dashboard | Total de relatorios atualizado | Alta |
| TC-FUNC-022 | Relatorios | Estado vazio | Sem relatorios | Abrir listagem | Mensagem "Ainda nao existem relatorios" | Alta |
| TC-FUNC-023 | Relatorios | Pesquisa sem resultados | Relatorios existentes | Pesquisar texto inexistente | Estado "Nenhum relatorio encontrado" | Media |
| TC-FUNC-024 | Relatorios | Pesquisa por nome | Relatorio existe | Pesquisar nome | Relatorio correspondente aparece | Media |
| TC-FUNC-025 | Relatorios | Pesquisa por tabela | Relatorio existe | Pesquisar tabela | Relatorio correspondente aparece | Media |
| TC-FUNC-026 | Wizard | Carregar entidades | Utilizador autenticado | Abrir wizard | Entidades aparecem | Alta |
| TC-FUNC-027 | Wizard | Falha ao carregar entidades | API indisponivel | Abrir wizard | Erro apresentado | Alta |
| TC-FUNC-028 | Wizard | Selecionar tabela | Entidades carregadas | Selecionar tabela principal | Step seguinte desbloqueado | Alta |
| TC-FUNC-029 | Wizard | Trocar tabela | Tabela e colunas selecionadas | Escolher outra tabela | Colunas/filtros antigos limpos | Alta |
| TC-FUNC-030 | Wizard | Avancar sem tabela | Step 1 aberto | Clicar seguinte | Mensagem de validacao | Alta |
| TC-FUNC-031 | Wizard | Selecionar relacionada | Tabela com relacoes | Selecionar relacionada | Colunas relacionadas aparecem | Media |
| TC-FUNC-032 | Wizard | Selecionar colunas | Tabela selecionada | Selecionar uma ou mais colunas | Step filtros desbloqueado | Alta |
| TC-FUNC-033 | Wizard | Avancar sem colunas | Tabela selecionada | Clicar seguinte | Mensagem de validacao | Alta |
| TC-FUNC-034 | Wizard | Filtro valido | Colunas selecionadas | Adicionar coluna, operador e valor | Filtro aparece no resumo | Alta |
| TC-FUNC-035 | Wizard | Filtro incompleto | Coluna ou valor em falta | Tentar avancar | Avanco bloqueado | Alta |
| TC-FUNC-036 | Wizard | Remover filtro | Filtro existente | Clicar remover | Filtro desaparece | Media |
| TC-FUNC-037 | Wizard | Navegar para step anterior | Dados preenchidos | Clicar step anterior | Dados preservados | Alta |
| TC-FUNC-038 | Wizard | Tentar saltar step futuro | Dados obrigatorios em falta | Clicar step futuro | Step bloqueado e erro mostrado | Alta |
| TC-FUNC-039 | Wizard | Cancelar sem dados | Wizard limpo | Clicar cancelar | Fecha sem modal | Media |
| TC-FUNC-040 | Wizard | Cancelar com dados | Dados preenchidos | Clicar cancelar | Modal com blur total | Alta |
| TC-FUNC-041 | Wizard | Continuar a editar | Modal aberto | Clicar continuar | Modal fecha e dados ficam | Alta |
| TC-FUNC-042 | Wizard | Confirmar cancelamento | Modal aberto | Clicar cancelar relatorio | Estado limpo e wizard fecha | Alta |
| TC-FUNC-043 | Preview | Preview valido | Tabela/colunas validas | Abrir step preview | Ate 10 linhas apresentadas | Alta |
| TC-FUNC-044 | Preview | Sem filtros | Nenhum filtro ativo | Abrir preview | Texto "Sem filtros aplicados" | Media |
| TC-FUNC-045 | Preview | Sem resultados | Query retorna vazio | Abrir preview | Estado vazio sem crash | Media |
| TC-FUNC-046 | Preview | Coluna inexistente | Payload invalido | Gerar preview | Erro claro sobre dado inexistente | Alta |
| TC-FUNC-047 | Preview | Tabela inexistente | Payload invalido | Gerar preview | Erro claro sobre tabela inexistente | Alta |
| TC-FUNC-048 | Preview | Valor de filtro invalido | Filtro invalido | Gerar preview | Erro claro e sem crash | Alta |
| TC-FUNC-049 | Guardar | Nome em falta | Preview pronto | Clicar gerar sem nome | Erro de nome obrigatorio | Alta |
| TC-FUNC-050 | Guardar | Relatorio privado | Configuracao valida | Guardar como privado | Aparece apenas ao criador | Alta |
| TC-FUNC-051 | Guardar | Relatorio publico | Configuracao valida | Guardar como publico | Aparece a outros users | Alta |
| TC-FUNC-052 | Guardar | Contagem exata | Dados reais | Guardar relatorio | `record_count` corresponde a query | Alta |
| TC-FUNC-053 | Guardar | Refresh automatico da tabela | Criacao concluida | Fechar wizard | Relatorio aparece sem refresh manual | Alta |
| TC-FUNC-054 | Exportacao | Exportar CSV | Relatorio acessivel | Selecionar CSV | Download `.csv` com dados | Alta |
| TC-FUNC-055 | Exportacao | Exportar PDF | Relatorio acessivel | Selecionar PDF | Download `.pdf` com layout correto | Alta |
| TC-FUNC-056 | Exportacao | Exportar JSON | Relatorio acessivel | Selecionar JSON | Download `.json` valido | Alta |
| TC-FUNC-057 | Exportacao | Formato ausente | Relatorio acessivel | Chamar download sem formato | Erro 400 | Media |
| TC-FUNC-058 | Exportacao | Formato invalido | Relatorio acessivel | Chamar `xlsx` | Erro 400 | Media |
| TC-FUNC-059 | Exportacao | Relatorio inexistente | ID inexistente | Exportar | Erro 404 | Alta |
| TC-FUNC-060 | Exportacao | Privado de outro user | User sem permissao | Exportar privado | Erro 403 | Alta |
| TC-FUNC-061 | Delete | Eliminar proprio relatorio | Criador autenticado | Confirmar delete | Relatorio removido | Alta |
| TC-FUNC-062 | Delete | Cancelar delete | Modal aberto | Clicar cancelar/X | Nada e removido | Media |
| TC-FUNC-063 | Delete | Terceiro tenta eliminar | User nao dono | Chamar delete | Operacao rejeitada | Alta |
| TC-FUNC-064 | Estrutura | Carregar diagrama | Utilizador autenticado | Abrir `/estrutura` | Nos e edges renderizados | Alta |
| TC-FUNC-065 | Estrutura | Pesquisar tabela | Diagrama carregado | Pesquisar tabela | Tabela e relacoes visiveis | Media |
| TC-FUNC-066 | Estrutura | Pesquisar coluna | Diagrama carregado | Pesquisar coluna | Tabela correspondente visivel | Media |
| TC-FUNC-067 | Estrutura | Sem resultados | Pesquisa inexistente | Pesquisar | "Nenhuma tabela encontrada" | Media |
| TC-FUNC-068 | Estrutura | Falha API | API indisponivel | Abrir pagina | Mensagem de erro | Alta |
| TC-FUNC-069 | Layout | Sidebar colapsada | App aberta | Colapsar sidebar | Logo, icones e seta alinhados | Media |
| TC-FUNC-070 | Layout | Responsividade mobile | Mobile viewport | Abrir paginas principais | Layout legivel e utilizavel | Alta |
| TC-FUNC-071 | Layout | Topbar sem notificacoes | App aberta | Ver topbar | Icones removidos nao aparecem | Baixa |
| TC-FUNC-072 | Erros | Dados nulos da API | API devolve campos nulos | Abrir dashboard/tabela/wizard | Sem `Cannot read properties` | Alta |

## Testes de integracao

| ID | Integracao | Cenario | Validacao esperada | Prioridade |
| --- | --- | --- | --- | --- |
| TC-INT-001 | React + Django | Registo por email | Frontend recebe `verification_token` e navega para codigo | Alta |
| TC-INT-002 | Django + SMTP | Envio OTP | Email e enviado com codigo dentro do prazo | Alta |
| TC-INT-003 | React + Django | Login por email | `requestLoginCode` devolve desafio normalizado | Alta |
| TC-INT-004 | React + Django | Verificar OTP | `checkAuth` carrega utilizador apos cookies JWT | Alta |
| TC-INT-005 | React + Google + Django | Login Google | Token Google e validado e sessao criada | Alta |
| TC-INT-006 | Axios + Django | Refresh automatico | Interceptor renova token e repete pedido | Alta |
| TC-INT-007 | Axios + Django | Refresh concorrente | Varios pedidos aguardam uma unica renovacao | Media |
| TC-INT-008 | Django + PostgreSQL | `/api/entities/` | Devolve tabelas, colunas, linhas estimadas e relacoes | Alta |
| TC-INT-009 | Django + PostgreSQL | `/api/schema/` | Devolve tabelas, colunas e foreign keys | Alta |
| TC-INT-010 | Django + PostgreSQL | Preview com filtros | Query respeita filtros e colunas | Alta |
| TC-INT-011 | Django + PostgreSQL | Erro de coluna inexistente | Backend devolve mensagem legivel | Alta |
| TC-INT-012 | Django + SQLite | Guardar `SavedReport` | Configuracao e persistida corretamente | Alta |
| TC-INT-013 | Django + SQLite | Listagem public/private | Query devolve dono + publicos | Alta |
| TC-INT-014 | Django + Exportacao | CSV | Ficheiro gerado em memoria com cabecalhos | Alta |
| TC-INT-015 | Django + Exportacao | PDF | PDF gerado em memoria com contexto correto | Alta |
| TC-INT-016 | Django + Exportacao | JSON | JSON valido gerado em memoria | Alta |
| TC-INT-017 | React + ReportsTable | Evento `reports:changed` | Listagem atualiza sem refresh manual | Alta |
| TC-INT-018 | React + Dashboard | Cache de metricas | Dados nao recarregam em navegacao simples | Media |
| TC-INT-019 | React + localStorage | KPIs por user | Chaves persistem por utilizador | Media |
| TC-INT-020 | React + ReactFlow | Estrutura | Payload de schema cria nodes e edges | Media |

## Testes de API automatizados

Os testes automatizados atuais estao em `backend/api/tests.py`.

| ID | Teste automatizado | Cobertura |
| --- | --- | --- |
| TC-API-001 | `test_email_login_and_code_verification_issue_jwt_cookies` | Login email + OTP + cookies JWT |
| TC-API-002 | `test_email_login_with_unknown_account_returns_error` | Login invalido |
| TC-API-003 | `test_protected_endpoint_without_authentication_is_rejected` | Protecao de endpoint |
| TC-API-004 | `test_refresh_token_cookie_creates_new_access_cookie` | Refresh JWT |
| TC-API-005 | `test_invalid_access_token_cookie_is_rejected` | Token manipulado |
| TC-API-006 | `test_google_login_creates_session_for_valid_google_token` | Login Google valido |
| TC-API-007 | `test_google_login_with_invalid_token_returns_error` | Login Google invalido |
| TC-API-008 | `test_report_preview_returns_real_rows_from_query_layer` | Preview de relatorio |
| TC-API-009 | `test_report_preview_requires_base_table_and_columns` | Validacao de preview |
| TC-API-010 | `test_save_report_persists_configuration_and_exact_record_count` | Guardar relatorio e contagem exata |
| TC-API-011 | `test_public_reports_are_visible_to_other_users_but_private_reports_are_not` | Visibilidade publica/privada |
| TC-API-012 | `test_report_can_be_deleted_by_owner` | Delete pelo dono |
| TC-API-013 | `test_export_report_as_json` | Exportacao JSON |
| TC-API-014 | `test_export_report_as_csv` | Exportacao CSV |
| TC-API-015 | `test_export_report_as_pdf` | Exportacao PDF |
| TC-API-016 | `test_private_report_cannot_be_exported_by_other_user` | Permissao de exportacao |
| TC-API-017 | `test_structure_endpoint_returns_er_payload_shape` | Endpoint de estrutura |
| TC-API-018 | `test_structure_endpoint_requires_authentication` | Protecao de estrutura |
| TC-API-019 | `test_expired_and_consumed_helpers_reflect_challenge_state` | Helpers OTP |

## Testes E2E recomendados

| ID | Fluxo E2E | Passos principais | Resultado esperado |
| --- | --- | --- | --- |
| TC-E2E-001 | Registo completo | Register, codigo OTP, dashboard | Conta ativa e sessao iniciada |
| TC-E2E-002 | Login email completo | Login, codigo OTP, dashboard | Sessao iniciada |
| TC-E2E-003 | Login Google completo | Botao Google, callback, dashboard | Sessao iniciada |
| TC-E2E-004 | Criar relatorio privado | Wizard completo, privado, guardar | Relatorio aparece so ao dono |
| TC-E2E-005 | Criar relatorio publico | Wizard completo, publico, guardar, outro user | Relatorio aparece ao outro user |
| TC-E2E-006 | Cancelar wizard com dados | Preencher dados, cancelar, continuar | Dados preservados |
| TC-E2E-007 | Confirmar cancelamento wizard | Preencher dados, cancelar, confirmar | Wizard fecha e dados sao limpos |
| TC-E2E-008 | Exportar tres formatos | Criar relatorio, exportar CSV/PDF/JSON | Downloads existem e conteudo valido |
| TC-E2E-009 | Eliminar relatorio | Criar, abrir modal, confirmar | Relatorio desaparece |
| TC-E2E-010 | Estrutura ER | Abrir estrutura, pesquisar tabela | Diagrama responde a pesquisa |
| TC-E2E-011 | Dashboard KPIs | Adicionar/remover KPIs, relogar | Configuracao mantida |
| TC-E2E-012 | Unauthorized flow | Apagar cookies, abrir dashboard | Redirect para login |

## Testes de regressao visual e UX

| ID | Area | Validacao |
| --- | --- | --- |
| TC-UX-001 | Modal cancelar wizard | Blur cobre tela inteira, card centrado, botoes corretos |
| TC-UX-002 | Modal delete | Card branco, cantos arredondados, X moderno, texto sem erros |
| TC-UX-003 | Preview | Switch Publico/Privado junto ao texto e sem ocupar demasiado espaco |
| TC-UX-004 | KPIs | Cards mostram apenas nome e valor, sem texto redundante |
| TC-UX-005 | Sidebar colapsada | Logo alinhada com icones e seta |
| TC-UX-006 | Steps wizard | Linha sempre alinhada ao centro dos pontos |
| TC-UX-007 | Estado vazio relatorios | Icone de documento, mensagem central e sem botao duplicado |
| TC-UX-008 | Mobile | Dashboard, relatorios, wizard e estrutura sem overflow critico |
| TC-UX-009 | Dark mode | Textos, bordas e estados continuam legiveis |
| TC-UX-010 | Loading states | Loading nao salta layout nem bloqueia indevidamente |

## Testes negativos e edge cases

| ID | Area | Caso | Resultado esperado |
| --- | --- | --- | --- |
| TC-NEG-001 | API | `/api/reports/preview/` sem tabela | 400 com erro legivel |
| TC-NEG-002 | API | `/api/reports/preview/` sem colunas | 400 com erro legivel |
| TC-NEG-003 | API | Criar relatorio sem nome | 400 com erro legivel |
| TC-NEG-004 | API | Criar relatorio com coluna inexistente | 400 com erro de dado inexistente |
| TC-NEG-005 | API | Criar relatorio com filtro invalido | 400 sem criar `SavedReport` |
| TC-NEG-006 | API | Download sem `export_format` | 400 |
| TC-NEG-007 | API | Download com formato nao suportado | 400 |
| TC-NEG-008 | API | Download de relatorio inexistente | 404 |
| TC-NEG-009 | API | Delete de relatorio inexistente | 404 |
| TC-NEG-010 | API | Delete de relatorio de outro user | 404 ou rejeicao equivalente |
| TC-NEG-011 | Frontend | API devolve `null` em campos opcionais | UI usa fallback e nao crasha |
| TC-NEG-012 | Frontend | `localStorage` corrompido nos KPIs | Dashboard ignora valor invalido |
| TC-NEG-013 | Frontend | Pesquisa com espacos | Pesquisa normalizada e sem crash |
| TC-NEG-014 | Frontend | Relatorio sem owner/name/table | ReportsTable usa fallback seguro |
| TC-NEG-015 | Auth | Refresh token ausente | 401 e sem loop infinito |
| TC-NEG-016 | Auth | Refresh token invalido | Cookies limpos e sessao terminada |

## Comandos de execucao

Testes backend:

```bash
cd backend
python manage.py test api
```

Validacao backend:

```bash
cd backend
python manage.py check
pip check
```

Validacao frontend:

```bash
cd frontend
npm run lint
npm run build
```

BDD documental:

```bash
backend/features/authentication.feature
backend/features/report_wizard.feature
backend/features/structure.feature
```

Para evoluir os `.feature` para execucao automatica, a opcao natural e adicionar `behave` ou migrar os cenarios E2E para Playwright com passos equivalentes.
