// js/main.js
'use strict';

// --- Importações ---
// Modelos de Dados
import Garagem from './models/Garagem.js';
import Manutencao from './models/Manutencao.js';
import Carro from './models/Carro.js';
import CarroEsportivo from './models/CarroEsportivo.js';
import Caminhao from './models/Caminhao.js';
// Utilitários
import { showNotification, hideNotification } from './utils/notifications.js';

// --- Referências aos Elementos da UI ---
/**
 * Objeto contendo referências cacheadas para os elementos HTML da interface.
 * @const {object} ui
 */
const ui = {
    modalAdicionar: document.getElementById('modalAdicionarVeiculo'),
    btnAbrirModalAdicionar: document.getElementById('btnAbrirModalAdicionar'),
    btnFecharModalAdicionar: document.getElementById('btnFecharModalAdicionar'),
    formNovoVeiculo: document.getElementById('formNovoVeiculo'),
    novoVeiculoTipo: document.getElementById('novoVeiculoTipo'),
    novoVeiculoModelo: document.getElementById('novoVeiculoModelo'),
    novoVeiculoCor: document.getElementById('novoVeiculoCor'),
    divCapacidadeCaminhao: document.getElementById('divCapacidadeCaminhao'),
    novoVeiculoCapacidade: document.getElementById('novoVeiculoCapacidade'),
    listaVeiculosSidebar: document.getElementById('listaVeiculosSidebar'),
    painelVeiculoSelecionado: document.getElementById('painelVeiculoSelecionado'),
    mensagemSelecione: document.getElementById('mensagem-selecione'),
    imagemVeiculo: document.getElementById('imagemVeiculo'),
    infoModeloTipo: document.getElementById('info-modelo-tipo'),
    infoCor: document.getElementById('info-cor'),
    infoId: document.getElementById('info-id'),
    botaoRemoverVeiculoHeader: document.getElementById('botaoRemoverVeiculoHeader'),
    tabLinks: document.querySelectorAll('.tab-link'),
    tabContents: document.querySelectorAll('.tab-content'),
    infoStatusMotor: document.getElementById('info-status-motor'),
    barraProgressoContainer: document.getElementById('barraProgressoContainer'),
    velocidadeAtual: document.getElementById('velocidadeAtual'),
    // A referência ao path é pega dinamicamente em atualizarPainelVeiculoSelecionado
    velocimetroProgressoPath: null, // Será atualizado quando um painel for mostrado
    infoEspecifica: document.getElementById('info-especifica'),
    botoesAcoes: document.getElementById('botoesAcoes'),
    botaoTurbo: document.getElementById('botaoTurbo'),
    botaoCarregar: document.getElementById('botaoCarregar'),
    botaoDescarregar: document.getElementById('botaoDescarregar'),
    formManutencaoContainer: document.getElementById('formManutencaoContainer'),
    formManutencao: document.getElementById('formManutencao'),
    manutencaoDataHora: document.getElementById('manutencaoDataHora'),
    manutencaoTipo: document.getElementById('manutencaoTipo'),
    manutencaoCusto: document.getElementById('manutencaoCusto'),
    manutencaoDescricao: document.getElementById('manutencaoDescricao'),
    historicoUl: document.querySelector('#historicoManutencao .lista-itens'),
    agendamentosUl: document.querySelector('#agendamentosFuturos .lista-itens'),
    notificationArea: document.getElementById('notification-area'),
    notificationMessage: document.getElementById('notification-message'),
    notificationCloseBtn: document.querySelector('#notification-area .close-btn'),
};

// Disponibiliza 'ui' globalmente para classes que (indevidamente) a acessam. REMOVER ISSO NO FUTURO.
window.ui = ui;

// --- Instância Principal da Aplicação ---
/**
 * Instância única da classe Garagem que gerencia todos os veículos.
 * @const {Garagem} minhaGaragem
 */
const minhaGaragem = new Garagem();

// --- Funções de Atualização da Interface Gráfica (UI) ---

/**
 * Atualiza a lista de veículos exibida na barra lateral (sidebar).
 * Renderiza cada veículo da `minhaGaragem` como um item de lista clicável.
 * Marca o veículo atualmente selecionado.
 * @returns {void}
 */
function atualizarListaVeiculosSidebar() {
    const listaUl = ui.listaVeiculosSidebar;
    if (!listaUl) {
        console.error("Elemento #listaVeiculosSidebar não encontrado.");
        return;
    }
    listaUl.innerHTML = ''; // Limpa a lista atual

    // Mostra placeholder se não houver veículos
    if (minhaGaragem.veiculos.length === 0) {
        listaUl.innerHTML = '<li class="placeholder">Nenhum veículo na garagem.</li>';
        return;
    }

    // Cria um item <li> para cada veículo
    minhaGaragem.veiculos.forEach(v => {
        const li = document.createElement('li');
        li.dataset.id = v.id; // Armazena o ID no elemento para referência

        // Define o ícone com base no tipo de veículo (instância da classe)
        let iconClass = 'fa-car'; // Padrão
        if (v instanceof CarroEsportivo) iconClass = 'fa-rocket';
        else if (v instanceof Caminhao) iconClass = 'fa-truck';

        li.innerHTML = `<i class="fas ${iconClass}"></i> <span>${v.modelo} (${v.cor})</span>`;

        // Adiciona classe 'selecionado' se for o veículo ativo
        if (v.id === minhaGaragem.veiculoSelecionadoId) {
            li.classList.add('selecionado');
        }

        // Adiciona listener de clique para selecionar o veículo
        li.addEventListener('click', () => {
            // Só executa a lógica se o veículo clicado não for o já selecionado
             if (v.id !== minhaGaragem.veiculoSelecionadoId) {
                 // Tenta selecionar na lógica da Garagem
                 if(minhaGaragem.selecionarVeiculo(v.id)){
                    ativarTab('tab-visao-geral'); // Volta para a aba principal
                    atualizarInterfaceCompleta(); // Atualiza toda a UI
                 } else {
                     // Caso selecionarVeiculo retorne false (erro inesperado)
                     console.warn(`Falha ao tentar selecionar veículo ${v.id}`);
                 }
             }
        });
        listaUl.appendChild(li); // Adiciona o item à lista na UI
    });
}

/**
 * Ativa uma aba específica no painel do veículo e desativa as outras.
 * @param {string} tabId - O ID do elemento da aba a ser ativada (ex: 'tab-visao-geral').
 * @returns {void}
 */
function ativarTab(tabId) {
    // Desativa todos os conteúdos de aba e links
    ui.tabContents.forEach(content => content.classList.remove('active'));
    ui.tabLinks.forEach(link => link.classList.remove('active'));

    // Ativa o conteúdo e o link correspondentes ao tabId
    const contentToActivate = document.getElementById(tabId);
    const linkToActivate = document.querySelector(`.tab-link[data-tab="${tabId}"]`);

    if (contentToActivate) contentToActivate.classList.add('active');
    if (linkToActivate) linkToActivate.classList.add('active');
    // console.log(`Aba ativa: ${tabId}`);
}

/**
 * Atualiza o display visual do velocímetro (SVG em arco).
 * Calcula a porcentagem da velocidade atual em relação à máxima e ajusta o arco.
 * Muda a cor do arco com base na velocidade.
 * @param {number} velocidade - A velocidade atual do veículo.
 * @param {number} velocidadeMaxima - A velocidade máxima do veículo.
 * @returns {void}
 */
function atualizarVelocimetro(velocidade, velocidadeMaxima) {
    // Pega as referências da UI (devem ter sido atualizadas em atualizarPainel...)
    const progressoPath = ui.velocimetroProgressoPath;
    const velocidadeTexto = ui.velocidadeAtual;

    // Só atualiza se os elementos existirem e o painel estiver visível
    if (!ui.painelVeiculoSelecionado || ui.painelVeiculoSelecionado.style.display === 'none' || !progressoPath || !velocidadeTexto) {
        // Reseta se não estiver visível
        if(velocidadeTexto) velocidadeTexto.textContent = '0 km/h';
        // Tenta resetar o path mesmo que não encontrado, para evitar erros se o painel sumir rápido
        try { if(progressoPath) progressoPath.style.strokeDashoffset = 251.2; } catch(e){}
        return;
    }

    const maxVel = velocidadeMaxima > 0 ? velocidadeMaxima : 1; // Evita divisão por zero
    const velocidadeAtual = Math.max(0, Math.min(velocidade, maxVel)); // Garante 0 <= vel <= max
    const comprimentoTotalArco = 251.2; // Deve ser igual ao stroke-dasharray no CSS
    const porcentagem = velocidadeAtual / maxVel;
    // O offset é o comprimento que NÃO é exibido
    const offset = comprimentoTotalArco * (1 - porcentagem);

    // Aplica o offset para "desenhar" o arco
    progressoPath.style.strokeDashoffset = offset;
    // Atualiza o texto
    velocidadeTexto.textContent = `${Math.round(velocidadeAtual)} km/h`;

    // Define a cor do arco com base na porcentagem da velocidade
    let corProgresso = 'var(--cor-primaria)'; // Azul padrão
    if (porcentagem > 0.85) { // Acima de 85% -> Vermelho
        corProgresso = 'var(--cor-perigo)';
    } else if (porcentagem > 0.6) { // Entre 60% e 85% -> Amarelo
        corProgresso = 'var(--cor-aviso)';
    }
    progressoPath.style.stroke = corProgresso;
}

/**
 * Renderiza a lista de histórico ou agendamentos de manutenção em um elemento <ul>.
 * @param {HTMLUListElement} ulElement - O elemento <ul> onde a lista será renderizada.
 * @param {Array<{id: string, texto: string}>} itens - Array de objetos contendo o ID e o texto formatado de cada manutenção.
 * @returns {void}
 */
function renderizarListaManutencao(ulElement, itens) {
     if (!ulElement) {
         console.error("Elemento UL para renderizar lista de manutenção não encontrado.");
         return;
     }
     ulElement.innerHTML = ''; // Limpa a lista anterior

     // Se não houver itens, exibe uma mensagem placeholder
     if (!itens || itens.length === 0) {
          // Determina se é histórico ou agendamento pelo ID do container pai
          const tipoLista = ulElement.closest('.maintenance-list')?.id === 'historicoManutencao' ? 'Histórico' : 'Agendamentos';
          ulElement.innerHTML = `<li style="font-style: italic; color: #888; text-align: center; padding: 15px;">Nenhum registro de ${tipoLista.toLowerCase()} encontrado.</li>`;
          return;
     }

     // Cria um item <li> para cada registro de manutenção
     itens.forEach(item => {
         const li = document.createElement('li');
         const textoSpan = document.createElement('span');
         textoSpan.textContent = item.texto; // Exibe o texto formatado
         li.appendChild(textoSpan);

         // Cria o botão de remover para este item
         const removeButton = document.createElement('button');
         removeButton.className = 'botao-remover-item';
         removeButton.title = 'Remover este item';
         removeButton.innerHTML = '<i class="fas fa-times"></i>';
         // Adiciona listener que chama a função de remover, passando o ID específico deste item
         removeButton.addEventListener('click', (event) => {
             event.stopPropagation(); // Previne que o clique no botão selecione o veículo (caso o LI tivesse listener)
             removerManutencaoItem(item.id);
            });

         li.appendChild(removeButton);
         ulElement.appendChild(li); // Adiciona o item à lista na UI
     });
}


/**
 * Atualiza todo o painel principal para exibir informações e controles
 * do veículo atualmente selecionado em `minhaGaragem`.
 * Esconde o painel e mostra mensagem se nenhum veículo estiver selecionado.
 * @returns {void}
 */
function atualizarPainelVeiculoSelecionado() {
    const veiculo = minhaGaragem.getVeiculoSelecionado();

    if (veiculo) {
        // Mostra o painel do veículo, esconde a mensagem de "selecione"
        ui.painelVeiculoSelecionado.style.display = 'block';
        ui.mensagemSelecione.style.display = 'none';

        // ---- Atualiza Header do Painel ----
        const baseInfo = veiculo.exibirInformacoesBase();
        ui.infoModeloTipo.textContent = `${baseInfo.modelo} (${veiculo.constructor.name})`;
        ui.infoCor.textContent = baseInfo.cor;
        ui.infoId.textContent = baseInfo.id;
        ui.botaoRemoverVeiculoHeader.style.display = 'inline-flex';

        // ---- Atualiza Imagem ----
        let imagemSrc = 'imagens/carro_normal.png'; // Padrão
        if (veiculo instanceof CarroEsportivo) imagemSrc = 'imagens/carro_esportivo.png';
        else if (veiculo instanceof Caminhao) imagemSrc = 'imagens/caminhaoo.png';
        ui.imagemVeiculo.src = imagemSrc;
        ui.imagemVeiculo.alt = `Imagem de ${veiculo.modelo}`;

        // ---- Atualiza Aba Visão Geral ----
        // Reseta estado inicial dos elementos específicos
        ui.infoEspecifica.innerHTML = '';
        ui.barraProgressoContainer.style.display = 'none';
        ui.infoStatusMotor.parentElement.style.display = 'none';
        ui.botoesAcoes.querySelectorAll('button').forEach(btn => btn.style.display = 'none');
        // Pega a referência atualizada do path do velocímetro DENTRO do painel que agora está visível
        ui.velocimetroProgressoPath = ui.painelVeiculoSelecionado.querySelector('.velocimetro-progresso');


        // Se for instância de Carro (ou subtipo), mostra controles de carro
        if (veiculo instanceof Carro) {
            const dadosCarro = veiculo.getDadosEspecificos(); // Pega dados como ligado, velocidade, etc.

            // Mostra Status do Motor
            ui.infoStatusMotor.parentElement.style.display = 'block';
            ui.infoStatusMotor.innerHTML = dadosCarro.ligado
                ? "<i class='fas fa-circle status-on'></i> Ligado"
                : "<i class='fas fa-circle status-off'></i> Desligado";

            // Mostra e atualiza Velocímetro
            ui.barraProgressoContainer.style.display = 'flex';
            atualizarVelocimetro(dadosCarro.velocidade, dadosCarro.velocidadeMaxima);

            // Mostra Botões Comuns
            ui.botoesAcoes.querySelector('[onclick*="ligar"]').style.display = 'inline-flex';
            ui.botoesAcoes.querySelector('[onclick*="desligar"]').style.display = 'inline-flex';
            ui.botoesAcoes.querySelector('[onclick*="acelerar"]').style.display = 'inline-flex';
            ui.botoesAcoes.querySelector('[onclick*="frear"]').style.display = 'inline-flex';

            // Habilita/Desabilita Botões Comuns
             ui.botoesAcoes.querySelector('[onclick*="ligar"]').disabled = dadosCarro.ligado;
             ui.botoesAcoes.querySelector('[onclick*="desligar"]').disabled = !dadosCarro.ligado;
             ui.botoesAcoes.querySelector('[onclick*="acelerar"]').disabled = !dadosCarro.ligado || dadosCarro.velocidade >= dadosCarro.velocidadeMaxima;
             ui.botoesAcoes.querySelector('[onclick*="frear"]').disabled = !dadosCarro.ligado || dadosCarro.velocidade === 0;

            // Mostra Informações e Botões Específicos do Subtipo
            if (veiculo instanceof CarroEsportivo) {
                 ui.infoEspecifica.innerHTML = `<p><i class="fas fa-bolt"></i> Boost Disponível: <span>${!dadosCarro.turboBoostUsado ? 'Sim' : 'Não'}</span></p>`;
                 ui.botaoTurbo.style.display = 'inline-flex';
                 ui.botaoTurbo.disabled = dadosCarro.turboBoostUsado || !dadosCarro.ligado || dadosCarro.velocidade === 0; // Precisa estar ligado e em movimento
            } else if (veiculo instanceof Caminhao) {
                 ui.infoEspecifica.innerHTML = `<p><i class="fas fa-weight-hanging"></i> Carga: <span>${dadosCarro.cargaAtual} / ${dadosCarro.capacidadeCarga} kg</span></p>`;
                 ui.botaoCarregar.style.display = 'inline-flex';
                 ui.botaoDescarregar.style.display = 'inline-flex';
                 // Desabilita carregar/descarregar se ligado ou se não houver ação possível (cheio/vazio)
                 ui.botaoCarregar.disabled = dadosCarro.ligado || dadosCarro.cargaAtual >= dadosCarro.capacidadeCarga;
                 ui.botaoDescarregar.disabled = dadosCarro.ligado || dadosCarro.cargaAtual === 0;
            }
        } else {
             // Caso seja um Veiculo base (se implementado) ou outro tipo sem ações de Carro
             ui.infoEspecifica.innerHTML = '<p><i>Este veículo não possui ações de condução.</i></p>';
        }

        // ---- Atualiza Aba Manutenção ----
        renderizarListaManutencao(ui.historicoUl, veiculo.getHistoricoPassadoFormatado());
        renderizarListaManutencao(ui.agendamentosUl, veiculo.getAgendamentosFuturosFormatados());

    } else {
        // Nenhum veículo selecionado
        ui.painelVeiculoSelecionado.style.display = 'none';
        ui.mensagemSelecione.style.display = 'block';
        ui.velocimetroProgressoPath = null; // Limpa a referência ao path
        atualizarVelocimetro(0, 1); // Garante que o velocímetro (mesmo escondido) está zerado
    }
}

/**
 * Função central para atualizar toda a interface gráfica principal,
 * chamando as funções específicas de atualização da sidebar e do painel.
 * @returns {void}
 */
function atualizarInterfaceCompleta() {
    atualizarListaVeiculosSidebar();
    atualizarPainelVeiculoSelecionado();
    // console.log("Interface gráfica atualizada.");
}


// --- Funções de Interação e Gerenciamento ---

/**
 * Função global chamada pelos botões de ação do veículo (ligar, acelerar, etc.).
 * Delega a ação para o método correspondente do veículo selecionado,
 * trata da persistência (salvar no LS) e atualiza a UI e notificações.
 * @param {string} acao - O nome da ação a ser executada (deve corresponder a um caso no switch).
 * @returns {void}
 */
function interagir(acao) {
    const veiculo = minhaGaragem.getVeiculoSelecionado();

    // Tratamento inicial se nenhum veículo estiver selecionado (exceto para remover)
    if (!veiculo && acao !== 'removerVeiculo') {
        showNotification("Selecione um veículo na lista lateral primeiro!", 'warning', 3000, ui);
        return;
    }
     // Tratamento específico para remover sem seleção (ação inválida)
     if (!veiculo && acao === 'removerVeiculo') {
          console.warn("Botão 'removerVeiculo' clicado sem veículo selecionado.");
          showNotification("Nenhum veículo selecionado para remover.", 'warning', 3000, ui);
          return;
     }

    let precisaSalvar = false; // Flag para indicar se o estado do veículo mudou e precisa ser salvo
    let acaoRealizada = false; // Flag para verificar se a ação principal foi executada
    // let feedbackMsg = ''; // Mensagens de feedback específicas podem ser geradas pela UI
    // let feedbackType = 'info'; // Tipo padrão do feedback

    try {
        // Executa a ação correspondente no veículo
        switch (acao) {
            case 'ligar':
                if (veiculo instanceof Carro) acaoRealizada = veiculo.ligar();
                if (acaoRealizada) precisaSalvar = true;
                // Feedback visual (mudança de status) e sonoro (console.log) já ocorrem. Notificação opcional.
                // if(acaoRealizada) showNotification(`${veiculo.modelo} ligado.`, 'success', 1500, ui);
                break;
            case 'desligar':
                if (veiculo instanceof Carro) acaoRealizada = veiculo.desligar();
                if (acaoRealizada) precisaSalvar = true;
                // if(acaoRealizada) showNotification(`${veiculo.modelo} desligado.`, 'success', 1500, ui);
                break;
            case 'acelerar':
                if (veiculo instanceof Carro) acaoRealizada = veiculo.acelerar();
                if (acaoRealizada) precisaSalvar = true;
                else if (veiculo instanceof Carro && !veiculo.ligado) showNotification('Ligue o veículo primeiro!', 'warning', 3000, ui);
                else if (veiculo instanceof Carro && veiculo.velocidade >= veiculo.velocidadeMaxima) showNotification(`${veiculo.modelo} já está na velocidade máxima!`, 'info', 2000, ui);
                break;
            case 'frear':
                if (veiculo instanceof Carro) acaoRealizada = veiculo.frear();
                if (acaoRealizada) precisaSalvar = true;
                else if (veiculo instanceof Carro && veiculo.velocidade === 0) showNotification(`${veiculo.modelo} já está parado.`, 'info', 2000, ui);
                break;
            case 'ativarTurbo':
                if (veiculo instanceof CarroEsportivo) {
                    acaoRealizada = veiculo.ativarTurbo(); // A classe já lida com notificações internas
                    if (acaoRealizada) precisaSalvar = true;
                } else {
                    showNotification("Esta ação só está disponível para Carros Esportivos.", 'warning', 3000, ui);
                }
                break;
            case 'carregar':
                if (veiculo instanceof Caminhao) {
                     acaoRealizada = veiculo.carregar(); // Classe lida com notificações
                     if (acaoRealizada) precisaSalvar = true;
                 } else {
                     showNotification("Esta ação só está disponível para Caminhões.", 'warning', 3000, ui);
                 }
                break;
             case 'descarregar':
                 if (veiculo instanceof Caminhao) {
                     acaoRealizada = veiculo.descarregar(); // Classe lida com notificações
                     if (acaoRealizada) precisaSalvar = true;
                 } else {
                    showNotification("Esta ação só está disponível para Caminhões.", 'warning', 3000, ui);
                 }
                break;
            case 'removerVeiculo':
                // A confirmação e lógica de remoção estão agora em sua própria função
                removerVeiculoSelecionado(); // Chama a função dedicada
                return; // Sai da função interagir, pois removerVeiculoSelecionado cuida de tudo
            default:
                console.error("Ação de interação desconhecida:", acao);
                showNotification(`Ação desconhecida: ${acao}`, 'error', 3000, ui);
        }

        // Salva no LocalStorage se alguma ação modificou o estado do veículo
        if (precisaSalvar) {
            minhaGaragem.salvarNoLocalStorage();
        }

    } catch (error) {
        // Captura erros inesperados durante a execução da ação
        console.error(`Erro ao executar ação '${acao}' para ${veiculo?.modelo || 'veículo desconhecido'}:`, error);
        showNotification(`Ocorreu um erro inesperado ao executar a ação '${acao}'. Verifique o console.`, 'error', 5000, ui);
    } finally {
        // Atualiza o painel após qualquer ação bem-sucedida ou falha (exceto remover)
        // para refletir o estado atual (velocidade, ligado, carga, etc.)
        if (acao !== 'removerVeiculo') {
            atualizarPainelVeiculoSelecionado();
        }
        // A atualização após 'removerVeiculo' é feita dentro de removerVeiculoSelecionado
    }
}
// Disponibiliza a função globalmente para ser chamada pelos `onclick` no HTML
window.interagir = interagir;


/**
 * Adiciona um novo veículo à garagem com base nos dados do formulário modal.
 * Valida os dados, cria a instância da classe apropriada, adiciona à garagem,
 * salva no LocalStorage, fecha o modal e atualiza a UI.
 * @returns {void}
 */
function adicionarNovoVeiculo() {
    // Pega os valores dos campos do formulário
    const tipo = ui.novoVeiculoTipo.value;
    const modelo = ui.novoVeiculoModelo.value.trim();
    const cor = ui.novoVeiculoCor.value.trim();
    const capacidadeStr = ui.novoVeiculoCapacidade.value;
    let capacidadeCarga = 0;

    // --- Validações ---
    if (!tipo) { showNotification("Selecione o tipo de veículo.", 'warning', 3000, ui); ui.novoVeiculoTipo.focus(); return; }
    if (!modelo) { showNotification("Informe o modelo do veículo.", 'warning', 3000, ui); ui.novoVeiculoModelo.focus(); return; }
    if (!cor) { showNotification("Informe a cor do veículo.", 'warning', 3000, ui); ui.novoVeiculoCor.focus(); return; }

    let novoVeiculo = null;
    try {
        // Cria a instância da classe correta com base no tipo selecionado
        switch (tipo) {
            case 'Carro':
                novoVeiculo = new Carro(modelo, cor);
                break;
            case 'CarroEsportivo':
                novoVeiculo = new CarroEsportivo(modelo, cor);
                break;
            case 'Caminhao':
                 capacidadeCarga = parseInt(capacidadeStr, 10);
                 // Validação específica da capacidade para caminhão
                 if (!capacidadeStr || isNaN(capacidadeCarga) || capacidadeCarga <= 0) {
                     showNotification("Para Caminhão, informe uma capacidade de carga válida (kg, número positivo).", 'warning', 4000, ui);
                     ui.novoVeiculoCapacidade.focus(); return; // Interrompe
                 }
                novoVeiculo = new Caminhao(modelo, cor, capacidadeCarga);
                break;
            default: // Caso algum valor inválido seja selecionado
                showNotification("Tipo de veículo selecionado é inválido.", 'error', 3000, ui); return;
        }
    } catch (error) {
        // Captura erros que podem ocorrer nos construtores das classes
        console.error("Erro ao instanciar novo veículo:", error);
        showNotification(`Erro ao criar veículo: ${error.message}`, 'error', 5000, ui); return;
    }

    // --- Adiciona à Garagem e Atualiza ---
    if (minhaGaragem.adicionarVeiculo(novoVeiculo)) { // Tenta adicionar à lógica da garagem
        minhaGaragem.salvarNoLocalStorage(); // Salva o novo estado da garagem
        showNotification(`${novoVeiculo.modelo} adicionado com sucesso!`, 'success', 3000, ui);
        ui.formNovoVeiculo.reset(); // Limpa os campos do formulário
        ui.divCapacidadeCaminhao.style.display = 'none'; // Garante que o campo de capacidade fique oculto
        ui.modalAdicionar.close(); // Fecha a janela modal

        // Seleciona automaticamente o veículo recém-adicionado
        if(minhaGaragem.selecionarVeiculo(novoVeiculo.id)){
             ativarTab('tab-visao-geral'); // Garante que a aba correta está ativa
             atualizarInterfaceCompleta(); // Atualiza toda a UI
        }
    } else {
         // Caso adicionarVeiculo retorne false (ex: ID duplicado - raro)
         showNotification(`Não foi possível adicionar ${modelo}. Verifique se já existe.`, 'warning', 4000, ui);
         ui.novoVeiculoModelo.focus(); // Foca no campo modelo
    }
}

/**
 * Função chamada pelo submit do formulário de manutenção.
 * Coleta os dados, cria uma instância de Manutencao, valida,
 * adiciona ao veículo selecionado, salva e atualiza a UI.
 * @param {Event} event - O objeto do evento de submit do formulário.
 * @returns {void}
 */
function agendarOuRegistrarManutencao(event) {
    event.preventDefault(); // Previne o recarregamento da página
    const veiculo = minhaGaragem.getVeiculoSelecionado();

    // Verifica se um veículo está selecionado
    if (!veiculo) {
        showNotification("Selecione um veículo antes de registrar manutenção!", 'warning', 3000, ui);
        return;
    }

    // Coleta os dados do formulário
    const dataHora = ui.manutencaoDataHora.value;
    const tipo = ui.manutencaoTipo.value.trim();
    const custoStr = ui.manutencaoCusto.value; // Custo como string
    const descricao = ui.manutencaoDescricao.value.trim();

    // Validações básicas de preenchimento
    if (!dataHora) { showNotification("Selecione a data e hora da manutenção.", 'warning', 3000, ui); ui.manutencaoDataHora.focus(); return; }
    if (!tipo) { showNotification("Informe o tipo de serviço realizado ou agendado.", 'warning', 3000, ui); ui.manutencaoTipo.focus(); return; }

    let novaManutencao;
    try {
         // Cria a instância. O construtor lida com a conversão de custo e data.
         novaManutencao = new Manutencao(dataHora, tipo, custoStr, descricao);
         // Valida se os dados essenciais (data, tipo) são válidos após a criação
         if (!novaManutencao.validarDados()) {
              showNotification("Dados da manutenção inválidos (verifique data/tipo).", 'error', 4000, ui);
              if (!novaManutencao.isValidDate()) ui.manutencaoDataHora.focus();
              else if (!tipo) ui.manutencaoTipo.focus();
              return; // Interrompe se inválido
         }
    } catch (error) {
         console.error("Erro ao criar instância de Manutencao:", error);
         showNotification("Erro ao processar dados da manutenção. Verifique a data/hora.", 'error', 4000, ui); return;
    }

    // Tenta adicionar a manutenção ao veículo selecionado
    if (veiculo.adicionarManutencao(novaManutencao)) {
        minhaGaragem.salvarNoLocalStorage(); // Salva o veículo com a nova manutenção
        ui.formManutencao.reset(); // Limpa o formulário
        atualizarPainelVeiculoSelecionado(); // Atualiza o painel para mostrar a nova lista
        showNotification("Registro de manutenção salvo com sucesso!", 'success', 3000, ui);
    } else {
        // Se adicionarManutencao retornou false (ex: duplicado ou erro interno)
        showNotification("Não foi possível salvar a manutenção (verifique console).", 'warning', 4000, ui);
    }
}

/**
 * Remove um item específico do histórico ou agendamento de manutenção.
 * Chamada pelo clique no botão 'x' ao lado de cada item na lista.
 * @param {string} idManutencao - O ID único do registro de manutenção a ser removido.
 * @returns {void}
 */
function removerManutencaoItem(idManutencao) {
     const veiculo = minhaGaragem.getVeiculoSelecionado();
     // Verifica se há um veículo selecionado (segurança extra)
     if (!veiculo) {
         showNotification("Erro: Veículo não selecionado para remover manutenção.", 'error', 3000, ui); return;
     }

     // Encontra o item para mostrar mensagem de confirmação mais clara
     const itemParaRemover = veiculo.historicoManutencao.find(m => m.id === idManutencao);
     const msgConfirm = itemParaRemover
        ? `Tem certeza que deseja remover este registro/agendamento?\n\n"${itemParaRemover.retornarFormatada(true)}"`
        : "Tem certeza que deseja remover este item de manutenção?";

     // Pede confirmação ao usuário
     if (confirm(msgConfirm)) {
         // Tenta remover a manutenção da lógica do veículo
         if (veiculo.removerManutencao(idManutencao)) {
             minhaGaragem.salvarNoLocalStorage(); // Salva o estado atualizado
             atualizarPainelVeiculoSelecionado(); // Atualiza a UI (remove o item da lista)
             showNotification("Item de manutenção removido.", 'success', 2000, ui);
         } else {
             // Se removerManutencao falhar (ex: item não encontrado - raro aqui)
              showNotification("Não foi possível remover o item (pode já ter sido removido).", 'error', 3000, ui);
         }
     }
     // Se o usuário cancelar, não faz nada.
}

/**
 * Lida com a confirmação e remoção do veículo atualmente selecionado.
 * Chamada pela função `interagir` ou diretamente pelo botão no header.
 * @returns {void}
 */
function removerVeiculoSelecionado() {
    const veiculo = minhaGaragem.getVeiculoSelecionado();
    if (!veiculo) {
        console.warn("Tentativa de chamar removerVeiculoSelecionado sem veículo.");
        showNotification("Nenhum veículo selecionado para remover.", 'warning', 3000, ui);
        return;
    }

    // Pede confirmação final
    if (confirm(`ATENÇÃO!\n\nRemover permanentemente ${veiculo.modelo} (${veiculo.cor}) da garagem?\n\nEsta ação NÃO pode ser desfeita.`)) {
         // Tenta remover da lógica da garagem
         if (minhaGaragem.removerVeiculo(veiculo.id)) {
              minhaGaragem.salvarNoLocalStorage(); // Salva o estado sem o veículo
              showNotification(`${veiculo.modelo} removido permanentemente.`, 'success', 3000, ui);
              // A remoção na Garagem já limpa a seleção, então a atualização da UI mostrará a mensagem
              atualizarInterfaceCompleta(); // Atualiza toda a UI
         } else {
             // Caso a remoção falhe por algum motivo inesperado
             showNotification(`Falha ao remover ${veiculo.modelo}.`, 'error', 3000, ui);
         }
    }
    // Se o usuário cancelar, não faz nada.
}


// --- Inicialização da Aplicação ---

/**
 * Listener executado quando o conteúdo HTML da página foi completamente carregado e parseado.
 * Responsável por carregar dados salvos, configurar listeners de eventos da UI
 * e renderizar o estado inicial da aplicação.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Carregado. Iniciando Garagem Virtual...");

    // 1. Carrega Veículos do LocalStorage
    try {
        const veiculosSalvos = Garagem.carregarDoLocalStorage();
        minhaGaragem.veiculos = veiculosSalvos; // Popula a instância da garagem
    } catch (error) {
        console.error("Erro crítico durante o carregamento inicial da garagem:", error);
        // Não impede a aplicação de carregar, mas pode começar vazia ou com dados parciais.
    }


    // 2. Carrega ID do Veículo Selecionado Anteriormente
    try {
        const idSelecionadoSalvo = localStorage.getItem('garagemVeiculoSelecionadoId');
        // Tenta selecionar apenas se o ID foi encontrado E o veículo correspondente existe na lista carregada
        if (idSelecionadoSalvo && minhaGaragem.encontrarVeiculo(idSelecionadoSalvo)) {
            minhaGaragem.veiculoSelecionadoId = idSelecionadoSalvo; // Define o ID na instância
            console.log(`Seleção anterior restaurada: ${minhaGaragem.getVeiculoSelecionado()?.modelo || 'ID inválido'}`);
        } else {
             minhaGaragem.veiculoSelecionadoId = null; // Garante que começa sem seleção
             if(idSelecionadoSalvo) localStorage.removeItem('garagemVeiculoSelecionadoId'); // Limpa ID inválido do LS
        }
    } catch(error) {
        console.error("Erro ao carregar seleção salva:", error);
        minhaGaragem.veiculoSelecionadoId = null;
        localStorage.removeItem('garagemVeiculoSelecionadoId');
    }

    // 3. Configura Listeners de Eventos da UI
    // Listener para abrir o modal de adicionar veículo
    if (ui.btnAbrirModalAdicionar && ui.modalAdicionar) {
        ui.btnAbrirModalAdicionar.addEventListener('click', () => {
            ui.formNovoVeiculo.reset(); // Limpa o formulário ao abrir
            ui.divCapacidadeCaminhao.style.display = 'none'; // Esconde campo de capacidade
            try {
                 ui.modalAdicionar.showModal(); // Abre o modal
            } catch (e) { console.error("Erro ao abrir modal:", e); }
        });
    } else {
         console.error("Elementos do modal de adicionar (botão ou dialog) não encontrados.");
    }

    // Listener para fechar o modal pelo botão 'Cancelar'
    if (ui.btnFecharModalAdicionar && ui.modalAdicionar) {
        ui.btnFecharModalAdicionar.addEventListener('click', () => ui.modalAdicionar.close());
    }

    // Listeners para o modal (fechar ao clicar fora / ESC)
    if (ui.modalAdicionar) {
        ui.modalAdicionar.addEventListener('click', (event) => { // Clicar no backdrop
            if (event.target === ui.modalAdicionar) ui.modalAdicionar.close();
        });
         ui.modalAdicionar.addEventListener('keydown', (event) => { // Tecla ESC
             if (event.key === 'Escape') ui.modalAdicionar.close();
         });
    }

    // Listener para o submit do formulário de NOVO VEÍCULO
    if (ui.formNovoVeiculo) {
        ui.formNovoVeiculo.addEventListener('submit', adicionarNovoVeiculo); // Não precisa de event.preventDefault() aqui se já está na função
    } else {
         console.error("Formulário #formNovoVeiculo não encontrado.");
    }

    // Listener para mudar o tipo de veículo (mostra/esconde capacidade)
    if (ui.novoVeiculoTipo) {
        ui.novoVeiculoTipo.addEventListener('change', (event) => {
            ui.divCapacidadeCaminhao.style.display = (event.target.value === 'Caminhao') ? 'block' : 'none';
        });
    } else {
         console.error("Select #novoVeiculoTipo não encontrado.");
    }

    // Listeners para clicar nas ABAS (Visão Geral / Manutenção)
    ui.tabLinks.forEach(button => {
        button.addEventListener('click', () => ativarTab(button.dataset.tab));
    });

    // Listener para o submit do formulário de MANUTENÇÃO
    if (ui.formManutencao) {
         ui.formManutencao.addEventListener('submit', agendarOuRegistrarManutencao);
    } else {
         console.error("Formulário #formManutencao não encontrado.");
    }

    // Listener para fechar a NOTIFICAÇÃO
    if (ui.notificationCloseBtn) {
        ui.notificationCloseBtn.addEventListener('click', () => hideNotification(ui));
    } else {
         console.error("Botão de fechar notificação não encontrado.");
    }

    // Listener para o botão REMOVER no header do painel do veículo
    if(ui.botaoRemoverVeiculoHeader) {
        ui.botaoRemoverVeiculoHeader.addEventListener('click', removerVeiculoSelecionado);
    } else {
        console.error("Botão #botaoRemoverVeiculoHeader não encontrado.");
    }


    // 4. Renderização Inicial da Interface
    ativarTab('tab-visao-geral'); // Garante que a aba correta está ativa
    atualizarInterfaceCompleta(); // Desenha a UI com base nos dados carregados

    // 5. Verificação de Agendamentos Próximos (com delay)
    setTimeout(() => {
        try {
            if(minhaGaragem.veiculos.length > 0) {
                minhaGaragem.verificarAgendamentosProximos(); // A instância da garagem verifica
                // Idealmente, verificarAgendamentosProximos retornaria a lista
                // e o código aqui no main.js chamaria showNotification para cada um.
            }
        } catch(error) {
            console.error("Erro ao verificar agendamentos próximos:", error);
        }
    }, 2500); // Aumentei um pouco o delay

    console.log("Garagem Virtual inicializada e pronta.");
});