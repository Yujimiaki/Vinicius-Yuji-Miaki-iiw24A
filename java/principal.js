// java/principal.js
'use strict';

// --- Importações ---
import Garagem from './models/garagem.js';
import Manutencao from './models/manutencao.js';
import Carro from './models/carro.js';
import CarroEsportivo from './models/Carroesportivo.js';
import Caminhao from './models/caminhao.js';
import { showNotification, hideNotification } from './utils/notificacoes.js';

// --- Referências aos Elementos da UI (Garagem) ---
const ui = {
    // ... (outras referências UI da garagem permanecem as mesmas) ...
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
    infoStatusMotorContainer: document.querySelector('.status-motor-container'),
    infoStatusMotor: document.getElementById('info-status-motor'),
    barraProgressoContainer: document.getElementById('barraProgressoContainer'),
    velocidadeAtual: document.getElementById('velocidadeAtual'),
    velocimetroProgressoPath: null,
    infoEspecifica: document.getElementById('info-especifica'),
    botoesAcoesContainer: document.getElementById('botoesAcoes'),
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
    btnVerDetalhesExtras: document.getElementById('btnVerDetalhesExtras'),
    detalhesExtrasVeiculoDiv: document.getElementById('detalhesExtrasVeiculo'),

    // --- Referências UI (Previsão do Tempo) ---
    cidadeInputTempo: document.getElementById('cidade-input-tempo'),
    verificarClimaBtn: document.getElementById('verificar-clima-btn'),
    previsaoResultadoDivTempo: document.getElementById('previsao-tempo-resultado'),
    statusMensagemTempoDiv: document.getElementById('status-mensagem-tempo'),
    // NOVA REFERÊNCIA PARA BOTÕES DE FILTRO DE DIAS
    filtroDiasBotoes: document.querySelectorAll('.filtro-dia-btn'),
};

// --- Instância Principal da Aplicação (Garagem) ---
const minhaGaragem = new Garagem();

// --- Variáveis Globais ---
let velocimetroPathLength = 251.2;
const WEATHER_API_KEY = "569ee28c1908ad6eaadb431e635166be"; // Sua chave

// NOVAS VARIÁVEIS GLOBAIS PARA FILTRO DE PREVISÃO
let diasFiltroPrevisao = 5; // Padrão para 5 dias
let previsaoCompletaApiCache = []; // Cache da previsão completa de 5 dias da última cidade buscada
let cidadeAtualPrevisaoCache = ""; // Nome da cidade para a qual o cache é válido

// --- Funções de Atualização da Interface Gráfica (UI) - GARAGEM ---
// ... (atualizarListaVeiculosSidebar, ativarTab, atualizarVelocimetro, renderizarListaManutencao, atualizarPainelVeiculoSelecionado, atualizarInterfaceCompleta - SEM ALTERAÇÕES DIRETAS AQUI) ...
// Vou colar essas funções novamente para garantir que o arquivo esteja completo e evitar omissões.
function atualizarListaVeiculosSidebar() {
    const listaUl = ui.listaVeiculosSidebar;
    if (!listaUl) {
        console.error("Elemento #listaVeiculosSidebar não encontrado.");
        return;
    }
    listaUl.innerHTML = '';

    if (minhaGaragem.veiculos.length === 0) {
        listaUl.innerHTML = '<li class="placeholder">Nenhum veículo na garagem.</li>';
        return;
    }
    const veiculosParaExibir = [...minhaGaragem.veiculos]; // Cria cópia para evitar modificar original durante iteração
    veiculosParaExibir.sort((a,b) => a.modelo.localeCompare(b.modelo)); // Garante ordenação
    veiculosParaExibir.forEach(v => {
        const li = document.createElement('li');
        li.dataset.id = v.id;
        let iconClass = 'fa-car';
        if (v instanceof CarroEsportivo) iconClass = 'fa-rocket';
        else if (v instanceof Caminhao) iconClass = 'fa-truck';
        li.innerHTML = `<i class="fas ${iconClass}"></i> <span>${v.modelo} (${v.cor})</span>`;
        if (v.id === minhaGaragem.veiculoSelecionadoId) {
            li.classList.add('selecionado');
        }
        li.addEventListener('click', () => {
             if (v.id !== minhaGaragem.veiculoSelecionadoId) {
                 if(minhaGaragem.selecionarVeiculo(v.id)){
                    ativarTab('tab-visao-geral'); // Volta para a aba principal ao selecionar novo veículo
                    atualizarInterfaceCompleta();
                 } else {
                     console.warn(`Falha ao selecionar veículo ID: ${v.id}`);
                 }
             }
        });
        listaUl.appendChild(li);
    });
}
function ativarTab(tabId) {
    if (!ui.tabContents || !ui.tabLinks) return;
    ui.tabContents.forEach(content => content?.classList.remove('active'));
    ui.tabLinks.forEach(link => {
        link?.classList.remove('active');
        link?.setAttribute('aria-selected', 'false');
    });
    const contentToActivate = document.getElementById(tabId);
    const linkToActivate = document.querySelector(`.tab-link[data-tab="${tabId}"]`);
    if (contentToActivate) contentToActivate.classList.add('active');
    if (linkToActivate) {
        linkToActivate.classList.add('active');
        linkToActivate.setAttribute('aria-selected', 'true');
    }
}
function atualizarVelocimetro(velocidade, velocidadeMaxima) {
    // Tenta obter o path do velocímetro apenas se ele ainda não foi obtido E o painel está visível
    if (!ui.velocimetroProgressoPath && ui.painelVeiculoSelecionado && ui.painelVeiculoSelecionado.style.display !== 'none') {
        ui.velocimetroProgressoPath = ui.painelVeiculoSelecionado.querySelector('.velocimetro-progresso');
        if (!ui.velocimetroProgressoPath) { // Se mesmo assim não encontrar, desabilita
             if(ui.barraProgressoContainer) ui.barraProgressoContainer.style.display = 'none';
             console.warn("Elemento .velocimetro-progresso não encontrado no painel do veículo.");
             return;
        }
    }

    // Se o container da barra de progresso não deve ser exibido ou o path não existe, reseta e sai
    if (!ui.barraProgressoContainer || ui.barraProgressoContainer.style.display === 'none' || !ui.velocimetroProgressoPath) {
        if (ui.velocidadeAtual) ui.velocidadeAtual.textContent = '0 km/h';
        if (ui.velocimetroProgressoPath) ui.velocimetroProgressoPath.style.strokeDashoffset = velocimetroPathLength; // Reseta o progresso
        return;
    }

    if (!ui.velocidadeAtual) return; // Não pode atualizar o texto da velocidade

    const maxVel = Math.max(1, velocidadeMaxima); // Evita divisão por zero
    const velocidadeAtualDisplay = Math.max(0, Math.min(velocidade, maxVel)); // Garante que a velocidade está nos limites
    const porcentagem = velocidadeAtualDisplay / maxVel;
    const offset = velocimetroPathLength * (1 - porcentagem);

    try {
        ui.velocimetroProgressoPath.style.strokeDashoffset = offset;
        ui.velocidadeAtual.textContent = `${Math.round(velocidadeAtualDisplay)} km/h`;

        let corProgresso = 'var(--cor-primaria)'; // Cor padrão
        if (porcentagem > 0.85) corProgresso = 'var(--cor-perigo)'; // Muito rápido
        else if (porcentagem > 0.6) corProgresso = 'var(--cor-aviso)'; // Rápido
        ui.velocimetroProgressoPath.style.stroke = corProgresso;
    } catch (e) {
        // Em caso de erro (raro aqui, mas por segurança), esconde o container
        if(ui.barraProgressoContainer) ui.barraProgressoContainer.style.display = 'none';
        console.error("Erro ao atualizar o velocímetro:", e);
    }
}
function renderizarListaManutencao(ulElement, itens) {
     if (!ulElement) {
        console.warn("Elemento <ul> para lista de manutenção não fornecido.");
        return;
     }
     ulElement.innerHTML = ''; // Limpa a lista existente
     if (!itens || itens.length === 0) {
          const tipoListaTexto = ulElement.closest('.maintenance-list')?.id === 'historicoManutencao'
            ? 'histórico'
            : 'agendamentos';
          ulElement.innerHTML = `<li class="placeholder">Nenhum registro de ${tipoListaTexto} encontrado.</li>`;
          return;
     }
     itens.forEach(item => {
         const li = document.createElement('li');
         li.dataset.itemId = item.id; // ID do item de manutenção para remoção

         const textoSpan = document.createElement('span');
         textoSpan.textContent = item.texto;
         li.appendChild(textoSpan);

         const removeButton = document.createElement('button');
         removeButton.className = 'botao-remover-item';
         removeButton.title = 'Remover este item';
         removeButton.innerHTML = '<i class="fas fa-times"></i>';
         removeButton.setAttribute('aria-label', `Remover item de manutenção: ${item.texto.substring(0, 30)}...`);
         li.appendChild(removeButton);

         ulElement.appendChild(li);
     });
}
function atualizarPainelVeiculoSelecionado() {
    const veiculo = minhaGaragem.getVeiculoSelecionado();

    // Reseta e esconde detalhes extras da API
    if (ui.detalhesExtrasVeiculoDiv) {
        ui.detalhesExtrasVeiculoDiv.innerHTML = '';
        ui.detalhesExtrasVeiculoDiv.style.display = 'none';
    }
    if (ui.btnVerDetalhesExtras) {
        ui.btnVerDetalhesExtras.style.display = 'none';
        ui.btnVerDetalhesExtras.disabled = false; // Reabilita para próxima seleção
    }

    if (veiculo) {
        if (ui.painelVeiculoSelecionado) ui.painelVeiculoSelecionado.style.display = 'block';
        if (ui.mensagemSelecione) ui.mensagemSelecione.style.display = 'none';

        const baseInfo = veiculo.exibirInformacoesBase();
        if(ui.infoModeloTipo) ui.infoModeloTipo.textContent = `${baseInfo.modelo} (${veiculo.constructor.name})`;
        if(ui.infoCor) ui.infoCor.textContent = baseInfo.cor;
        if(ui.infoId) ui.infoId.textContent = baseInfo.id;
        if(ui.botaoRemoverVeiculoHeader) ui.botaoRemoverVeiculoHeader.style.display = 'inline-flex';

        let imagemSrc = 'imagens/carro_normal.png'; // Imagem padrão
        if (veiculo instanceof CarroEsportivo) imagemSrc = 'imagens/carro_esportivo.png';
        else if (veiculo instanceof Caminhao) imagemSrc = 'imagens/caminhao.png';
        if (ui.imagemVeiculo) {
            ui.imagemVeiculo.src = imagemSrc;
            ui.imagemVeiculo.alt = `Imagem de ${veiculo.modelo}`;
        }

        if (ui.btnVerDetalhesExtras) ui.btnVerDetalhesExtras.style.display = 'inline-flex';

        // Reseta áreas específicas antes de preencher
        if(ui.infoEspecifica) ui.infoEspecifica.innerHTML = '';
        if(ui.barraProgressoContainer) ui.barraProgressoContainer.style.display = 'none';
        if(ui.infoStatusMotorContainer) ui.infoStatusMotorContainer.style.display = 'none';
        if(ui.botoesAcoesContainer) ui.botoesAcoesContainer.querySelectorAll('button').forEach(btn => btn.style.display = 'none'); // Esconde todos os botões de ação inicialmente

        if (veiculo instanceof Carro) { // Verifica se é Carro ou uma subclasse
            const dadosCarro = veiculo.getDadosEspecificos();

            if (ui.infoStatusMotorContainer && ui.infoStatusMotor) {
                ui.infoStatusMotorContainer.style.display = 'block';
                ui.infoStatusMotor.innerHTML = dadosCarro.ligado
                    ? "<i class='fas fa-circle status-on'></i> Ligado"
                    : "<i class='fas fa-circle status-off'></i> Desligado";
            }

            // Só mostra o velocímetro se o veículo tiver essa propriedade (Carro e subclasses)
            if (ui.velocimetroProgressoPath && ui.barraProgressoContainer) {
                 ui.barraProgressoContainer.style.display = 'flex'; // Mostra o container do velocímetro
                 atualizarVelocimetro(dadosCarro.velocidade, dadosCarro.velocidadeMaxima);
            } else if (ui.barraProgressoContainer) {
                 ui.barraProgressoContainer.style.display = 'none'; // Esconde se não houver path (ou para veículos sem velocímetro)
            }

            // Botões comuns a todos os Carros
            const btnLigar = ui.botoesAcoesContainer?.querySelector('[data-action="ligar"]');
            const btnDesligar = ui.botoesAcoesContainer?.querySelector('[data-action="desligar"]');
            const btnAcelerar = ui.botoesAcoesContainer?.querySelector('[data-action="acelerar"]');
            const btnFrear = ui.botoesAcoesContainer?.querySelector('[data-action="frear"]');

            if(btnLigar) { btnLigar.style.display = 'inline-flex'; btnLigar.disabled = dadosCarro.ligado; }
            if(btnDesligar) { btnDesligar.style.display = 'inline-flex'; btnDesligar.disabled = !dadosCarro.ligado; }
            if(btnAcelerar) { btnAcelerar.style.display = 'inline-flex'; btnAcelerar.disabled = !dadosCarro.ligado || dadosCarro.velocidade >= dadosCarro.velocidadeMaxima; }
            if(btnFrear) { btnFrear.style.display = 'inline-flex'; btnFrear.disabled = !dadosCarro.ligado || dadosCarro.velocidade === 0; }

            // Informações e botões específicos
            if (veiculo instanceof CarroEsportivo) {
                if(ui.infoEspecifica) ui.infoEspecifica.innerHTML = `<p><i class="fas fa-bolt"></i> <strong>Boost:</strong> <span>${!dadosCarro.turboBoostUsado ? 'Disponível' : 'Já usado!'}</span></p>`;
                 const btnTurbo = ui.botoesAcoesContainer?.querySelector('[data-action="ativarTurbo"]');
                 if(btnTurbo) {
                     btnTurbo.style.display = 'inline-flex';
                     btnTurbo.disabled = dadosCarro.turboBoostUsado || !dadosCarro.ligado || dadosCarro.velocidade === 0;
                 }
            } else if (veiculo instanceof Caminhao) {
                if(ui.infoEspecifica) ui.infoEspecifica.innerHTML = `<p><i class="fas fa-weight-hanging"></i> <strong>Carga:</strong> <span>${dadosCarro.cargaAtual ?? 0} / ${dadosCarro.capacidadeCarga ?? '?'} kg</span></p>`;
                 const btnCarregar = ui.botoesAcoesContainer?.querySelector('[data-action="carregar"]');
                 const btnDescarregar = ui.botoesAcoesContainer?.querySelector('[data-action="descarregar"]');
                 if(btnCarregar) {
                     btnCarregar.style.display = 'inline-flex';
                     btnCarregar.disabled = dadosCarro.ligado || dadosCarro.cargaAtual >= dadosCarro.capacidadeCarga;
                 }
                 if(btnDescarregar) {
                     btnDescarregar.style.display = 'inline-flex';
                     btnDescarregar.disabled = dadosCarro.ligado || dadosCarro.cargaAtual === 0;
                 }
            } else { // É um Carro normal (não esportivo, não caminhão)
                 if(ui.infoEspecifica) ui.infoEspecifica.innerHTML = '<p><i>Este é um carro padrão.</i></p>';
            }
        } else { // Não é um carro (pode ser um Veiculo base, se permitido, ou erro)
             if(ui.infoEspecifica) ui.infoEspecifica.innerHTML = '<p><i>Controles de condução não disponíveis para este tipo de veículo.</i></p>';
             atualizarVelocimetro(0, 1); // Reseta velocímetro
        }
        renderizarListaManutencao(ui.historicoUl, veiculo.getHistoricoPassadoFormatado());
        renderizarListaManutencao(ui.agendamentosUl, veiculo.getAgendamentosFuturosFormatados());
    } else { // Nenhum veículo selecionado
        if(ui.painelVeiculoSelecionado) ui.painelVeiculoSelecionado.style.display = 'none';
        if(ui.mensagemSelecione) ui.mensagemSelecione.style.display = 'block';
        ui.velocimetroProgressoPath = null; // Reseta o path para ser re-obtido na próxima seleção
        atualizarVelocimetro(0, 1); // Reseta velocímetro visualmente
    }
}
function atualizarInterfaceCompleta() {
    atualizarListaVeiculosSidebar();
    atualizarPainelVeiculoSelecionado();
}

// --- Funções de Interação e Gerenciamento (Garagem) ---
// ... (lidarComAcaoVeiculo, adicionarNovoVeiculo, etc. - SEM ALTERAÇÕES DIRETAS AQUI) ...
function lidarComAcaoVeiculo(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const acao = button.dataset.action;
    const veiculo = minhaGaragem.getVeiculoSelecionado();
    if (!veiculo) {
        showNotification("Selecione um veículo na lista lateral primeiro!", 'warning', 3000, ui);
        return;
    }
    let precisaSalvar = false;
    let resultadoAcao = { success: false, message: `Ação '${acao}' não implementada ou falhou.` };
    try {
        if (typeof veiculo[acao] === 'function') {
             resultadoAcao = veiculo[acao](); // Chama o método do veículo
             if (resultadoAcao === undefined || resultadoAcao === null) { // Se o método não retornar nada, assume sucesso
                resultadoAcao = { success: true };
             }
             precisaSalvar = resultadoAcao.success; // Salva se a ação foi bem-sucedida
         } else {
              resultadoAcao = { success: false, message: `Ação '${acao}' inválida para este veículo.` };
         }

        // Exibe notificação com base no resultado da ação
        if (resultadoAcao.message) {
            let notificationType = resultadoAcao.success ? 'info' : 'warning';
            // Ajusta o tipo de notificação para casos específicos
            if (resultadoAcao.success && ['ativarTurbo', 'carregar', 'descarregar'].includes(acao)) {
                notificationType = 'success';
            } else if (!resultadoAcao.success &&
                       !resultadoAcao.message.toLowerCase().includes('máxima') &&
                       !resultadoAcao.message.toLowerCase().includes('parado') &&
                       !resultadoAcao.message.toLowerCase().includes('já estava') &&
                       !resultadoAcao.message.toLowerCase().includes('primeiro') &&
                       !resultadoAcao.message.toLowerCase().includes('inválida')) {
                // Considera 'error' para falhas não esperadas/comuns
                notificationType = 'error';
            }
            showNotification(resultadoAcao.message, notificationType, 3500, ui);
        } else if (resultadoAcao.success && (acao === 'acelerar' || acao === 'frear')) {
            // Não mostra notificação para acelerar/frear bem-sucedido, o velocímetro já dá o feedback
        } else if (resultadoAcao.success) { // Outras ações bem-sucedidas sem mensagem específica
            showNotification(`${veiculo.modelo} ${acao} com sucesso.`, 'success', 2000, ui);
        }
    } catch (error) {
        console.error(`Erro ao executar ação '${acao}' em ${veiculo.modelo}:`, error);
        showNotification(`Ocorreu um erro inesperado ao executar a ação '${acao}'. Verifique o console.`, 'error', 5000, ui);
    } finally {
        if (precisaSalvar) {
            minhaGaragem.salvarNoLocalStorage();
        }
        atualizarPainelVeiculoSelecionado(); // Atualiza a UI para refletir o novo estado do veículo
    }
}
function adicionarNovoVeiculo(event) {
    event.preventDefault();
    if (!ui.novoVeiculoTipo || !ui.novoVeiculoModelo || !ui.novoVeiculoCor || !ui.novoVeiculoCapacidade || !ui.divCapacidadeCaminhao || !ui.modalAdicionar || !ui.formNovoVeiculo) {
        showNotification("Erro interno no formulário. Recarregue a página.", "error", 5000, ui); return;
    }
    const tipo = ui.novoVeiculoTipo.value;
    const modelo = ui.novoVeiculoModelo.value.trim();
    const cor = ui.novoVeiculoCor.value.trim();
    const capacidadeStr = ui.novoVeiculoCapacidade.value;
    let capacidadeCarga = 0;

    if (!tipo) { showNotification("Selecione o tipo de veículo.", 'warning', 3000, ui); ui.novoVeiculoTipo.focus(); return; }
    if (!modelo) { showNotification("Informe o modelo do veículo.", 'warning', 3000, ui); ui.novoVeiculoModelo.focus(); return; }
    if (!cor) { showNotification("Informe a cor do veículo.", 'warning', 3000, ui); ui.novoVeiculoCor.focus(); return; }

    let novoVeiculo = null;
    try {
        switch (tipo) {
            case 'Carro': novoVeiculo = new Carro(modelo, cor); break;
            case 'CarroEsportivo': novoVeiculo = new CarroEsportivo(modelo, cor); break;
            case 'Caminhao':
                 capacidadeCarga = parseInt(capacidadeStr, 10);
                 if (!capacidadeStr || isNaN(capacidadeCarga) || capacidadeCarga <= 0) {
                     showNotification("Para Caminhão, informe uma capacidade de carga válida (kg).", 'warning', 4000, ui);
                     ui.novoVeiculoCapacidade.focus(); return;
                 }
                novoVeiculo = new Caminhao(modelo, cor, capacidadeCarga); break;
            default: showNotification("Tipo de veículo selecionado é inválido.", 'error', 3000, ui); return;
        }
        if (!novoVeiculo) throw new Error("Falha na criação da instância do veículo.");
    } catch (error) {
        console.error("Erro ao criar novo veículo:", error);
        showNotification(`Erro ao criar veículo: ${error.message || 'Erro desconhecido'}`, 'error', 5000, ui); return;
    }

    const resultadoAdicao = minhaGaragem.adicionarVeiculo(novoVeiculo);
    if (resultadoAdicao.success) {
        minhaGaragem.salvarNoLocalStorage();
        showNotification(`${novoVeiculo.modelo} adicionado com sucesso!`, 'success', 3000, ui);
        ui.formNovoVeiculo.reset();
        ui.divCapacidadeCaminhao.style.display = 'none'; // Esconde campo de capacidade
        if(ui.modalAdicionar.open) ui.modalAdicionar.close();

        // Seleciona o novo veículo e atualiza a interface
        if(minhaGaragem.selecionarVeiculo(novoVeiculo.id)) {
            ativarTab('tab-visao-geral'); // Garante que a aba correta está ativa
        }
        atualizarInterfaceCompleta();
    } else {
         showNotification(resultadoAdicao.message || `Não foi possível adicionar ${modelo}.`, 'warning', 4000, ui);
         ui.novoVeiculoModelo.focus(); // Foca no campo modelo se houver erro, por exemplo
    }
}
function agendarOuRegistrarManutencao(event) {
    event.preventDefault();
    const veiculo = minhaGaragem.getVeiculoSelecionado();
    if (!veiculo) { showNotification("Selecione um veículo antes!", 'warning', 3000, ui); return; }
    if (!ui.manutencaoDataHora || !ui.manutencaoTipo || !ui.manutencaoCusto || !ui.manutencaoDescricao || !ui.formManutencao) {
        showNotification("Erro interno no formulário de manutenção.", "error", 5000, ui); return;
    }
    const dataHora = ui.manutencaoDataHora.value;
    const tipo = ui.manutencaoTipo.value.trim();
    const custoStr = ui.manutencaoCusto.value;
    const descricao = ui.manutencaoDescricao.value.trim();

    if (!dataHora) { showNotification("Selecione data e hora.", 'warning', 3000, ui); ui.manutencaoDataHora.focus(); return; }
    if (!tipo) { showNotification("Informe o tipo de serviço.", 'warning', 3000, ui); ui.manutencaoTipo.focus(); return; }

    let novaManutencao;
    try {
        novaManutencao = new Manutencao(dataHora, tipo, custoStr, descricao);
    } catch (error) {
        showNotification("Erro ao processar dados da manutenção. Verifique data/hora.", 'error', 4000, ui); return;
    }

    const resultadoAddManut = veiculo.adicionarManutencao(novaManutencao);
    if (resultadoAddManut.success) {
        minhaGaragem.salvarNoLocalStorage();
        ui.formManutencao.reset();
        atualizarPainelVeiculoSelecionado(); // Atualiza listas de manutenção
        showNotification("Registro de manutenção salvo!", 'success', 3000, ui);
    } else {
        showNotification(resultadoAddManut.message || "Não foi possível salvar o registro de manutenção.", 'error', 4000, ui);
        // Foca no campo problemático se a mensagem indicar
        if (resultadoAddManut.message?.toLowerCase().includes("data")) ui.manutencaoDataHora.focus();
        else if (resultadoAddManut.message?.toLowerCase().includes("tipo")) ui.manutencaoTipo.focus();
    }
}
function lidarComCliqueListaManutencao(event) {
    const removeButton = event.target.closest('.botao-remover-item');
    if (!removeButton) return;
    const liElement = removeButton.closest('li[data-item-id]');
    if (!liElement || !liElement.dataset.itemId) return;
    removerManutencaoItem(liElement.dataset.itemId);
}
function removerManutencaoItem(idManutencao) {
     const veiculo = minhaGaragem.getVeiculoSelecionado();
     if (!veiculo) return; // Nenhuma ação se nenhum veículo estiver selecionado

     const itemParaRemover = veiculo.historicoManutencao.find(m => m.id === idManutencao);
     const msgConfirm = itemParaRemover
        ? `Tem certeza que deseja remover o seguinte registro/agendamento?\n\n"${itemParaRemover.retornarFormatada(true)}"`
        : "Tem certeza que deseja remover este item de manutenção?";

     if (confirm(msgConfirm)) {
         if (veiculo.removerManutencao(idManutencao)) {
             minhaGaragem.salvarNoLocalStorage();
             atualizarPainelVeiculoSelecionado(); // Re-renderiza as listas de manutenção
             showNotification("Item de manutenção removido.", 'success', 2000, ui);
         } else {
             showNotification("Não foi possível remover o item de manutenção.", 'error', 3000, ui);
         }
     }
}
function removerVeiculoSelecionado() {
    const veiculo = minhaGaragem.getVeiculoSelecionado();
    if (!veiculo) { showNotification("Nenhum veículo selecionado para remover.", 'warning', 3000, ui); return; }

    if (confirm(`ATENÇÃO!\n\nTem certeza que deseja remover o veículo ${veiculo.modelo} (${veiculo.cor}) da garagem?\n\nEsta ação NÃO pode ser desfeita.`)) {
         if (minhaGaragem.removerVeiculo(veiculo.id)) {
              minhaGaragem.salvarNoLocalStorage();
              showNotification(`${veiculo.modelo} removido com sucesso.`, 'success', 3000, ui);
              atualizarInterfaceCompleta(); // Atualiza a lista e o painel (que deve mostrar a mensagem de "selecione")
         } else {
              showNotification(`Falha ao remover ${veiculo.modelo}.`, 'error', 3000, ui);
         }
    }
}

// --- Funções da API Simulada (Veículos) ---
// ... (buscarDetalhesVeiculoAPI, lidarCliqueDetalhesExtras - SEM ALTERAÇÕES DIRETAS AQUI) ...
async function buscarDetalhesVeiculoAPI(identificadorVeiculo) {
    const urlAPI = './dados_veiculos_api.json'; // Relativo ao index.html
    try {
        const response = await fetch(urlAPI, { cache: "no-cache" }); // Evita cache para teste
        if (!response.ok) {
            const erroMsg = `Falha ao buscar detalhes da API (Erro ${response.status}: ${response.statusText}). Verifique o arquivo '${urlAPI}'.`;
            return { erro: true, mensagem: erroMsg };
        }
        const dadosTodosVeiculos = await response.json();
        if (!Array.isArray(dadosTodosVeiculos)) {
            return { erro: true, mensagem: "Formato de dados inválido no arquivo JSON da API." };
        }
        const detalhes = dadosTodosVeiculos.find(v => v && v.id === identificadorVeiculo);
        return detalhes ? detalhes : null; // Retorna null se não encontrar, para ser tratado na UI
    } catch (error) {
        let mensagemErro = "Erro ao conectar ou processar dados da API de veículos.";
        if (error instanceof SyntaxError) {
            mensagemErro = "Erro de formato no arquivo JSON da API de veículos.";
        } else if (error instanceof TypeError && error.message.includes('fetch')) {
            mensagemErro = "Erro de rede ao tentar acessar a API de veículos.";
        } else if (error.message) {
            mensagemErro = error.message;
        }
        console.error("Erro em buscarDetalhesVeiculoAPI:", error);
        return { erro: true, mensagem: mensagemErro };
    }
}
async function lidarCliqueDetalhesExtras() {
    const veiculo = minhaGaragem.getVeiculoSelecionado();
    if (!veiculo || !veiculo.id) { showNotification("Selecione um veículo primeiro.", "warning", 3000, ui); return; }
    if (!ui.detalhesExtrasVeiculoDiv || !ui.btnVerDetalhesExtras) {
        showNotification("Erro interno na interface de detalhes extras.", "error", 4000, ui); return;
    }

    ui.detalhesExtrasVeiculoDiv.innerHTML = `<p class="loading-feedback"><i class="fas fa-spinner fa-spin"></i> Carregando detalhes extras...</p>`;
    ui.detalhesExtrasVeiculoDiv.style.display = 'block';
    ui.btnVerDetalhesExtras.disabled = true;

    const detalhes = await buscarDetalhesVeiculoAPI(veiculo.id);

    if(ui.btnVerDetalhesExtras) ui.btnVerDetalhesExtras.disabled = false; // Reabilita o botão

    if (detalhes && detalhes.erro) {
        ui.detalhesExtrasVeiculoDiv.innerHTML = `<p class="error-feedback"><i class="fas fa-exclamation-triangle"></i> Erro: ${detalhes.mensagem}</p>`;
    } else if (detalhes) { // Detalhes encontrados e sem erro
        let recallStatus = detalhes.recallPendente
            ? `<span class="recall-pendente">Sim${detalhes.recallDescricao ? ` (${detalhes.recallDescricao})` : ''}</span>`
            : `<span class="recall-ok">Não</span>`;

        let dataRevisaoFormatada = 'N/A';
        if (detalhes.ultimaRevisaoAPI) {
            try {
                // Adiciona 'T00:00:00Z' para tratar a data como UTC e evitar problemas de fuso horário na conversão
                const dataObj = new Date(detalhes.ultimaRevisaoAPI + 'T00:00:00Z');
                if (!isNaN(dataObj)) {
                    dataRevisaoFormatada = dataObj.toLocaleDateString('pt-BR', {
                        year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' // Exibe na data correta, independente do fuso do usuário
                    });
                } else {
                    throw new Error("Data da API inválida após parse.");
                }
            } catch (e) {
                dataRevisaoFormatada = 'Data Inválida';
                console.warn("Erro ao formatar data da última revisão da API:", e, "Valor original:", detalhes.ultimaRevisaoAPI);
            }
        }

        ui.detalhesExtrasVeiculoDiv.innerHTML = `
            <p><i class="fas fa-dollar-sign"></i> <strong>Valor FIPE:</strong> ${detalhes.valorFipe ? detalhes.valorFipe.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A'}</p>
            <p><i class="fas fa-calendar-alt"></i> <strong>Última Revisão (API):</strong> ${dataRevisaoFormatada}</p>
            <p><i class="fas fa-exclamation-circle"></i> <strong>Recall Pendente:</strong> ${recallStatus}</p>
            <p><i class="fas fa-lightbulb"></i> <strong>Dica:</strong> ${detalhes.dicaManutencao || 'N/A'}</p>
            <p><i class="fas fa-star"></i> <strong>Curiosidade:</strong> ${detalhes.fatoCurioso || '-'}</p>
        `;
    } else { // Nenhum detalhe encontrado para o ID (detalhes === null)
        ui.detalhesExtrasVeiculoDiv.innerHTML = `<p class="notfound-feedback"><i class="fas fa-search"></i> Nenhum detalhe extra encontrado para o veículo ${veiculo.modelo} (ID: ${veiculo.id}) na API simulada.</p>`;
    }
}

// --- Funções da API de Previsão do Tempo (OpenWeatherMap) ---
async function buscarPrevisaoDetalhadaTempo(cidade) {
    if (!WEATHER_API_KEY || WEATHER_API_KEY === "SEU_PLACEHOLDER_AQUI" || WEATHER_API_KEY === "569ee28c1908ad6eaadb431e635166be") { // Adicionada a chave específica do usuário
        console.error("Chave da API de Tempo não configurada ou é o placeholder.");
        throw new Error("Chave da API de Tempo não configurada corretamente. Verifique js/principal.js.");
    }
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidade)}&appid=${WEATHER_API_KEY}&units=metric&lang=pt_br`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Erro ao buscar dados da previsão." }));
            console.error("Erro da API de Tempo:", errorData);
            let userMessage = `Erro ${response.status} ao buscar previsão.`;
            if (response.status === 401) userMessage = "Chave da API inválida ou não autorizada.";
            else if (response.status === 404) userMessage = `Cidade "${cidade}" não encontrada. Verifique o nome e tente novamente.`;
            else if (errorData.message) userMessage = errorData.message;
            throw new Error(userMessage);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Falha ao buscar previsão detalhada do tempo:", error);
        throw error; // Re-lança o erro para ser tratado por handleVerificarClima
    }
}
function processarDadosForecastTempo(dataApi) {
    if (!dataApi || !dataApi.list || !Array.isArray(dataApi.list) || dataApi.list.length === 0) {
        console.error("Dados da API de tempo inválidos ou lista de previsões vazia.", dataApi);
        return null;
    }
    const diasAgrupados = {};
    dataApi.list.forEach(item => {
        const dataDia = item.dt_txt.split(' ')[0]; // Pega 'YYYY-MM-DD'
        if (!diasAgrupados[dataDia]) {
            diasAgrupados[dataDia] = {
                temps: [],
                descricoes: [],
                icones: [],
                // Poderíamos adicionar mais dados aqui se quiséssemos expandir detalhes,
                // como umidade, vento, etc., para cada `item`.
            };
        }
        diasAgrupados[dataDia].temps.push(item.main.temp);
        diasAgrupados[dataDia].descricoes.push(item.weather[0].description);
        diasAgrupados[dataDia].icones.push(item.weather[0].icon);
    });

    const previsaoDiariaProcessada = [];
    for (const dataDia in diasAgrupados) {
        const diaInfo = diasAgrupados[dataDia];
        const temp_min = Math.min(...diaInfo.temps);
        const temp_max = Math.max(...diaInfo.temps);

        // Lógica simples para escolher descrição/ícone representativo (pode ser melhorada)
        // Por exemplo, pegar o do meio-dia ou o mais frequente.
        // Aqui, estamos pegando o primeiro encontrado para o dia.
        const descricaoRep = diaInfo.descricoes[0];
        const iconeRep = diaInfo.icones[0];

        previsaoDiariaProcessada.push({
            data: formatarDataParaExibicaoTempo(dataDia),
            temp_min: temp_min.toFixed(1),
            temp_max: temp_max.toFixed(1),
            descricao: capitalizarPrimeiraLetraTempo(descricaoRep),
            icone: iconeRep
        });
    }
    return previsaoDiariaProcessada; // Retorna todos os dias processados (até 5, devido à API)
}
function exibirPrevisaoDetalhadaTempo(previsaoDiariaParaExibir, nomeCidade) { // Alterado nome do parâmetro
    if (!ui.previsaoResultadoDivTempo) return;
    ui.previsaoResultadoDivTempo.innerHTML = ''; // Limpa resultados anteriores

    if (!previsaoDiariaParaExibir || previsaoDiariaParaExibir.length === 0) {
        // Não exibe nada se não houver previsão (a mensagem de erro/status já deve ter sido tratada)
        return;
    }

    const tituloH3 = document.createElement('h3');
    tituloH3.textContent = `Previsão para ${capitalizarPrimeiraLetraTempo(nomeCidade)}`;
    ui.previsaoResultadoDivTempo.appendChild(tituloH3);

    const gridContainer = document.createElement('div');
    gridContainer.className = 'previsao-dias-grid';

    previsaoDiariaParaExibir.forEach(dia => {
        const diaDiv = document.createElement('div');
        diaDiv.className = 'dia-previsao';

        const dataH4 = document.createElement('h4');
        dataH4.className = 'data-dia';
        const iconeImg = document.createElement('img');
        iconeImg.className = 'icone-tempo';
        iconeImg.src = `https://openweathermap.org/img/wn/${dia.icone}@2x.png`;
        iconeImg.alt = dia.descricao;
        dataH4.appendChild(iconeImg);
        dataH4.appendChild(document.createTextNode(dia.data));

        const tempMinP = document.createElement('p');
        tempMinP.innerHTML = `Mín: <strong>${dia.temp_min}°C</strong>`;
        const tempMaxP = document.createElement('p');
        tempMaxP.innerHTML = `Máx: <strong>${dia.temp_max}°C</strong>`;
        const descricaoP = document.createElement('p');
        descricaoP.textContent = dia.descricao;

        diaDiv.appendChild(dataH4);
        diaDiv.appendChild(tempMinP);
        diaDiv.appendChild(tempMaxP);
        diaDiv.appendChild(descricaoP);
        gridContainer.appendChild(diaDiv);
    });
    ui.previsaoResultadoDivTempo.appendChild(gridContainer);
}
function formatarDataParaExibicaoTempo(dataString) { // dataString é YYYY-MM-DD
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
}
function capitalizarPrimeiraLetraTempo(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}
function exibirStatusTempo(mensagem, tipo = 'info') {
    if (!ui.statusMensagemTempoDiv) return;
    ui.statusMensagemTempoDiv.textContent = mensagem;
    ui.statusMensagemTempoDiv.className = 'status-mensagem'; // Reseta classes
    if (tipo) {
        ui.statusMensagemTempoDiv.classList.add(tipo); // Adiciona a classe do tipo (info, error, loading)
    }
    ui.statusMensagemTempoDiv.style.backgroundColor = ''; // Deixa o CSS controlar a cor de fundo
}
async function handleVerificarClima() {
    if (!ui.cidadeInputTempo) return;
    const cidade = ui.cidadeInputTempo.value.trim();

    if (!cidade) {
        exibirStatusTempo("Por favor, digite o nome de uma cidade.", 'error');
        previsaoCompletaApiCache = []; // Limpa cache se a busca for vazia
        cidadeAtualPrevisaoCache = "";
        if (ui.previsaoResultadoDivTempo) ui.previsaoResultadoDivTempo.innerHTML = ''; // Limpa resultados
        return;
    }
    if (WEATHER_API_KEY === "SEU_PLACEHOLDER_AQUI" || WEATHER_API_KEY === "569ee28c1908ad6eaadb431e635166be") {
         exibirStatusTempo("AVISO: A chave da API de Previsão do Tempo não foi configurada. Verifique o arquivo js/principal.js.", 'error');
         if(ui.verificarClimaBtn) ui.verificarClimaBtn.disabled = true;
         return;
    }
    if(ui.verificarClimaBtn) ui.verificarClimaBtn.disabled = false;

    exibirStatusTempo("Carregando previsão...", 'loading');
    if (ui.previsaoResultadoDivTempo) ui.previsaoResultadoDivTempo.innerHTML = ''; // Limpa resultados anteriores

    try {
        const dadosApi = await buscarPrevisaoDetalhadaTempo(cidade);
        if (dadosApi) {
            previsaoCompletaApiCache = processarDadosForecastTempo(dadosApi); // Armazena no cache
            cidadeAtualPrevisaoCache = dadosApi.city.name; // Armazena nome da cidade do cache

            if (previsaoCompletaApiCache && previsaoCompletaApiCache.length > 0) {
                // Exibe a previsão com o filtro de dias atual
                const previsaoFiltrada = previsaoCompletaApiCache.slice(0, diasFiltroPrevisao);
                exibirPrevisaoDetalhadaTempo(previsaoFiltrada, cidadeAtualPrevisaoCache);
                exibirStatusTempo(""); // Limpa mensagem de status em caso de sucesso
            } else {
                exibirStatusTempo(`Não foi possível processar a previsão para ${capitalizarPrimeiraLetraTempo(cidade)}.`, 'error');
            }
        }
    } catch (error) {
        console.error("Erro no fluxo principal da previsão do tempo:", error);
        exibirStatusTempo(error.message || "Ocorreu um erro ao buscar a previsão. Tente novamente.", 'error');
        previsaoCompletaApiCache = []; // Limpa cache em caso de erro
        cidadeAtualPrevisaoCache = "";
    }
}
// NOVA FUNÇÃO PARA LIDAR COM O CLIQUE NOS BOTÕES DE FILTRO DE DIAS
function handleFiltroDiasClick(event) {
    const botaoClicado = event.target.closest('.filtro-dia-btn');
    if (!botaoClicado) return;

    diasFiltroPrevisao = parseInt(botaoClicado.dataset.dias, 10);

    // Atualiza a classe 'active' nos botões
    ui.filtroDiasBotoes.forEach(btn => btn.classList.remove('active'));
    botaoClicado.classList.add('active');

    // Reexibe a previsão com o novo filtro, usando dados do cache se disponíveis
    if (previsaoCompletaApiCache.length > 0 && cidadeAtualPrevisaoCache) {
        const previsaoFiltrada = previsaoCompletaApiCache.slice(0, diasFiltroPrevisao);
        exibirPrevisaoDetalhadaTempo(previsaoFiltrada, cidadeAtualPrevisaoCache);
        exibirStatusTempo(""); // Limpa qualquer mensagem de status anterior
    } else {
        // Se não houver cache (ex: primeira carga ou erro anterior),
        // pode-se optar por não fazer nada ou exibir uma mensagem
        // A busca por uma nova cidade via `handleVerificarClima` preencherá o cache.
        if (ui.cidadeInputTempo.value.trim()) { // Só mostra mensagem se já houver uma cidade no input
            exibirStatusTempo("Busque uma cidade para ver a previsão.", "info");
        }
        if (ui.previsaoResultadoDivTempo) ui.previsaoResultadoDivTempo.innerHTML = ''; // Limpa se não há o que filtrar
    }
}


// --- Inicialização da Aplicação ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Carregado. Iniciando Garagem Virtual V3 & Previsão do Tempo...");

    try {
        // ... (inicialização da garagem - SEM ALTERAÇÕES DIRETAS AQUI) ...
        const pathElement = document.querySelector('.velocimetro-progresso');
        if (pathElement && typeof pathElement.getTotalLength === 'function') {
            try {
                velocimetroPathLength = pathElement.getTotalLength();
                document.documentElement.style.setProperty('--velocimetro-path-length', velocimetroPathLength);
            } catch (e) {
                 console.warn("Não foi possível calcular getTotalLength do velocímetro, usando valor padrão.", e);
                 document.documentElement.style.setProperty('--velocimetro-path-length', 251.2); // Fallback
            }
        } else {
            document.documentElement.style.setProperty('--velocimetro-path-length', 251.2); // Fallback
        }

        const veiculosSalvos = Garagem.carregarDoLocalStorage();
        minhaGaragem.veiculos = veiculosSalvos;
        const idSelecionadoSalvo = localStorage.getItem('garagemVeiculoSelecionadoId');
        if (idSelecionadoSalvo && minhaGaragem.encontrarVeiculo(idSelecionadoSalvo)) {
            minhaGaragem.selecionarVeiculo(idSelecionadoSalvo);
        } else {
             minhaGaragem.selecionarVeiculo(null);
             if(idSelecionadoSalvo) localStorage.removeItem('garagemVeiculoSelecionadoId');
        }

        // Event Listeners da Garagem
        if (ui.btnAbrirModalAdicionar && ui.modalAdicionar) {
            ui.btnAbrirModalAdicionar.addEventListener('click', () => {
                if(ui.formNovoVeiculo) ui.formNovoVeiculo.reset();
                if(ui.divCapacidadeCaminhao) ui.divCapacidadeCaminhao.style.display = 'none';
                if(ui.novoVeiculoTipo) ui.novoVeiculoTipo.value = "";
                if (!ui.modalAdicionar.open) {
                    try { ui.modalAdicionar.showModal(); } catch (e) { console.error("Erro ao abrir modal:", e); }
                }
            });
        }
        if (ui.btnFecharModalAdicionar && ui.modalAdicionar) {
            ui.btnFecharModalAdicionar.addEventListener('click', () => { if (ui.modalAdicionar.open) ui.modalAdicionar.close(); });
        }
        if (ui.modalAdicionar) {
            ui.modalAdicionar.addEventListener('click', (event) => {
                if (event.target === ui.modalAdicionar && ui.modalAdicionar.open) {
                    ui.modalAdicionar.close();
                }
            });
        }
        if (ui.formNovoVeiculo) ui.formNovoVeiculo.addEventListener('submit', adicionarNovoVeiculo);
        if (ui.novoVeiculoTipo && ui.divCapacidadeCaminhao) {
            ui.novoVeiculoTipo.addEventListener('change', (event) => {
                ui.divCapacidadeCaminhao.style.display = (event.target.value === 'Caminhao') ? 'block' : 'none';
            });
        }
        if (ui.formManutencao) ui.formManutencao.addEventListener('submit', agendarOuRegistrarManutencao);
        if (ui.tabLinks && ui.tabLinks.length > 0) {
            ui.tabLinks.forEach(button => {
                button.addEventListener('click', () => ativarTab(button.dataset.tab));
            });
        }
        if (ui.botoesAcoesContainer) ui.botoesAcoesContainer.addEventListener('click', lidarComAcaoVeiculo);
        if(ui.botaoRemoverVeiculoHeader) ui.botaoRemoverVeiculoHeader.addEventListener('click', removerVeiculoSelecionado);

        const setupMaintenanceListListener = (ulElement) => {
             if (ulElement) ulElement.addEventListener('click', lidarComCliqueListaManutencao);
        };
        setupMaintenanceListListener(ui.historicoUl);
        setupMaintenanceListListener(ui.agendamentosUl);

        if (ui.notificationCloseBtn) ui.notificationCloseBtn.addEventListener('click', () => hideNotification(ui));
        if (ui.btnVerDetalhesExtras) ui.btnVerDetalhesExtras.addEventListener('click', lidarCliqueDetalhesExtras);


        // Inicialização e Event Listeners da Previsão do Tempo
        if (ui.verificarClimaBtn) {
            ui.verificarClimaBtn.addEventListener('click', handleVerificarClima);
            // Verifica a chave da API inicialmente
            if (WEATHER_API_KEY === "SEU_PLACEHOLDER_AQUI" || WEATHER_API_KEY === "569ee28c1908ad6eaadb431e635166be") {
                exibirStatusTempo("AVISO: A chave da API de Previsão do Tempo não foi configurada. Verifique o arquivo js/principal.js.", 'warning');
                ui.verificarClimaBtn.disabled = true;
            }
        }
        if (ui.cidadeInputTempo) {
            ui.cidadeInputTempo.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    handleVerificarClima();
                }
            });
        }
        // ADICIONA EVENT LISTENER PARA OS BOTÕES DE FILTRO DE DIAS
        if (ui.filtroDiasBotoes) {
            ui.filtroDiasBotoes.forEach(botao => {
                botao.addEventListener('click', handleFiltroDiasClick);
            });
        }

        // Renderização Inicial
        ativarTab('tab-visao-geral');
        atualizarInterfaceCompleta();

        // Verificação de Agendamentos
        setTimeout(() => {
            try {
                const mensagensAgendamento = minhaGaragem.verificarAgendamentosProximos();
                if (mensagensAgendamento && mensagensAgendamento.length > 0) {
                    mensagensAgendamento.forEach((msg, index) => {
                        // Mostra notificações com um pequeno atraso entre elas
                        setTimeout(() => showNotification(msg, 'info', 8000 + index * 500, ui), index * 700);
                    });
                }
            } catch(error) {
                console.error("[Init] Erro ao verificar agendamentos próximos:", error);
            }
        }, 1500); // Atraso para não sobrecarregar a UI inicial

        console.log("✅ Garagem Virtual & Previsão do Tempo inicializados!");

    } catch (error) {
        console.error("❌===== ERRO CRÍTICO NA INICIALIZAÇÃO DA APLICAÇÃO =====", error);
        try {
            document.body.innerHTML = `<div style="padding: 20px; margin: 20px; background-color: #ffdddd; border: 2px solid red; color: #a02533; text-align: center; font-family: sans-serif;">
                                    <h1>Erro na Aplicação</h1>
                                    <p>Não foi possível carregar corretamente.</p>
                                    <p><strong>Detalhes do Erro:</strong> ${error.message}</p>
                                    <p><em>Verifique o console do navegador (F12).</em></p>
                                  </div>`;
        } catch(e) { /* Se nem isso funcionar, o alert é o último recurso */ }
        alert("Ocorreu um erro grave ao iniciar a aplicação. Verifique o console (F12).");
    }
});