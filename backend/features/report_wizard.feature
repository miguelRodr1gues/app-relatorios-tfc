Feature: Criacao de relatorio atraves do wizard
  Como utilizador autenticado
  Quero criar relatorios por passos
  Para selecionar dados, validar o resultado e exportar ficheiros.

  Scenario: Selecionar entidade e pesquisar
    Given o utilizador esta em /relatorios/criar
    When pesquisa por uma entidade existente
    Then a entidade aparece nos resultados
    And pode ser selecionada

  Scenario: Selecionar colunas
    Given o utilizador selecionou uma entidade
    When avanca para o passo de colunas
    Then sao apresentadas as colunas disponiveis
    And pode selecionar uma ou mais colunas

  Scenario: Aplicar filtros
    Given o utilizador esta no passo de filtros
    When adiciona um filtro com coluna, operador e valor
    Then o filtro e adicionado a lista
    And pode ser removido

  Scenario: Preview do relatorio
    Given o utilizador configurou entidade, colunas e filtros
    When avanca para o passo de preview
    Then sao apresentados dados reais da base de dados
    And o numero de registos corresponde ao esperado

  Scenario: Guardar relatorio na aplicacao
    Given o utilizador esta no passo de acoes
    When seleciona guardar na aplicacao
    Then o relatorio aparece na listagem de /relatorios
    And pode ser aberto posteriormente

  Scenario: Guardar relatorio publico
    Given o utilizador esta no passo de preview
    When ativa a visibilidade publica
    And guarda o relatorio
    Then outros utilizadores autenticados conseguem visualizar o relatorio

  Scenario: Guardar relatorio privado
    Given o utilizador esta no passo de preview
    When mantem a visibilidade privada
    And guarda o relatorio
    Then apenas o criador consegue visualizar o relatorio

  Scenario: Exportar para CSV
    Given o utilizador esta no passo de acoes
    When seleciona exportar para CSV
    Then o ficheiro e descarregado
    And contem os dados corretos

  Scenario: Exportar para PDF
    Given o utilizador esta no passo de acoes
    When seleciona exportar para PDF
    Then o ficheiro PDF e gerado e descarregado

  Scenario: Exportar para JSON
    Given o utilizador esta no passo de acoes
    When seleciona exportar para JSON
    Then o ficheiro JSON e descarregado
    And a estrutura de dados e valida
