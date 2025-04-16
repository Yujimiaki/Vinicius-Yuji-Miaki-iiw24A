# Garagem Virtual V3

## Descrição

Garagem Virtual V3 é uma aplicação web simples para simular e gerenciar uma coleção de veículos. Permite adicionar diferentes tipos de veículos (Carro Normal, Carro Esportivo, Caminhão), visualizar seus detalhes, interagir com eles (ligar/desligar, acelerar/frear, usar turbo, carregar/descarregar) e registrar/visualizar um histórico de manutenções.

Este projeto demonstra conceitos de Programação Orientada a Objetos (POO) em JavaScript, incluindo classes, herança, encapsulamento (básico), e manipulação do DOM para criar uma interface interativa. O código foi refatorado para usar Módulos ES6 para melhor organização.

## Funcionalidades Principais

*   **Adicionar Veículos:** Adicione Carros Normais, Carros Esportivos e Caminhões, especificando modelo e cor (e capacidade de carga para caminhões).
*   **Listar e Selecionar:** Veja a lista de veículos na garagem e selecione um para ver detalhes.
*   **Visualizar Detalhes:** Veja modelo, cor, ID, status (ligado/desligado), velocidade atual (com velocímetro visual) e informações específicas (boost, carga).
*   **Interagir com Veículos:**
    *   Ligar e Desligar o motor.
    *   Acelerar e Frear (com limites de velocidade e efeitos diferentes por tipo/carga).
    *   Ativar Turbo Boost (para Carros Esportivos, uso único).
    *   Carregar e Descarregar Caminhões (respeitando capacidade e estado do motor).
*   **Gerenciar Manutenções:**
    *   Registrar novas manutenções (serviços realizados) ou agendar futuras.
    *   Informar data/hora, tipo de serviço, custo (opcional) e descrição.
    *   Visualizar o histórico de manutenções passadas.
    *   Visualizar os agendamentos futuros.
    *   Remover registros de manutenção individualmente.
*   **Remover Veículos:** Remova veículos da garagem permanentemente.
*   **Persistência:** O estado da garagem (veículos e manutenções) é salvo no LocalStorage do navegador, para que os dados persistam entre as sessões.
*   **Notificações:** Feedbacks visuais para ações do usuário e lembretes de agendamentos próximos.

## Tecnologias Utilizadas

*   HTML5
*   CSS3 (com Variáveis CSS e layout Flexbox/Grid)
*   JavaScript (ES6+)
    *   Programação Orientada a Objetos (Classes, Herança)
    *   Módulos ES6 (`import`/`export`)
    *   Manipulação do DOM
    *   LocalStorage API
    *   SVG (para o velocímetro)
*   Font Awesome (para ícones)
*   Google Fonts (Poppins)

## Como Executar o Projeto

**🚨 IMPORTANTE: Devido ao uso de Módulos JavaScript (`import`/`export`), este projeto NÃO FUNCIONARÁ corretamente se você abrir o arquivo `index.html` diretamente no navegador (usando `file:///`). É necessário servi-lo através de um servidor web local.**

**Método Recomendado (VS Code + Live Server):**

1.  **Pré-requisito:** Tenha o [Visual Studio Code](https://code.visualstudio.com/) instalado.
2.  **Instale a Extensão:** Abra o VS Code, vá até a aba de Extensões (ícone de blocos ou `Ctrl+Shift+X`), procure por `Live Server` (de Ritwick Dey) e clique em "Instalar".
3.  **Abra a Pasta:** No VS Code, abra a pasta raiz onde você clonou ou baixou este projeto (`garagem-virtual`).
4.  **Execute:** Clique com o botão direito do mouse sobre o arquivo `index.html` na barra lateral do VS Code e selecione a opção **"Open with Live Server"**.
5.  Seu navegador padrão abrirá automaticamente com o projeto rodando em um endereço como `http://127.0.0.1:5500/` (o número da porta pode variar).

**Alternativa (Python 3):**

1.  **Pré-requisito:** Tenha o [Python 3](https://www.python.org/) instalado e adicionado ao PATH do seu sistema.
2.  **Navegue até a Pasta:** Abra um terminal ou prompt de comando e use o comando `cd` para navegar até a pasta raiz do projeto (`garagem-virtual`).
3.  **Inicie o Servidor:** Digite o comando: `python -m http.server`
4.  **Acesse no Navegador:** Abra seu navegador e vá para o endereço `http://localhost:8000`.

**Alternativa (Node.js + http-server):**

1.  **Pré-requisito:** Tenha o [Node.js e npm](https://nodejs.org/) instalados.
2.  **Instale o http-server (se ainda não tiver):** Abra um terminal e execute: `npm install -g http-server` (talvez precise de `sudo` no Linux/macOS).
3.  **Navegue até a Pasta:** Use `cd` no terminal para ir até a pasta raiz do projeto.
4.  **Inicie o Servidor:** Execute o comando: `http-server`
5.  **Acesse no Navegador:** Abra seu navegador e vá para um dos endereços listados no terminal (geralmente `http://127.0.0.1:8080` ou `http://localhost:8080`).

## Estrutura das Pastas