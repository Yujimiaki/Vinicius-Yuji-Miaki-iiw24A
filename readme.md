# Garagem Virtual V3 - Com Backend Proxy para Previsão do Tempo

## Descrição

Garagem Virtual V3 é uma aplicação web para simular e gerenciar uma coleção de veículos. Permite adicionar diferentes tipos de veículos, visualizar seus detalhes, interagir com eles, registrar manutenções e verificar a previsão do tempo.

Esta versão introduz um **backend Node.js com Express** que atua como um **proxy seguro** para a API OpenWeatherMap. Isso significa que a chave da API OpenWeatherMap é mantida em segurança no servidor, e o frontend faz requisições para o nosso próprio backend para obter os dados de previsão.

## Arquitetura da Previsão do Tempo

Frontend (HTML/JS em `http://localhost:PORTA_FRONTEND`)
   |
   V (Faz requisição para /api/previsao/:cidade)
   |
Nosso Backend (Node.js/Express em `http://localhost:3001`)
   |  - Valida a requisição
   |  - Usa a chave da API (do .env) para chamar a OpenWeatherMap
   V
API Externa (OpenWeatherMap)
   |
   V (Retorna dados para nosso Backend)
   |
Nosso Backend
   |
   V (Retorna dados JSON para o Frontend)
   |
Frontend (Processa e exibe os dados)


## Funcionalidades Principais

*   **Adicionar Veículos:** ... (mantenha suas funcionalidades da garagem)
*   **Listar e Selecionar:** ...
*   **Visualizar Detalhes:** ...
*   **Interagir com Veículos:** ...
*   **Gerenciar Manutenções:** ...
*   **API Simulada de Veículos:** ...
*   **Previsão do Tempo via Backend Proxy:**
    *   Digite o nome de uma cidade para ver a previsão do tempo.
    *   O frontend agora chama o endpoint `/api/previsao/:cidade` no nosso backend.
    *   A chave da API OpenWeatherMap está segura no servidor.
*   **Persistência:** ...
*   **Notificações:** ...

## Tecnologias Utilizadas

*   **Frontend:**
    *   HTML5
    *   CSS3 (Variáveis CSS, Flexbox/Grid)
    *   JavaScript (ES6+, Módulos, DOM, Fetch API)
    *   LocalStorage
    *   Font Awesome, Google Fonts
*   **Backend:**
    *   Node.js
    *   Express.js (para o servidor e rotas)
    *   Axios (para requisições HTTP do servidor para a OpenWeatherMap)
    *   Dotenv (para gerenciamento seguro de chaves de API)
*   **API Externa:**
    *   OpenWeatherMap API

## Configuração e Execução Local

### Pré-requisitos

*   Node.js e npm instalados: [https://nodejs.org/](https://nodejs.org/)
*   Um editor de código (ex: VS Code)
*   Uma chave de API válida da OpenWeatherMap: [https://openweathermap.org/appid](https://openweathermap.org/appid)

### Passos para Configuração

1.  **Clone o Repositório (se aplicável):**
    ```bash
    git clone SEU_LINK_DO_REPOSITORIO
    cd NOME_DA_PASTA_DO_PROJETO
    ```

2.  **Instale as Dependências do Backend:**
    Na pasta raiz do projeto, abra um terminal e rode:
    ```bash
    npm install
    ```
    Isso instalará `express`, `dotenv`, e `axios` (listados no `package.json`).

3.  **Configure a Chave da API (Backend):**
    *   Crie um arquivo chamado `.env` na pasta raiz do projeto.
    *   Dentro do arquivo `.env`, adicione sua chave da OpenWeatherMap:
        ```env
        OPENWEATHER_API_KEY=SUA_CHAVE_OPENWEATHERMAP_REAL_AQUI
        ```
        Substitua `SUA_CHAVE_OPENWEATHERMAP_REAL_AQUI` pela sua chave.
    *   **Importante:** O arquivo `.env` está listado no `.gitignore` e não deve ser enviado para o GitHub.

### Executando a Aplicação

Você precisará de dois terminais abertos (ou duas abas no terminal integrado do VS Code), um para o backend e outro para o frontend (se você estiver usando uma ferramenta como o Live Server que não inicia o backend automaticamente).

1.  **Inicie o Servidor Backend:**
    *   No primeiro terminal (na pasta raiz do projeto):
        ```bash
        node server.js
        ```
    *   Você deverá ver a mensagem: `Servidor backend rodando em http://localhost:3001` e uma confirmação sobre a chave da API.

2.  **Inicie o Frontend:**
    *   **Método Recomendado (VS Code + Live Server):**
        *   No VS Code, clique com o botão direito no arquivo `index.html`.
        *   Selecione "Open with Live Server".
        *   Isso geralmente abre o frontend em `http://localhost:5500` (ou uma porta similar).
    *   **Outros Métodos:** Se você tiver o `serve` instalado globalmente (`npm install -g serve`), pode rodar `serve .` na pasta raiz (ou `serve public` se seus arquivos estáticos estiverem em `public`). Adapte conforme sua configuração.

3.  **Acesse a Aplicação:**
    *   Abra seu navegador e vá para o endereço do frontend (ex: `http://localhost:5500`).
    *   A funcionalidade de previsão do tempo agora deve estar se comunicando com seu backend em `http://localhost:3001`.

## Endpoint da API de Previsão do Tempo (Criado no Backend)

*   **GET** `/api/previsao/:cidade`
    *   **Descrição:** Obtém a previsão do tempo para a cidade especificada.
    *   **Parâmetros da URL:**
        *   `cidade` (string, obrigatório): O nome da cidade para a qual a previsão é desejada.
    *   **Resposta de Sucesso (200 OK):**
        *   Corpo: JSON contendo os dados da previsão diretamente da API OpenWeatherMap.
        ```json
        // Exemplo da estrutura de dados retornada (da OpenWeatherMap)
        {
          "cod": "200",
          "message": 0,
          "cnt": 40,
          "list": [ /* array de previsões por intervalo de tempo */ ],
          "city": { /* informações da cidade */ }
        }
        ```
    *   **Respostas de Erro:**
        *   `400 Bad Request`: Se o nome da cidade não for fornecido.
          ```json
          { "error": "Nome da cidade é obrigatório." }
          ```
        *   `500 Internal Server Error`: Se a chave da API não estiver configurada no servidor ou ocorrer outro erro interno.
          ```json
          { "error": "Chave da API OpenWeatherMap não configurada no servidor." }
          ```
        *   Outros códigos de status (ex: 401, 404, 503) podem ser retornados se a API OpenWeatherMap falhar, com a mensagem de erro correspondente.

## Comentários no Código

Comentários básicos e JSDoc (onde aplicável) foram adicionados ao `server.js` e ao `java/principal.js` para explicar a lógica principal.

---