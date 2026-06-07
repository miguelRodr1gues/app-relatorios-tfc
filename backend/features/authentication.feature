Feature: Autenticacao
  Como utilizador da plataforma
  Quero autenticar-me com seguranca
  Para aceder aos relatorios e dados da aplicacao.

  Scenario: Login com credenciais validas por email
    Given o utilizador acede a /login
    When insere um email registado e valido
    And introduz o codigo de verificacao correto
    Then e redirecionado para /dashboard
    And recebe cookies JWT de acesso e refresh validos

  Scenario: Login com credenciais invalidas
    Given o utilizador acede a /login
    When insere um email inexistente ou nao verificado
    Then permanece em /login
    And e apresentada uma mensagem de erro

  Scenario: Acesso sem autenticacao
    Given o utilizador nao esta autenticado
    When tenta aceder a /dashboard
    Then e redirecionado para /login

  Scenario: Login com conta social Google
    Given o utilizador acede a /login
    When clica em "Login com Google"
    Then e redirecionado para o fluxo OAuth do Google
    And apos autenticacao e encaminhado para /dashboard

  Scenario: Login social com token invalido
    Given o utilizador tenta autenticar com um token Google invalido
    Then e apresentada uma mensagem de acesso negado

  Scenario: Token expirado
    Given o utilizador esta autenticado
    When o token JWT expira
    Then o sistema tenta renovar o token automaticamente
    And se nao for possivel redireciona para /login

  Scenario: Token invalido ou manipulado
    Given um pedido e feito com token invalido
    Then a API rejeita o pedido como nao autenticado
