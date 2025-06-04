
// java/principal.js
'use strict';

// --- Importações ---
import Garagem from './models/garagem.js';
import Manutencao from './models/Manutencao.js';
import Carro from './models/Carro.js';
import CarroEsportivo from './models/CarroEsportivo.js';
import Caminhao from './models/Caminhao.js';
import { showNotification, hideNotification } from './utils/notifications.js';

// --- Referências aos Elementos da UI (Garagem) ---
const ui = {
    // ... (suas referências UI permanecem as mesmas) ...
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
    filtroDiasBotoes: document.querySelectorAll('.filtro-dia-btn'),
};

// --- Instância Principal da Aplicação (Garagem) ---
const minhaGaragem = new Garagem();

// --- Variáveis Globais ---
let velocimetroPathLength = 251.2;

// const WEATHER_API_KEY = "SUA_CHAVE_API_AQUI"; // REMOVIDO: A chave agora está no backend!
// console.log("DEBUG: Chave API Configurada (no escopo global de principal.js):", WEATHER_API_KEY); // REMOVIDO

// NOVAS VARIÁVEIS GLOBAIS PARA FILTRO DE PREVISÃO
let diasFiltroPrevisao = 5;
let previsaoCompletaApiCache = [];
let cidadeAtualPrevisaoCache = "";

// --- Funções de Atualização da Interface Gráfica (UI) - GARAGEM ---
// ... (suas funções de UI da garagem permanecem as mesmas) ...
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
    const veiculosParaExibir = [...minhaGaragem.veiculos];
    veiculosParaExibir.sort((a,b) => a.modelo.localeCompare(b.modelo));
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
                    ativarTab('tab-visao-geral');
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
    if (!ui.velocimetroProgressoPath && ui.painelVeiculoSelecionado && ui.painelVeiculoSelecionado.style.display !== 'none') {
        ui.velocimetroProgressoPath = ui.painelVeiculoSelecionado.querySelector('.velocimetro-progresso');
        if (!ui.velocimetroProgressoPath) {
             if(ui.barraProgressoContainer) ui.barraProgressoContainer.style.display = 'none';
             console.warn("Elemento .velocimetro-progresso não encontrado no painel do veículo.");
             return;
        }
    }

    if (!ui.barraProgressoContainer || ui.barraProgressoContainer.style.display === 'none' || !ui.velocimetroProgressoPath) {
        if (ui.velocidadeAtual) ui.velocidadeAtual.textContent = '0 km/h';
        if (ui.velocimetroProgressoPath) ui.velocimetroProgressoPath.style.strokeDashoffset = velocimetroPathLength;
        return;
    }

    if (!ui.velocidadeAtual) return;

    const maxVel = Math.max(1, velocidadeMaxima);
    const velocidadeAtualDisplay = Math.max(0, Math.min(velocidade, maxVel));
    const porcentagem = velocidadeAtualDisplay / maxVel;
    const offset = velocimetroPathLength * (1 - porcentagem);

    try {
        ui.velocimetroProgressoPath.style.strokeDashoffset = offset;
        ui.velocidadeAtual.textContent = `${Math.round(velocidadeAtualDisplay)} km/h`;

        let corProgresso = 'var(--cor-primaria)';
        if (porcentagem > 0.85) corProgresso = 'var(--cor-perigo)';
        else if (porcentagem > 0.6) corProgresso = 'var(--cor-aviso)';
        ui.velocimetroProgressoPath.style.stroke = corProgresso;
    } catch (e) {
        if(ui.barraProgressoContainer) ui.barraProgressoContainer.style.display = 'none';
        console.error("Erro ao atualizar o velocímetro:", e);
    }
}
function renderizarListaManutencao(ulElement, itens) {
     if (!ulElement) {
        console.warn("Elemento <ul> para lista de manutenção não fornecido.");
        return;
     }
     ulElement.innerHTML = '';
     if (!itens || itens.length === 0) {
          const tipoListaTexto = ulElement.closest('.maintenance-list')?.id === 'historicoManutencao'
            ? 'histórico'
            : 'agendamentos';
          ulElement.innerHTML = `<li class="placeholder">Nenhum registro de ${tipoListaTexto} encontrado.</li>`;
          return;
     }
     itens.forEach(item => {
         const li = document.createElement('li');
         li.dataset.itemId = item.id;

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

    if (ui.detalhesExtrasVeiculoDiv) {
        ui.detalhesExtrasVeiculoDiv.innerHTML = '';
        ui.detalhesExtrasVeiculoDiv.style.display = 'none';
    }
    if (ui.btnVerDetalhesExtras) {
        ui.btnVerDetalhesExtras.style.display = 'none';
        ui.btnVerDetalhesExtras.disabled = false;
    }

    if (veiculo) {
        if (ui.painelVeiculoSelecionado) ui.painelVeiculoSelecionado.style.display = 'block';
        if (ui.mensagemSelecione) ui.mensagemSelecione.style.display = 'none';

        const baseInfo = veiculo.exibirInformacoesBase();
        if(ui.infoModeloTipo) ui.infoModeloTipo.textContent = `${baseInfo.modelo} (${veiculo.constructor.name})`;
        if(ui.infoCor) ui.infoCor.textContent = baseInfo.cor;
        if(ui.infoId) ui.infoId.textContent = baseInfo.id;
        if(ui.botaoRemoverVeiculoHeader) ui.botaoRemoverVeiculoHeader.style.display = 'inline-flex';

        let imagemSrc = 'imagens/carro_normal.png';
        if (veiculo instanceof CarroEsportivo) imagemSrc = 'imagens/carro_esportivo.png';
        else if (veiculo instanceof Caminhao) imagemSrc = 'imagens/caminhao.png';
        if (ui.imagemVeiculo) {
            ui.imagemVeiculo.src = imagemSrc;
            ui.imagemVeiculo.alt = `Imagem de ${veiculo.modelo}`;
        }

        if (ui.btnVerDetalhesExtras) ui.btnVerDetalhesExtras.style.display = 'inline-flex';

        if(ui.infoEspecifica) ui.infoEspecifica.innerHTML = '';
        if(ui.barraProgressoContainer) ui.barraProgressoContainer.style.display = 'none';
        if(ui.infoStatusMotorContainer) ui.infoStatusMotorContainer.style.display = 'none';
        if(ui.botoesAcoesContainer) ui.botoesAcoesContainer.querySelectorAll('button').forEach(btn => btn.style.display = 'none');

        if (veiculo instanceof Carro) {
            const dadosCarro = veiculo.getDadosEspecificos();

            if (ui.infoStatusMotorContainer && ui.infoStatusMotor) {
                ui.infoStatusMotorContainer.style.display = 'block';
                ui.infoStatusMotor.innerHTML = dadosCarro.ligado
                    ? "<i class='fas fa-circle status-on'></i> Ligado"
                    : "<i class='fas fa-circle status-off'></i> Desligado";
            }

            if (ui.velocimetroProgressoPath && ui.barraProgressoContainer) {
                 ui.barraProgressoContainer.style.display = 'flex';
                 atualizarVelocimetro(dadosCarro.velocidade, dadosCarro.velocidadeMaxima);
            } else if (ui.barraProgressoContainer) {
                 ui.barraProgressoContainer.style.display = 'none';
            }

            const btnLigar = ui.botoesAcoesContainer?.querySelector('[data-action="ligar"]');
            const btnDesligar = ui.botoesAcoesContainer?.querySelector('[data-action="desligar"]');
            const btnAcelerar = ui.botoesAcoesContainer?.querySelector('[data-action="acelerar"]');
            const btnFrear = ui.botoesAcoesContainer?.querySelector('[data-action="frear"]');

            if(btnLigar) { btnLigar.style.display = 'inline-flex'; btnLigar.disabled = dadosCarro.ligado; }
            if(btnDesligar) { btnDesligar.style.display = 'inline-flex'; btnDesligar.disabled = !dadosCarro.ligado; }
            if(btnAcelerar) { btnAcelerar.style.display = 'inline-flex'; btnAcelerar.disabled = !dadosCarro.ligado || dadosCarro.velocidade >= dadosCarro.velocidadeMaxima; }
            if(btnFrear) { btnFrear.style.display = 'inline-flex'; btnFrear.disabled = !dadosCarro.ligado || dadosCarro.velocidade === 0; }

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
            } else {
                 if(ui.infoEspecifica) ui.infoEspecifica.innerHTML = '<p><i>Este é um carro padrão.</i></p>';
            }
        } else {
             if(ui.infoEspecifica) ui.infoEspecifica.innerHTML = '<p><i>Controles de condução não disponíveis para este tipo de veículo.</i></p>';
             atualizarVelocimetro(0, 1);
        }
        renderizarListaManutencao(ui.historicoUl, veiculo.getHistoricoPassadoFormatado());
        renderizarListaManutencao(ui.agendamentosUl, veiculo.getAgendamentosFuturosFormatados());
    } else {
        if(ui.painelVeiculoSelecionado) ui.painelVeiculoSelecionado.style.display = 'none';
        if(ui.mensagemSelecione) ui.mensagemSelecione.style.display = 'block';
        ui.velocimetroProgressoPath = null;
        atualizarVelocimetro(0, 1);
    }
}
function atualizarInterfaceCompleta() {
    atualizarListaVeiculosSidebar();
    atualizarPainelVeiculoSelecionado();
}

// --- Funções de Interação e Gerenciamento (Garagem) ---
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
             resultadoAcao = veiculo[acao]();
             if (resultadoAcao === undefined || resultadoAcao === null) {
                resultadoAcao = { success: true };
             }
             precisaSalvar = resultadoAcao.success;
         } else {
              resultadoAcao = { success: false, message: `Ação '${acao}' inválida para este veículo.` };
         }

        if (resultadoAcao.message) {
            let notificationType = resultadoAcao.success ? 'info' : 'warning';
            if (resultadoAcao.success && ['ativarTurbo', 'carregar', 'descarregar'].includes(acao)) {
                notificationType = 'success';
            } else if (!resultadoAcao.success &&
                       !resultadoAcao.message.toLowerCase().includes('máxima') &&
                       !resultadoAcao.message.toLowerCase().includes('parado') &&
                       !resultadoAcao.message.toLowerCase().includes('já estava') &&
                       !resultadoAcao.message.toLowerCase().includes('primeiro') &&
                       !resultadoAcao.message.toLowerCase().includes('inválida')) {
                notificationType = 'error';
            }
            showNotification(resultadoAcao.message, notificationType, 3500, ui);
        } else if (resultadoAcao.success && (acao === 'acelerar' || acao === 'frear')) {
            // No notification
        } else if (resultadoAcao.success) {
            showNotification(`${veiculo.modelo} ${acao} com sucesso.`, 'success', 2000, ui);
        }
    } catch (error) {
        console.error(`Erro ao executar ação '${acao}' em ${veiculo.modelo}:`, error);
        showNotification(`Ocorreu um erro inesperado ao executar a ação '${acao}'. Verifique o console.`, 'error', 5000, ui);
    } finally {
        if (precisaSalvar) {
            minhaGaragem.salvarNoLocalStorage();
        }
        atualizarPainelVeiculoSelecionado();
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
        ui.divCapacidadeCaminhao.style.display = 'none';
        if(ui.modalAdicionar.open) ui.modalAdicionar.close();

        if(minhaGaragem.selecionarVeiculo(novoVeiculo.id)) {
            ativarTab('tab-visao-geral');
        }
        atualizarInterfaceCompleta();
    } else {
         showNotification(resultadoAdicao.message || `Não foi possível adicionar ${modelo}.`, 'warning', 4000, ui);
         ui.novoVeiculoModelo.focus();
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
        atualizarPainelVeiculoSelecionado();
        showNotification("Registro de manutenção salvo!", 'success', 3000, ui);
    } else {
        showNotification(resultadoAddManut.message || "Não foi possível salvar o registro de manutenção.", 'error', 4000, ui);
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
     if (!veiculo) return;

     const itemParaRemover = veiculo.historicoManutencao.find(m => m.id === idManutencao);
     const msgConfirm = itemParaRemover
        ? `Tem certeza que deseja remover o seguinte registro/agendamento?\n\n"${itemParaRemover.retornarFormatada(true)}"`
        : "Tem certeza que deseja remover este item de manutenção?";

     if (confirm(msgConfirm)) {
         if (veiculo.removerManutencao(idManutencao)) {
             minhaGaragem.salvarNoLocalStorage();
             atualizarPainelVeiculoSelecionado();
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
              atualizarInterfaceCompleta();
         } else {
              showNotification(`Falha ao remover ${veiculo.modelo}.`, 'error', 3000, ui);
         }
    }
}

// --- Funções da API Simulada (Veículos) ---
async function buscarDetalhesVeiculoAPI(identificadorVeiculo) {
    const urlAPI = './dados_veiculos_api.json';
    try {
        const response = await fetch(urlAPI, { cache: "no-cache" });
        if (!response.ok) {
            const erroMsg = `Falha ao buscar detalhes da API (Erro ${response.status}: ${response.statusText}). Verifique o arquivo '${urlAPI}'.`;
            return { erro: true, mensagem: erroMsg };
        }
        const dadosTodosVeiculos = await response.json();
        if (!Array.isArray(dadosTodosVeiculos)) {
            return { erro: true, mensagem: "Formato de dados inválido no arquivo JSON da API." };
        }
        const detalhes = dadosTodosVeiculos.find(v => v && v.id === identificadorVeiculo);
        return detalhes ? detalhes : null;
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

    if(ui.btnVerDetalhesExtras) ui.btnVerDetalhesExtras.disabled = false;

    if (detalhes && detalhes.erro) {
        ui.detalhesExtrasVeiculoDiv.innerHTML = `<p class="error-feedback"><i class="fas fa-exclamation-triangle"></i> Erro: ${detalhes.mensagem}</p>`;
    } else if (detalhes) {
        let recallStatus = detalhes.recallPendente
            ? `<span class="recall-pendente">Sim${detalhes.recallDescricao ? ` (${detalhes.recallDescricao})` : ''}</span>`
            : `<span class="recall-ok">Não</span>`;

        let dataRevisaoFormatada = 'N/A';
        if (detalhes.ultimaRevisaoAPI) {
            try {
                const dataObj = new Date(detalhes.ultimaRevisaoAPI + 'T00:00:00Z');
                if (!isNaN(dataObj)) {
                    dataRevisaoFormatada = dataObj.toLocaleDateString('pt-BR', {
                        year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC'
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
    } else {
        ui.detalhesExtrasVeiculoDiv.innerHTML = `<p class="notfound-feedback"><i class="fas fa-search"></i> Nenhum detalhe extra encontrado para o veículo ${veiculo.modelo} (ID: ${veiculo.id}) na API simulada.</p>`;
    }
}


// --- Funções da API de Previsão do Tempo (OpenWeatherMap) ---
// ALTERADO: Esta função agora chama o NOSSO backend
async function buscarPrevisaoDetalhadaTempo(cidade) {
    // A URL agora aponta para o seu servidor backend
    // Certifique-se que a porta (3001 aqui) é a mesma que seu server.js está usando
    const backendUrl = `http://localhost:3001/api/previsao/${encodeURIComponent(cidade)}`;
    console.log(`[Frontend] Chamando backend para previsão: ${backendUrl}`);

    try {
        const response = await fetch(backendUrl);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Tenta pegar a mensagem de erro do JSON do backend
            // Usa a mensagem de erro do backend se disponível, senão uma mensagem genérica
            throw new Error(errorData.error || `Erro ${response.status} ao buscar previsão do backend.`);
        }

        const data = await response.json();
        console.log("[Frontend] Dados da previsão recebidos do backend:", data);
        return data; // Retorna os dados recebidos do backend (que são os dados da OpenWeatherMap)
    } catch (error) {
        console.error("[Frontend] Falha ao buscar previsão do backend:", error);
        throw error; // Re-lança o erro para ser tratado por handleVerificarClima
    }
}

// As funções processarDadosForecastTempo e exibirPrevisaoDetalhadaTempo permanecem as mesmas,
// pois o formato dos dados que o backend retorna é o mesmo que a OpenWeatherMap retornava.
function processarDadosForecastTempo(dataApi) {
    // ... (esta função não precisa de alteração)
    if (!dataApi || !dataApi.list || !Array.isArray(dataApi.list) || dataApi.list.length === 0) {
        console.error("Dados da API de tempo inválidos ou lista de previsões vazia.", dataApi);
        return null;
    }
    const diasAgrupados = {};
    dataApi.list.forEach(item => {
        const dataDia = item.dt_txt.split(' ')[0];
        if (!diasAgrupados[dataDia]) {
            diasAgrupados[dataDia] = {
                temps: [],
                descricoes: [],
                icones: [],
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
    return previsaoDiariaProcessada;
}

function exibirPrevisaoDetalhadaTempo(previsaoDiariaParaExibir, nomeCidade) {
    // ... (esta função não precisa de alteração)
    if (!ui.previsaoResultadoDivTempo) return;
    ui.previsaoResultadoDivTempo.innerHTML = '';

    if (!previsaoDiariaParaExibir || previsaoDiariaParaExibir.length === 0) {
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

function formatarDataParaExibicaoTempo(dataString) {
    // ... (esta função não precisa de alteração)
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
}

function capitalizarPrimeiraLetraTempo(string) {
    // ... (esta função não precisa de alteração)
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function exibirStatusTempo(mensagem, tipo = 'info') {
    // ... (esta função não precisa de alteração)
    if (!ui.statusMensagemTempoDiv) return;
    ui.statusMensagemTempoDiv.textContent = mensagem;
    ui.statusMensagemTempoDiv.className = 'status-mensagem';
    if (tipo) {
        ui.statusMensagemTempoDiv.classList.add(tipo);
    }
}

async function handleVerificarClima() {
    // ... (esta função não precisa de alteração na sua lógica principal,
    //      exceto que agora ela não precisa mais se preocupar com a chave API diretamente)
    if (!ui.cidadeInputTempo) return;
    const cidade = ui.cidadeInputTempo.value.trim();

    if (!cidade) {
        exibirStatusTempo("Por favor, digite o nome de uma cidade.", 'error');
        previsaoCompletaApiCache = [];
        cidadeAtualPrevisaoCache = "";
        if (ui.previsaoResultadoDivTempo) ui.previsaoResultadoDivTempo.innerHTML = '';
        return;
    }
    // REMOVIDO: A verificação da chave API não é mais feita aqui no frontend.
    // if (WEATHER_API_KEY === "SUA_CHAVE_API_AQUI" || WEATHER_API_KEY === "569ee28c1908ad6eaadb431e635166be") {
    //      exibirStatusTempo("AVISO: A chave da API de Previsão do Tempo não foi configurada. Verifique o arquivo js/principal.js.", 'warning');
    //      if(ui.verificarClimaBtn) ui.verificarClimaBtn.disabled = true;
    //      return;
    // }
    // if(ui.verificarClimaBtn) ui.verificarClimaBtn.disabled = false;

    exibirStatusTempo("Carregando previsão...", 'loading');
    if (ui.previsaoResultadoDivTempo) ui.previsaoResultadoDivTempo.innerHTML = '';

    try {
        const dadosApi = await buscarPrevisaoDetalhadaTempo(cidade); // Esta função foi alterada para chamar o backend
        if (dadosApi) {
            // O nome da cidade agora vem do backend (que pega da OpenWeatherMap)
            // Se a API da OpenWeatherMap retornar um nome diferente do digitado, usamos o dela.
            const nomeCidadeRetornado = dadosApi.city && dadosApi.city.name ? dadosApi.city.name : cidade;

            previsaoCompletaApiCache = processarDadosForecastTempo(dadosApi);
            cidadeAtualPrevisaoCache = nomeCidadeRetornado;

            if (previsaoCompletaApiCache && previsaoCompletaApiCache.length > 0) {
                const previsaoFiltrada = previsaoCompletaApiCache.slice(0, diasFiltroPrevisao);
                exibirPrevisaoDetalhadaTempo(previsaoFiltrada, cidadeAtualPrevisaoCache);
                exibirStatusTempo("");
            } else {
                // Se o backend retornou dados, mas o processamento falhou
                exibirStatusTempo(`Não foi possível processar a previsão para ${capitalizarPrimeiraLetraTempo(nomeCidadeRetornado)}.`, 'error');
            }
        } else {
             // Caso raro onde buscarPrevisaoDetalhadaTempo retorna null/undefined sem lançar erro.
             exibirStatusTempo("Resposta inesperada do servidor de previsão.", 'error');
        }
    } catch (error) {
        console.error("[Frontend] Erro no fluxo principal da previsão do tempo:", error);
        exibirStatusTempo(error.message || "Ocorreu um erro ao buscar a previsão. Tente novamente.", 'error');
        previsaoCompletaApiCache = [];
        cidadeAtualPrevisaoCache = "";
    }
}
function handleFiltroDiasClick(event) {
    // ... (esta função não precisa de alteração)
    const botaoClicado = event.target.closest('.filtro-dia-btn');
    if (!botaoClicado) return;

    diasFiltroPrevisao = parseInt(botaoClicado.dataset.dias, 10);

    ui.filtroDiasBotoes.forEach(btn => btn.classList.remove('active'));
    botaoClicado.classList.add('active');

    if (previsaoCompletaApiCache.length > 0 && cidadeAtualPrevisaoCache) {
        const previsaoFiltrada = previsaoCompletaApiCache.slice(0, diasFiltroPrevisao);
        exibirPrevisaoDetalhadaTempo(previsaoFiltrada, cidadeAtualPrevisaoCache);
        exibirStatusTempo("");
    } else {
        if (ui.cidadeInputTempo.value.trim()) {
            exibirStatusTempo("Busque uma cidade para ver a previsão.", "info");
        }
        if (ui.previsaoResultadoDivTempo) ui.previsaoResultadoDivTempo.innerHTML = '';
    }
}


// --- Inicialização da Aplicação ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Carregado. Iniciando Garagem Virtual V3 & Previsão do Tempo...");
    // REMOVIDO: console.log("DEBUG: Verificando chave DENTRO do DOMContentLoaded (antes da lógica):", WEATHER_API_KEY);

    try {
        // ... (lógica de inicialização da garagem permanece a mesma) ...
        const pathElement = document.querySelector('.velocimetro-progresso');
        if (pathElement && typeof pathElement.getTotalLength === 'function') {
            try {
                velocimetroPathLength = pathElement.getTotalLength();
                document.documentElement.style.setProperty('--velocimetro-path-length', velocimetroPathLength);
            } catch (e) {
                 console.warn("Não foi possível calcular getTotalLength do velocímetro, usando valor padrão.", e);
                 document.documentElement.style.setProperty('--velocimetro-path-length', 251.2);
            }
        } else {
            document.documentElement.style.setProperty('--velocimetro-path-length', 251.2);
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
            // REMOVIDO: A verificação da chave API não é mais feita aqui no frontend.
            // if (WEATHER_API_KEY === "SUA_CHAVE_API_AQUI" || WEATHER_API_KEY === "569ee28c1908ad6eaadb431e635166be") {
            //     exibirStatusTempo("AVISO: A chave da API de Previsão do Tempo não foi configurada. Verifique o arquivo js/principal.js.", 'warning');
            //     if (ui.verificarClimaBtn) ui.verificarClimaBtn.disabled = true;
            // } else {
            //      if (ui.verificarClimaBtn) ui.verificarClimaBtn.disabled = false;
            // }
            // O botão de verificar clima deve estar sempre habilitado agora,
            // pois a validação da chave é feita no backend.
            if (ui.verificarClimaBtn) ui.verificarClimaBtn.disabled = false;
        }
        if (ui.cidadeInputTempo) {
            ui.cidadeInputTempo.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    if (ui.verificarClimaBtn && !ui.verificarClimaBtn.disabled) {
                        handleVerificarClima();
                    }
                }
            });
        }
        if (ui.filtroDiasBotoes) {
            ui.filtroDiasBotoes.forEach(botao => {
                botao.addEventListener('click', handleFiltroDiasClick);
            });
        }

        ativarTab('tab-visao-geral');
        atualizarInterfaceCompleta();

        setTimeout(() => {
            try {
                const mensagensAgendamento = minhaGaragem.verificarAgendamentosProximos();
                if (mensagensAgendamento && mensagensAgendamento.length > 0) {
                    mensagensAgendamento.forEach((msg, index) => {
                        setTimeout(() => showNotification(msg, 'info', 8000 + index * 500, ui), index * 700);
                    });
                }
            } catch(error) {
                console.error("[Init] Erro ao verificar agendamentos próximos:", error);
            }
        }, 1500);

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
        } catch(e) { /* ignore */ }
        alert("Ocorreu um erro grave ao iniciar a aplicação. Verifique o console (F12).");
    }


    // js/principal.js

// ... (resto do seu código principal.js)

async function buscarPrevisaoDetalhadaTempo(cidade) {
    // !!! IMPORTANTE: Substitua pela SUA URL pública do Render.com !!!
    // MANTENHA as barras e o encodeURIComponent(cidade) no final.
    // Exemplo: se sua URL no Render é https://garagem-backend-vinicius.onrender.com
    // const backendUrl = `https://garagem-backend-vinicius.onrender.com/api/previsao/${encodeURIComponent(cidade)}`;
    
    // #############################################################################
    // ###  👉 COLOQUE A URL DO SEU BACKEND DO RENDER.COM AQUI   👇               ###
    // #############################################################################
    const backendUrl = `6dacf82d5af7c058dc2b4bde9bfe765a${encodeURIComponent(cidade)}`;
    // #############################################################################
    
    // ATENÇÃO: Verifique se não há uma barra dupla (//) antes de /api/previsao/
    // Se sua URL do Render terminar com barra, remova a barra inicial do /api/previsao/
    // Ex: se Render deu https://meu-app.onrender.com/
    // então ficaria: `https://meu-app.onrender.com/api/previsao/${encodeURIComponent(cidade)}`
    // Ex: se Render deu https://meu-app.onrender.com (sem barra no final)
    // então ficaria: `https://meu-app.onrender.com/api/previsao/${encodeURIComponent(cidade)}` (que já estava certo)

    console.log(`[Frontend] Chamando backend NA NUVEM para previsão: ${backendUrl}`);

    try {
        const response = await fetch(backendUrl);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Tenta pegar a mensagem de erro do JSON
            // Usa a mensagem de erro do backend se disponível, senão uma mensagem genérica
            throw new Error(errorData.error || `Erro ${response.status} do servidor de clima (nuvem) ao buscar previsão.`);
        }

        const data = await response.json();
        console.log("[Frontend] Dados da previsão recebidos do backend (nuvem):", data);
        return data; // Retorna os dados recebidos do backend
    } catch (error) {
        console.error("[Frontend] Falha ao buscar previsão do backend (nuvem):", error);
        throw error; // Re-lança o erro para ser tratado por handleVerificarClima
    }
}

// ... (resto do seu código principal.js)

});
