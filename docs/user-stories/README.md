# User Stories

## Indice

1. [Objetivo](#objetivo)
2. [Autenticacao](#autenticacao)
3. [Sessao e seguranca](#sessao-e-seguranca)
4. [Dashboard](#dashboard)
5. [Wizard de relatorios](#wizard-de-relatorios)
6. [Relatorios guardados](#relatorios-guardados)
7. [Exportacao](#exportacao)
8. [Estrutura da base de dados](#estrutura-da-base-de-dados)
9. [Experiencia de utilizador](#experiencia-de-utilizador)
10. [Historias tecnicas](#historias-tecnicas)

## Objetivo

Este documento organiza as user stories do MVP por modulo funcional. Cada historia inclui criterios de aceitacao que podem ser usados como base para testes funcionais, testes de integracao e validacao manual.

## Autenticacao

### US-01 Registo por email

Como visitante, quero criar uma conta com nome, apelido e email para poder aceder a aplicacao.

**Criterios de aceitacao:**

1. O sistema valida campos obrigatorios.
2. O sistema rejeita email ja registado e ativo.
3. O sistema cria conta inativa ate validacao OTP.
4. O sistema envia codigo de verificacao por email.
5. O utilizador e encaminhado para o ecra de codigo.

### US-02 Login por email com OTP

Como utilizador, quero iniciar sessao com email e codigo de verificacao para aceder sem password.

**Criterios de aceitacao:**

1. O sistema envia codigo para conta ativa.
2. O sistema rejeita conta inexistente ou nao verificada.
3. O codigo correto cria cookies JWT.
4. Codigo incorreto apresenta erro.
5. Codigo expirado ou ja usado nao cria sessao.

### US-03 Login com Google

Como utilizador, quero entrar com a minha conta Google para acelerar o acesso.

**Criterios de aceitacao:**

1. O frontend envia token Google ao backend.
2. O backend valida token de identidade ou acesso.
3. O sistema cria utilizador quando ainda nao existe.
4. O sistema atualiza dados basicos quando o utilizador ja existe.
5. Token invalido nao cria sessao.

### US-04 Ver perfil autenticado

Como utilizador autenticado, quero que a aplicacao reconheca a minha sessao ao recarregar a pagina.

**Criterios de aceitacao:**

1. O frontend chama `/api/auth/user/` no arranque.
2. Se a sessao for valida, o utilizador permanece autenticado.
3. Se a sessao for invalida, o utilizador e enviado para login.

## Sessao e seguranca

### US-05 Renovacao automatica de token

Como utilizador, quero que o access token seja renovado automaticamente para evitar interrupcoes.

**Criterios de aceitacao:**

1. Ao receber 401 em pedido protegido, o frontend tenta refresh.
2. Pedidos concorrentes aguardam a mesma renovacao.
3. Depois do refresh, o pedido original e repetido.
4. Refresh invalido termina a sessao.

### US-06 Logout

Como utilizador autenticado, quero terminar sessao para proteger o acesso aos meus dados.

**Criterios de aceitacao:**

1. O backend limpa cookies JWT.
2. O frontend limpa o utilizador em memoria.
3. Rotas protegidas deixam de estar acessiveis.

### US-07 Protecao de rotas

Como sistema, quero impedir acesso a paginas privadas sem autenticacao.

**Criterios de aceitacao:**

1. `/dashboard`, `/relatorios`, `/estrutura` e `/settings` exigem autenticacao.
2. Visitantes sao redirecionados para `/login`.
3. Utilizadores autenticados nao devem voltar para `/login` sem logout.

## Dashboard

### US-08 Visualizar KPIs configuraveis

Como utilizador, quero escolher metricas da dashboard para acompanhar os dados mais importantes.

**Criterios de aceitacao:**

1. O utilizador pode adicionar metricas.
2. O limite maximo e quatro cards.
3. O utilizador pode remover metricas.
4. As metricas ficam guardadas por utilizador.
5. A dashboard evita recarregamentos desnecessarios entre navegacoes.

### US-09 Ver total de relatorios

Como utilizador, quero ver o total de relatorios criados para perceber a minha atividade.

**Criterios de aceitacao:**

1. A metrica conta relatorios devolvidos pela API.
2. A contagem atualiza apos criar ou eliminar relatorio.
3. O valor e formatado em `pt-PT`.

### US-10 Estado vazio de dashboard/listagem

Como utilizador, quero uma mensagem clara quando ainda nao existem relatorios para saber qual o proximo passo.

**Criterios de aceitacao:**

1. O sistema mostra icone discreto de documento.
2. A mensagem principal e "Ainda nao existem relatorios".
3. O texto orienta para "Novo Relatorio" sem criar botao duplicado.

## Wizard de relatorios

### US-11 Pesquisar fonte de dados

Como utilizador, quero pesquisar tabelas ou entidades para encontrar rapidamente a origem do relatorio.

**Criterios de aceitacao:**

1. A pesquisa filtra por nome, schema ou chave.
2. Entidades mostram nome, colunas, linhas e relacoes.
3. Falha de carregamento mostra mensagem de erro.

### US-12 Selecionar tabela principal

Como utilizador, quero escolher uma tabela principal para definir a base do relatorio.

**Criterios de aceitacao:**

1. O wizard nao avanca sem tabela principal.
2. Ao trocar a tabela principal, colunas, filtros e relacoes antigas sao limpos.
3. A tabela escolhida fica visivel no resumo.

### US-13 Selecionar tabelas relacionadas

Como utilizador, quero incluir tabelas relacionadas para enriquecer o relatorio.

**Criterios de aceitacao:**

1. Apenas relacoes disponiveis sao apresentadas.
2. O utilizador pode selecionar e remover tabelas relacionadas.
3. As colunas das tabelas relacionadas ficam disponiveis para selecao.

### US-14 Selecionar colunas

Como utilizador, quero escolher as colunas que vao aparecer no relatorio para controlar a saida.

**Criterios de aceitacao:**

1. O wizard apresenta colunas das tabelas incluidas.
2. Pelo menos uma coluna e obrigatoria.
3. Colunas selecionadas aparecem como resumo/chips.
4. Colunas invalidas sao removidas se a tabela relacionada for retirada.

### US-15 Aplicar filtros

Como utilizador, quero aplicar filtros para limitar os dados apresentados.

**Criterios de aceitacao:**

1. O filtro exige coluna e valor.
2. Filtros incompletos bloqueiam o avanco.
3. Filtros podem ser removidos.
4. O backend valida se tabela/coluna existem.
5. Erros de dados inexistentes sao apresentados de forma legivel.

### US-16 Navegar entre steps

Como utilizador, quero voltar a passos anteriores sem perder informacao e evitar saltar para passos futuros invalidos.

**Criterios de aceitacao:**

1. Steps anteriores completos sao clicaveis.
2. Steps futuros ficam bloqueados ate validacao.
3. Dados preenchidos sao preservados ao voltar.
4. Mensagens de validacao aparecem quando o utilizador tenta avancar sem requisitos.

### US-17 Cancelar criacao com confirmacao

Como utilizador, quero ser avisado antes de perder dados do wizard.

**Criterios de aceitacao:**

1. Cancelar sem dados fecha o wizard.
2. Cancelar com dados abre modal.
3. O modal aplica blur a tela inteira.
4. "Continuar a editar" fecha o modal.
5. "Cancelar relatorio" limpa o estado e volta a dashboard/listagem.

### US-18 Pre-visualizar relatorio

Como utilizador, quero ver uma amostra dos dados para validar o relatorio antes de guardar.

**Criterios de aceitacao:**

1. O preview carrega ao chegar ao ultimo step.
2. O sistema mostra ate 10 linhas.
3. O sistema mostra colunas selecionadas.
4. Sem filtros, apresenta "Sem filtros aplicados".
5. Sem dados, apresenta estado vazio.
6. Erro de query e apresentado sem crash.

### US-19 Definir nome e descricao

Como utilizador, quero dar nome e descricao ao relatorio para identifica-lo na listagem.

**Criterios de aceitacao:**

1. Nome e obrigatorio.
2. Descricao e opcional.
3. Descricao aparece no resumo/preview quando existe.
4. Nome e o elemento principal no preview.

### US-20 Definir visibilidade

Como criador, quero escolher se o relatorio e publico ou privado.

**Criterios de aceitacao:**

1. O switch muda visualmente entre estados.
2. O texto Publico/Privado fica junto ao switch.
3. Existe mensagem curta a explicar cada estado.
4. O valor e persistido no backend.

## Relatorios guardados

### US-21 Listar relatorios

Como utilizador, quero ver relatorios disponiveis numa tabela organizada.

**Criterios de aceitacao:**

1. A tabela mostra nome, tabela, registos, data, visibilidade e acoes.
2. Relatorios publicos de outros utilizadores aparecem.
3. Relatorios privados de outros utilizadores nao aparecem.
4. O numero de registos e exato.

### US-22 Pesquisar relatorios

Como utilizador, quero pesquisar por nome ou tabela para encontrar relatorios rapidamente.

**Criterios de aceitacao:**

1. A pesquisa filtra em tempo real.
2. Sem resultados mostra mensagem especifica.
3. Limpar pesquisa repoe a listagem completa.

### US-23 Eliminar relatorio proprio

Como criador, quero eliminar um relatorio que ja nao preciso.

**Criterios de aceitacao:**

1. Apenas o criador ve a acao de eliminar.
2. O modal informa que a acao e definitiva.
3. Confirmar elimina na API.
4. A tabela atualiza sem refresh manual.
5. Falha na eliminacao mostra erro.

## Exportacao

### US-24 Exportar CSV

Como utilizador, quero descarregar CSV para trabalhar os dados em folhas de calculo.

**Criterios de aceitacao:**

1. O ficheiro e descarregado com extensao `.csv`.
2. O CSV contem cabecalhos e linhas corretas.
3. O ficheiro usa formato compativel com `pt-PT`.
4. O ficheiro nao e persistido no servidor.

### US-25 Exportar PDF

Como utilizador, quero descarregar PDF para partilhar um relatorio formal.

**Criterios de aceitacao:**

1. O ficheiro e descarregado com extensao `.pdf`.
2. O PDF mostra nome, descricao, utilizador, tabelas incluidas e dados.
3. Colunas tecnicas sao humanizadas quando possivel.
4. Datas usam horario de Portugal.

### US-26 Exportar JSON

Como utilizador, quero descarregar JSON para integracoes ou analise tecnica.

**Criterios de aceitacao:**

1. O ficheiro e descarregado com extensao `.json`.
2. O JSON e valido.
3. O conteudo respeita colunas e filtros escolhidos.

### US-27 Bloquear exportacao sem permissao

Como sistema, quero impedir que utilizadores exportem relatorios privados de terceiros.

**Criterios de aceitacao:**

1. Relatorio privado de outro utilizador devolve 403.
2. Relatorio publico pode ser exportado por utilizadores autenticados.
3. Relatorio inexistente devolve 404.

## Estrutura da base de dados

### US-28 Consultar diagrama ER

Como utilizador, quero visualizar tabelas e relacoes para compreender a estrutura antes de criar relatorios.

**Criterios de aceitacao:**

1. O diagrama carrega tabelas do endpoint `/api/schema/`.
2. Cada tabela mostra colunas e tipos.
3. Relacoes aparecem como ligacoes.
4. O utilizador pode fazer zoom, pan e usar minimap.

### US-29 Pesquisar no diagrama

Como utilizador, quero pesquisar tabelas, colunas ou relacoes no diagrama.

**Criterios de aceitacao:**

1. Pesquisa por tabela mostra a tabela e relacoes diretas.
2. Pesquisa por coluna mostra a tabela correspondente.
3. Sem resultados mostra "Nenhuma tabela encontrada".

## Experiencia de utilizador

### US-30 Layout responsivo

Como utilizador, quero usar a aplicacao em desktop, tablet e mobile.

**Criterios de aceitacao:**

1. Sidebar, topbar, tabelas e wizard mantem legibilidade.
2. Modais ficam centrados e com blur total.
3. Tabelas usam scroll horizontal quando necessario.

### US-31 Feedback de loading e erro

Como utilizador, quero perceber quando a aplicacao esta a carregar ou falhou.

**Criterios de aceitacao:**

1. Listagens mostram loading.
2. Falhas de API mostram mensagens amigaveis.
3. A aplicacao nao mostra "Unexpected Application Error" em dados nulos.

### US-32 Labels legiveis

Como utilizador, quero ver nomes legiveis em vez de nomes tecnicos sempre que possivel.

**Criterios de aceitacao:**

1. Identificadores com `_` sao apresentados com espacos.
2. Nomes de tabelas e colunas sao humanizados.
3. O PDF evita nomes tecnicos como `utente.utente_nome` quando possivel.

## Historias tecnicas

### US-33 Testes automatizados da API

Como equipa de desenvolvimento, queremos testes de API para validar regressao dos fluxos principais.

**Criterios de aceitacao:**

1. Testes cobrem autenticacao, relatorios, exportacao e estrutura.
2. Testes de query usam mocks quando nao precisam de PostgreSQL real.
3. A suite corre com `python manage.py test api`.

### US-34 Documentacao do MVP

Como equipa de desenvolvimento, queremos documentacao de setup, casos de uso, user stories e testes para facilitar continuidade do projeto.

**Criterios de aceitacao:**

1. README principal explica setup.
2. Casos de uso estao em `docs/use-cases`.
3. User stories estao em `docs/user-stories`.
4. Test cases estao em `docs/test-cases`.
