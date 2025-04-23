// js/principal.js
'use strict';

// --- Importações ---
// Verifique se os ARQUIVOS realmente existem nesses caminhos e com esses nomes!
import Garagem from './models/garagem.js';
import Manutencao from './models/manutenção.js';        // <-- VERIFIQUE js/models/manutencao.js (sem acento)
import Carro from './models/carro.js';
import CarroEsportivo from './models/carroesportivo.js'; // <-- VERIFIQUE js/models/carroEsportivo.js (sem espaço)
import Caminhao from './models/caminhão.js';             // <-- VERIFIQUE js/models/caminhao.js
import { showNotification, hideNotification } from './utils/notificação.js'; // <-- VERIFIQUE js/utils/notificacoes.js (sem acento)

// --- Referências aos Elementos da UI ---
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
    velocimetroProgressoPath: null, // Será atualizado dinamicamente
    infoEspecifica: document.getElementById('info-especifica'),
    botoesAcoesContainer: document.getElementById('botoesAcoes'),
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

// --- Instância Principal da Aplicação ---
const minhaGaragem = new Garagem();

// --- Funções de Atualização da Interface Gráfica (UI) ---

function atualizarListaVeiculosSidebar() {
    const listaUl = ui.listaVeiculosSidebar;
    if (!listaUl) return;
    listaUl.innerHTML = '';

    if (minhaGaragem.veiculos.length === 0) {
        listaUl.innerHTML = '<li class="placeholder">Nenhum veículo na garagem.</li>';
        return;
    }

    minhaGaragem.veiculos.forEach(v => {
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
                 }
             }
        });
        listaUl.appendChild(li);
    });
}

function ativarTab(tabId) {
    ui.tabContents.forEach(content => content.classList.remove('active'));
    ui.tabLinks.forEach(link => link.classList.remove('active'));

    const contentToActivate = document.getElementById(tabId);
    const linkToActivate = document.querySelector(`.tab-link[data-tab="${tabId}"]`);

    if (contentToActivate) contentToActivate.classList.add('active');
    if (linkToActivate) linkToActivate.classList.add('active');
}

// ***** INÍCIO: Função atualizarVelocimetro com LOGS *****
function atualizarVelocimetro(velocidade, velocidadeMaxima) {
    // ----- LOG VELOCÍMETRO -----
    console.log(`[Velocímetro] Tentando atualizar: vel=${velocidade}, max=${velocidadeMaxima}`);

    const progressoPath = ui.velocimetroProgressoPath; // Usa a referência já pega
    const velocidadeTexto = ui.velocidadeAtual;

    // Verifica se os elementos existem ANTES de usar
    if (!progressoPath || !velocidadeTexto) {
        console.warn("[Velocímetro] Elemento 'progressoPath' ou 'velocidadeTexto' não encontrado na UI object.");
        // Se o painel estiver visível mas os elementos não, é um problema de referência.
        if(ui.painelVeiculoSelecionado && ui.painelVeiculoSelecionado.style.display !== 'none') {
             console.error("[Velocímetro] ERRO: Painel visível, mas elementos internos não referenciados!");
        }
        return; // Sai se não encontrou os elementos essenciais
    }

     // Garante que o container está visível (redundante se chamado corretamente, mas seguro)
     if (ui.barraProgressoContainer.style.display === 'none') {
        console.warn("[Velocímetro] Container está escondido, não atualizando visualmente.");
        // Reseta o texto mesmo escondido
        velocidadeTexto.textContent = '0 km/h';
        progressoPath.style.strokeDashoffset = '251.2';
        return;
     }

    const maxVel = velocidadeMaxima > 0 ? velocidadeMaxima : 1;
    const velocidadeAtual = Math.max(0, Math.min(velocidade, maxVel));
    const comprimentoTotalArco = 251.2;
    const porcentagem = velocidadeAtual / maxVel;
    const offset = comprimentoTotalArco * (1 - porcentagem);

    // ----- LOG VELOCÍMETRO -----
    console.log(`[Velocímetro] Calculado: %=${porcentagem.toFixed(2)}, offset=${offset.toFixed(1)}`);

    try {
        progressoPath.style.strokeDashoffset = offset;
        velocidadeTexto.textContent = `${Math.round(velocidadeAtual)} km/h`;

        let corProgresso = 'var(--cor-primaria)';
        if (porcentagem > 0.85) corProgresso = 'var(--cor-perigo)';
        else if (porcentagem > 0.6) corProgresso = 'var(--cor-aviso)';
        progressoPath.style.stroke = corProgresso;
        // ----- LOG VELOCÍMETRO -----
        console.log(`[Velocímetro] Estilos aplicados. Cor: ${corProgresso}`);
    } catch (e) {
        // Captura erro caso progressoPath seja inválido no momento de aplicar estilo
        console.error("[Velocímetro] Erro ao aplicar estilos:", e, { progressoPath });
    }
}
// ***** FIM: Função atualizarVelocimetro com LOGS *****

function renderizarListaManutencao(ulElement, itens) {
     if (!ulElement) return;
     ulElement.innerHTML = '';

     if (!itens || itens.length === 0) {
          const tipoLista = ulElement.closest('.maintenance-list')?.id === 'historicoManutencao' ? 'Histórico' : 'Agendamentos';
          ulElement.innerHTML = `<li style="font-style: italic; color: #888; text-align: center; padding: 15px;">Nenhum registro de ${tipoLista.toLowerCase()} encontrado.</li>`;
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

         li.appendChild(removeButton);
         ulElement.appendChild(li);
     });
}

// ***** INÍCIO: Função atualizarPainelVeiculoSelecionado com LOGS *****
function atualizarPainelVeiculoSelecionado() {
    const veiculo = minhaGaragem.getVeiculoSelecionado();
    // ----- LOG PAINEL -----
    console.log("[Painel] Atualizando para veículo:", veiculo ? `${veiculo.modelo} (ID: ${veiculo.id})` : "Nenhum");

    if (veiculo) {
        ui.painelVeiculoSelecionado.style.display = 'block';
        ui.mensagemSelecione.style.display = 'none';

        // --- Atualiza Header e Imagem ---
        const baseInfo = veiculo.exibirInformacoesBase();
        ui.infoModeloTipo.textContent = `${baseInfo.modelo} (${veiculo.constructor.name})`;
        ui.infoCor.textContent = baseInfo.cor;
        ui.infoId.textContent = baseInfo.id;
        ui.botaoRemoverVeiculoHeader.style.display = 'inline-flex';

        let imagemSrc = 'imagens/carro_normal.png';
        if (veiculo instanceof CarroEsportivo) imagemSrc = 'imagens/carro_esportivo.png';
        else if (veiculo instanceof Caminhao) imagemSrc = 'imagens/caminhao.png'; // Verifique este nome!
        ui.imagemVeiculo.src = imagemSrc;
        ui.imagemVeiculo.alt = `Imagem de ${veiculo.modelo}`;


        // --- Reset inicial e Referência do Velocímetro ---
        ui.infoEspecifica.innerHTML = '';
        ui.barraProgressoContainer.style.display = 'none'; // Esconde por padrão
        ui.infoStatusMotor.parentElement.style.display = 'none'; // Esconde por padrão
        ui.botoesAcoesContainer.querySelectorAll('button').forEach(btn => btn.style.display = 'none');

        // Pega a referência AGORA que o painel está visível (display='block')
        ui.velocimetroProgressoPath = ui.painelVeiculoSelecionado.querySelector('.velocimetro-progresso');
        // ----- LOG PAINEL -----
        console.log("[Painel] Referência velocimetroProgressoPath:", ui.velocimetroProgressoPath ? "Encontrada" : "NÃO ENCONTRADA!");


        // --- Lógica Específica para Carro e Subtipos ---
        if (veiculo instanceof Carro) {
            const dadosCarro = veiculo.getDadosEspecificos();
            // ----- LOG PAINEL -----
            console.log("[Painel] Dados do Carro:", dadosCarro);

            // --- Status Motor ---
            const statusContainer = ui.infoStatusMotor.parentElement;
            if (statusContainer) {
                statusContainer.style.display = 'block'; // Mostra o container do status
                // Atualiza o conteúdo do SPAN
                ui.infoStatusMotor.innerHTML = dadosCarro.ligado
                    ? "<i class='fas fa-circle status-on'></i> Ligado"
                    : "<i class='fas fa-circle status-off'></i> Desligado";
                // ----- LOG PAINEL -----
                console.log(`[Painel] Status Motor definido para: ${dadosCarro.ligado ? 'Ligado (Verde)' : 'Desligado (Vermelho)'}`);
            } else {
                console.error("[Painel] Container do status do motor não encontrado!");
            }

            // --- Velocímetro ---
            // Só mostra o container se a referência ao path foi encontrada
            if (ui.velocimetroProgressoPath) {
                 ui.barraProgressoContainer.style.display = 'flex'; // Mostra o container do velocímetro
                 // ----- LOG PAINEL -----
                 console.log("[Painel] Mostrando container do velocímetro e chamando atualização.");
                 atualizarVelocimetro(dadosCarro.velocidade, dadosCarro.velocidadeMaxima);
            } else {
                 console.error("[Painel] NÃO mostrando velocímetro porque a referência ao path falhou anteriormente.");
                 ui.barraProgressoContainer.style.display = 'none'; // Garante que está escondido
            }


            // --- Botões ---
            const btnLigar = ui.botoesAcoesContainer.querySelector('[data-action="ligar"]');
            const btnDesligar = ui.botoesAcoesContainer.querySelector('[data-action="desligar"]');
            const btnAcelerar = ui.botoesAcoesContainer.querySelector('[data-action="acelerar"]');
            const btnFrear = ui.botoesAcoesContainer.querySelector('[data-action="frear"]');

            if(btnLigar) { btnLigar.style.display = 'inline-flex'; btnLigar.disabled = dadosCarro.ligado; }
            if(btnDesligar) { btnDesligar.style.display = 'inline-flex'; btnDesligar.disabled = !dadosCarro.ligado; }
            if(btnAcelerar) { btnAcelerar.style.display = 'inline-flex'; btnAcelerar.disabled = !dadosCarro.ligado || dadosCarro.velocidade >= dadosCarro.velocidadeMaxima; }
            if(btnFrear) { btnFrear.style.display = 'inline-flex'; btnFrear.disabled = !dadosCarro.ligado || dadosCarro.velocidade === 0; }


            // --- Infos e Botões Específicos ---
            if (veiculo instanceof CarroEsportivo) {
                 ui.infoEspecifica.innerHTML = `<p><i class="fas fa-bolt"></i> Boost Disponível: <span>${!dadosCarro.turboBoostUsado ? 'Sim' : 'Não'}</span></p>`;
                 const btnTurbo = ui.botoesAcoesContainer.querySelector('[data-action="ativarTurbo"]');
                 if(btnTurbo) {
                     btnTurbo.style.display = 'inline-flex';
                     btnTurbo.disabled = dadosCarro.turboBoostUsado || !dadosCarro.ligado || dadosCarro.velocidade === 0;
                 }
            } else if (veiculo instanceof Caminhao) {
                 ui.infoEspecifica.innerHTML = `<p><i class="fas fa-weight-hanging"></i> Carga: <span>${dadosCarro.cargaAtual} / ${dadosCarro.capacidadeCarga} kg</span></p>`;
                 const btnCarregar = ui.botoesAcoesContainer.querySelector('[data-action="carregar"]');
                 const btnDescarregar = ui.botoesAcoesContainer.querySelector('[data-action="descarregar"]');
                 if(btnCarregar) {
                     btnCarregar.style.display = 'inline-flex';
                     btnCarregar.disabled = dadosCarro.ligado || dadosCarro.cargaAtual >= dadosCarro.capacidadeCarga;
                 }
                 if(btnDescarregar) {
                     btnDescarregar.style.display = 'inline-flex';
                     btnDescarregar.disabled = dadosCarro.ligado || dadosCarro.cargaAtual === 0;
                 }
            }

        } else {
             // Caso não seja instância de Carro (veículo base, etc.)
             ui.infoEspecifica.innerHTML = '<p><i>Este veículo não possui ações de condução.</i></p>';
             // ----- LOG PAINEL -----
             console.log("[Painel] Veículo selecionado não é instância de Carro. Escondendo status e velocímetro.");
             // Garante que estão escondidos
             if(ui.infoStatusMotor.parentElement) ui.infoStatusMotor.parentElement.style.display = 'none';
             ui.barraProgressoContainer.style.display = 'none';
             // Reseta velocímetro mesmo escondido
             atualizarVelocimetro(0,1);
        }

        // --- Atualiza Aba Manutenção ---
        // ----- LOG PAINEL -----
        console.log("[Painel] Atualizando listas de manutenção...");
        renderizarListaManutencao(ui.historicoUl, veiculo.getHistoricoPassadoFormatado());
        renderizarListaManutencao(ui.agendamentosUl, veiculo.getAgendamentosFuturosFormatados());

    } else {
        // Nenhum veículo selecionado
        ui.painelVeiculoSelecionado.style.display = 'none';
        ui.mensagemSelecione.style.display = 'block';
        ui.velocimetroProgressoPath = null; // Limpa a referência
        atualizarVelocimetro(0, 1); // Reseta visualmente (embora escondido)
        // ----- LOG PAINEL -----
        console.log("[Painel] Nenhum veículo selecionado. Painel escondido.");
    }
}
// ***** FIM: Função atualizarPainelVeiculoSelecionado com LOGS *****

function atualizarInterfaceCompleta() {
    atualizarListaVeiculosSidebar();
    atualizarPainelVeiculoSelecionado();
}

// --- Funções de Interação e Gerenciamento ---

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
        if (typeof veiculo[acao] === 'function') { // Verifica se o método existe no objeto
             resultadoAcao = veiculo[acao](); // Chama o método dinamicamente
             // Lidar com o fato de ligar/desligar retornarem boolean e os outros objetos
             if (typeof resultadoAcao === 'boolean') {
                 resultadoAcao = { success: resultadoAcao }; // Converte para objeto padrão
             }
             precisaSalvar = resultadoAcao.success;
         } else {
              console.error(`Método '${acao}' não encontrado no veículo tipo ${veiculo.constructor.name}`);
              resultadoAcao = { success: false, message: `Ação '${acao}' inválida para este veículo.` };
         }

        if (resultadoAcao.message) {
            // Ajuste para tipo de notificação: success para turbo, warning para erros/avisos, info para mensagens neutras
            let notificationType = 'info';
            if (resultadoAcao.success) {
                notificationType = (acao === 'ativarTurbo' || acao === 'carregar' || acao === 'descarregar') ? 'success' : 'info';
            } else {
                notificationType = 'warning';
            }
            showNotification(resultadoAcao.message, notificationType, 3000, ui);
        } else if (resultadoAcao.success && (acao === 'ligar' || acao === 'desligar')) {
            showNotification(`${veiculo.modelo} ${acao === 'ligar' ? 'ligado' : 'desligado'}.`, 'success', 1500, ui);
        }

    } catch (error) {
        console.error(`Erro ao executar ação '${acao}' para ${veiculo?.modelo}:`, error);
        showNotification(`Ocorreu um erro inesperado ao executar a ação '${acao}'. Verifique o console.`, 'error', 5000, ui);
    } finally {
        if (precisaSalvar) {
            minhaGaragem.salvarNoLocalStorage();
        }
        atualizarPainelVeiculoSelecionado(); // Atualiza a UI DEPOIS da ação
    }
}

function adicionarNovoVeiculo(event) {
    event.preventDefault(); // Garante que a prevenção está aqui!
    console.log("--- [1] Botão Adicionar Veículo CLICADO ---"); // LOG INICIAL

    const tipo = ui.novoVeiculoTipo.value;
    const modelo = ui.novoVeiculoModelo.value.trim();
    const cor = ui.novoVeiculoCor.value.trim();
    const capacidadeStr = ui.novoVeiculoCapacidade.value;
    let capacidadeCarga = 0;

    console.log("--- [2] Valores do Form:", { tipo, modelo, cor, capacidadeStr }); // LOG VALORES

    // --- Validações ---
    if (!tipo) {
        console.log("--- [X] Falha: Tipo não selecionado.");
        showNotification("Selecione o tipo de veículo.", 'warning', 3000, ui); ui.novoVeiculoTipo.focus(); return;
    }
    if (!modelo) {
        console.log("--- [X] Falha: Modelo vazio.");
        showNotification("Informe o modelo do veículo.", 'warning', 3000, ui); ui.novoVeiculoModelo.focus(); return;
    }
    if (!cor) {
        console.log("--- [X] Falha: Cor vazia.");
        showNotification("Informe a cor do veículo.", 'warning', 3000, ui); ui.novoVeiculoCor.focus(); return;
    }

    let novoVeiculo = null;
    try {
        console.log("--- [3] Tentando INSTANCIAR veículo tipo:", tipo); // LOG INSTANCIAÇÃO
        switch (tipo) {
            case 'Carro':
                novoVeiculo = new Carro(modelo, cor);
                break;
            case 'CarroEsportivo':
                novoVeiculo = new CarroEsportivo(modelo, cor);
                break;
            case 'Caminhao':
                 capacidadeCarga = parseInt(capacidadeStr, 10);
                 if (!capacidadeStr || isNaN(capacidadeCarga) || capacidadeCarga <= 0) {
                     console.log("--- [X] Falha: Capacidade inválida para Caminhão.", capacidadeStr);
                     showNotification("Para Caminhão, informe uma capacidade de carga válida (kg, número positivo).", 'warning', 4000, ui);
                     ui.novoVeiculoCapacidade.focus(); return;
                 }
                novoVeiculo = new Caminhao(modelo, cor, capacidadeCarga);
                break;
            default:
                console.log("--- [X] Falha: Tipo de veículo inválido no switch.", tipo);
                showNotification("Tipo de veículo selecionado é inválido.", 'error', 3000, ui); return;
        }
        // Verifica se a instância foi realmente criada
        if (!novoVeiculo) {
             throw new Error("Falha na criação da instância do veículo (novoVeiculo é null/undefined).");
        }
        console.log("--- [4] Instância CRIADA:", novoVeiculo); // LOG INSTÂNCIA OK

    } catch (error) {
        console.error("--- [E] Erro durante INSTANCIAÇÃO:", error); // LOG ERRO INSTANCIAÇÃO
        showNotification(`Erro ao criar veículo: ${error.message || 'Erro desconhecido'}`, 'error', 5000, ui); return;
    }

    console.log("--- [5] Tentando ADICIONAR à garagem:", novoVeiculo); // LOG ADIÇÃO GARAGEM
    const resultadoAdicao = minhaGaragem.adicionarVeiculo(novoVeiculo);
    console.log("--- [6] Resultado de adicionarVeiculo:", resultadoAdicao); // LOG RESULTADO ADIÇÃO

    if (resultadoAdicao.success) {
        console.log("--- [7] Adicionado com SUCESSO. Salvando e atualizando UI..."); // LOG SUCESSO
        minhaGaragem.salvarNoLocalStorage();
        showNotification(`${novoVeiculo.modelo} adicionado com sucesso!`, 'success', 3000, ui);
        ui.formNovoVeiculo.reset();
        ui.divCapacidadeCaminhao.style.display = 'none';
        ui.modalAdicionar.close();

        if(minhaGaragem.selecionarVeiculo(novoVeiculo.id)){
             ativarTab('tab-visao-geral');
             atualizarInterfaceCompleta();
             console.log("--- [8] UI Atualizada após adição."); // LOG UI OK
        } else {
             console.warn("--- [W] Falha ao selecionar veículo recém-adicionado, mas UI será atualizada.");
             atualizarInterfaceCompleta();
        }
    } else {
         console.warn("--- [W] minhaGaragem.adicionarVeiculo retornou FALHA:", resultadoAdicao.message); // LOG FALHA ADIÇÃO
         showNotification(resultadoAdicao.message || `Não foi possível adicionar ${modelo}. Verifique o console.`, 'warning', 4000, ui);
         // Focar no campo modelo pode não ser sempre o certo aqui, mas deixamos por enquanto
         ui.novoVeiculoModelo.focus();
    }
}

function agendarOuRegistrarManutencao(event) {
    event.preventDefault();
    const veiculo = minhaGaragem.getVeiculoSelecionado();

    if (!veiculo) {
        showNotification("Selecione um veículo antes de registrar manutenção!", 'warning', 3000, ui);
        return;
    }

    const dataHora = ui.manutencaoDataHora.value;
    const tipo = ui.manutencaoTipo.value.trim();
    const custoStr = ui.manutencaoCusto.value;
    const descricao = ui.manutencaoDescricao.value.trim();

    if (!dataHora) { showNotification("Selecione a data e hora da manutenção.", 'warning', 3000, ui); ui.manutencaoDataHora.focus(); return; }
    if (!tipo) { showNotification("Informe o tipo de serviço.", 'warning', 3000, ui); ui.manutencaoTipo.focus(); return; }

    let novaManutencao;
    try {
         novaManutencao = new Manutencao(dataHora, tipo, custoStr, descricao);
    } catch (error) {
         console.error("Erro ao criar instância de Manutencao:", error);
         showNotification("Erro ao processar dados da manutenção. Verifique a data/hora.", 'error', 4000, ui); return;
    }

    const resultadoAddManut = veiculo.adicionarManutencao(novaManutencao);

    if (resultadoAddManut.success) {
        minhaGaragem.salvarNoLocalStorage();
        ui.formManutencao.reset();
        atualizarPainelVeiculoSelecionado();
        showNotification("Registro de manutenção salvo com sucesso!", 'success', 3000, ui);
    } else {
        showNotification(resultadoAddManut.message || "Não foi possível salvar a manutenção.", 'error', 4000, ui);
        if (resultadoAddManut.message?.includes("Data")) ui.manutencaoDataHora.focus();
        else if (resultadoAddManut.message?.includes("Tipo")) ui.manutencaoTipo.focus();
    }
}

function lidarComCliqueListaManutencao(event) {
    const removeButton = event.target.closest('.botao-remover-item');
    if (!removeButton) return;

    const liElement = removeButton.closest('li[data-item-id]');
    if (!liElement) return;

    const idManutencao = liElement.dataset.itemId;
    removerManutencaoItem(idManutencao);
}

function removerManutencaoItem(idManutencao) {
     const veiculo = minhaGaragem.getVeiculoSelecionado();
     if (!veiculo) return;

     const itemParaRemover = veiculo.historicoManutencao.find(m => m.id === idManutencao);
     const msgConfirm = itemParaRemover
        ? `Tem certeza que deseja remover este registro/agendamento?\n\n"${itemParaRemover.retornarFormatada(true)}"`
        : "Tem certeza que deseja remover este item de manutenção?";

     if (confirm(msgConfirm)) {
         if (veiculo.removerManutencao(idManutencao)) {
             minhaGaragem.salvarNoLocalStorage();
             atualizarPainelVeiculoSelecionado();
             showNotification("Item de manutenção removido.", 'success', 2000, ui);
         } else {
              showNotification("Não foi possível remover o item.", 'error', 3000, ui);
         }
     }
}

function removerVeiculoSelecionado() {
    const veiculo = minhaGaragem.getVeiculoSelecionado();
    if (!veiculo) {
        showNotification("Nenhum veículo selecionado para remover.", 'warning', 3000, ui);
        return;
    }

    if (confirm(`ATENÇÃO!\n\nRemover permanentemente ${veiculo.modelo} (${veiculo.cor}) da garagem?\n\nEsta ação NÃO pode ser desfeita.`)) {
         if (minhaGaragem.removerVeiculo(veiculo.id)) {
              minhaGaragem.salvarNoLocalStorage();
              showNotification(`${veiculo.modelo} removido permanentemente.`, 'success', 3000, ui);
              atualizarInterfaceCompleta();
         } else {
             showNotification(`Falha ao remover ${veiculo.modelo}.`, 'error', 3000, ui);
         }
    }
}

// --- Inicialização da Aplicação ---

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Carregado. Iniciando Garagem Virtual V3 (Debug Velocímetro/Status)..."); // Mensagem atualizada

    // 1. Carrega Dados
    try {
        const veiculosSalvos = Garagem.carregarDoLocalStorage();
        minhaGaragem.veiculos = veiculosSalvos;

        const idSelecionadoSalvo = localStorage.getItem('garagemVeiculoSelecionadoId');
        if (idSelecionadoSalvo && minhaGaragem.encontrarVeiculo(idSelecionadoSalvo)) {
            minhaGaragem.veiculoSelecionadoId = idSelecionadoSalvo;
            console.log(`Seleção anterior restaurada: ${minhaGaragem.getVeiculoSelecionado()?.modelo}`);
        } else {
             minhaGaragem.veiculoSelecionadoId = null;
             if(idSelecionadoSalvo) localStorage.removeItem('garagemVeiculoSelecionadoId');
        }
    } catch (error) {
        console.error("Erro crítico durante o carregamento inicial:", error);
    }

    // 2. Configura Listeners de Eventos
    if (ui.btnAbrirModalAdicionar && ui.modalAdicionar) {
        ui.btnAbrirModalAdicionar.addEventListener('click', () => {
            ui.formNovoVeiculo.reset();
            ui.divCapacidadeCaminhao.style.display = 'none';
            try { ui.modalAdicionar.showModal(); } catch (e) { console.error("Erro ao abrir modal:", e); }
        });
    }
    if (ui.btnFecharModalAdicionar && ui.modalAdicionar) {
        ui.btnFecharModalAdicionar.addEventListener('click', () => ui.modalAdicionar.close());
    }
    if (ui.modalAdicionar) {
        ui.modalAdicionar.addEventListener('click', (event) => { if (event.target === ui.modalAdicionar) ui.modalAdicionar.close(); });
    }
    if (ui.formNovoVeiculo) {
        ui.formNovoVeiculo.addEventListener('submit', adicionarNovoVeiculo);
        console.log("Listener de submit para formNovoVeiculo ADICIONADO.");
    } else {
        console.error("Formulário #formNovoVeiculo não encontrado durante inicialização.");
    }
    if (ui.novoVeiculoTipo) {
        ui.novoVeiculoTipo.addEventListener('change', (event) => {
            ui.divCapacidadeCaminhao.style.display = (event.target.value === 'Caminhao') ? 'block' : 'none';
        });
    }
    if (ui.formManutencao) {
         ui.formManutencao.addEventListener('submit', agendarOuRegistrarManutencao);
    }
    ui.tabLinks.forEach(button => {
        button.addEventListener('click', () => ativarTab(button.dataset.tab));
    });
    if (ui.botoesAcoesContainer) {
        ui.botoesAcoesContainer.addEventListener('click', lidarComAcaoVeiculo);
    }
    if(ui.botaoRemoverVeiculoHeader) {
        ui.botaoRemoverVeiculoHeader.addEventListener('click', removerVeiculoSelecionado);
    }
    if(ui.historicoUl) {
        ui.historicoUl.addEventListener('click', lidarComCliqueListaManutencao);
    }
     if(ui.agendamentosUl) {
        ui.agendamentosUl.addEventListener('click', lidarComCliqueListaManutencao);
    }
    if (ui.notificationCloseBtn) {
        ui.notificationCloseBtn.addEventListener('click', () => hideNotification(ui));
    }

    // 3. Renderização Inicial
    ativarTab('tab-visao-geral');
    atualizarInterfaceCompleta(); // Chama a função que agora tem logs

    // 4. Verifica Agendamentos Próximos
    setTimeout(() => {
        try {
            const mensagensAgendamento = minhaGaragem.verificarAgendamentosProximos();
            mensagensAgendamento.forEach((msg, index) => {
                setTimeout(() => showNotification(msg, 'info', 8000 + index * 500, ui), index * 700);
            });
        } catch(error) {
            console.error("Erro ao verificar/mostrar agendamentos próximos:", error);
        }
    }, 2000);

    console.log("Garagem Virtual inicializada e pronta.");
});