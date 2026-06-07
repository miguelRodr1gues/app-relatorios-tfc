Feature: Ecra de Estrutura
  Como utilizador autenticado
  Quero consultar a estrutura da base de dados
  Para compreender entidades, colunas e relacoes antes de criar relatorios.

  Scenario: Visualizacao do diagrama ER
    Given o utilizador acede a /estrutura
    Then e apresentado o diagrama ER da base de dados
    And todas as entidades principais sao visiveis

  Scenario: Diagrama carrega corretamente
    Given o utilizador acede a /estrutura
    When a pagina termina de carregar
    Then o diagrama e renderizado sem erros

  Scenario: Acesso ao diagrama sem autenticacao
    Given o utilizador nao esta autenticado
    When tenta aceder a /estrutura
    Then e redirecionado para /login
