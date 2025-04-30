// js/principal.js
'use strict';

// --- Importações ---
import Garagem from './models/garagem.js';
import Manutencao from './models/manutençao.js';
import Carro from './models/Carro.js';
import CarroEsportivo from './models/Carroesportivo.js'; // Verifique nome do arquivo/classe
import Caminhao from './models/caminhao.js';
import { showNotification, hideNotification } from './utils/notificações.js'; // Verifique nome do arquivo

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
    infoStatusMotorContainer: document.querySelector('.status-motor-container'),
    infoStatusMotor: document.getElementById('info-status-motor'),
    barraProgressoContainer: document.getElementById('barraProgressoContainer'),
    velocidadeAtual: document.getElementById('velocidadeAtual'),
    velocimetroProgressoPath: null, // Será buscado dinamicamente
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
    // Elementos da API Simulada
    btnVerDetalhesExtras: document.getElementById('btnVerDetalhesExtras'),
    detalhesExtrasVeiculoDiv: document.getElementById('detalhesExtrasVeiculo'),
};

// --- Instância Principal da Aplicação ---
const minhaGaragem = new Garagem();

// --- Variáveis Globais ---
let velocimetroPathLength = 251.2; // Valor padrão, será atualizado

// --- Funções de Atualização da Interface Gráfica (UI) ---

/** Atualiza a lista de veículos na barra lateral. */
function atualizarListaVeiculosSidebar() {
    const listaUl = ui.listaVeiculosSidebar;
    if (!listaUl) {
        console.error("Elemento #listaVeiculosSidebar não encontrado.");
        return;
    }
    listaUl.innerHTML = ''; // Limpa a lista atual

    if (minhaGaragem.veiculos.length === 0) {
        listaUl.innerHTML = '<li class="placeholder">Nenhum veículo na garagem.</li>';
        return;
    }

    // Ordena antes de exibir (opcional, mas recomendado)
    const veiculosOrdenados = [...minhaGaragem.veiculos].sort((a, b) => a.modelo.localeCompare(b.modelo));

    veiculosOrdenados.forEach(v => {
        const li = document.createElement('li');
        li.dataset.id = v.id; // Armazena o ID para fácil acesso

        let iconClass = 'fa-car'; // Ícone padrão
        if (v instanceof CarroEsportivo) iconClass = 'fa-rocket';
        else if (v instanceof Caminhao) iconClass = 'fa-truck';

        li.innerHTML = `<i class="fas ${iconClass}"></i> <span>${v.modelo} (${v.cor})</span>`;

        // Adiciona classe se for o veículo selecionado
        if (v.id === minhaGaragem.veiculoSelecionadoId) {
            li.classList.add('selecionado');
        }

        // Adiciona listener para selecionar o veículo ao clicar
        li.addEventListener('click', () => {
             if (v.id !== minhaGaragem.veiculoSelecionadoId) {
                 if(minhaGaragem.selecionarVeiculo(v.id)){
                    ativarTab('tab-visao-geral'); // Volta para a visão geral
                    atualizarInterfaceCompleta(); // Atualiza tudo
                 } else {
                     console.warn(`Falha ao selecionar veículo ID: ${v.id}`);
                 }
             }
        });
        listaUl.appendChild(li);
    });
}

/** Ativa uma aba específica e desativa as outras. */
function ativarTab(tabId) {
    if (!ui.tabContents || !ui.tabLinks) return;

    ui.tabContents.forEach(content => content?.classList.remove('active'));
    ui.tabLinks.forEach(link => link?.classList.remove('active'));

    const contentToActivate = document.getElementById(tabId);
    const linkToActivate = document.querySelector(`.tab-link[data-tab="${tabId}"]`);

    if (contentToActivate) contentToActivate.classList.add('active');
    if (linkToActivate) linkToActivate.classList.add('active');
}

/** Atualiza o visual do velocímetro SVG. */
function atualizarVelocimetro(velocidade, velocidadeMaxima) {
    // Tenta obter a referência ao path do SVG se ainda não tiver ou se o painel foi recriado
    if (!ui.velocimetroProgressoPath && ui.painelVeiculoSelecionado?.style.display !== 'none') {
        ui.velocimetroProgressoPath = ui.painelVeiculoSelecionado.querySelector('.velocimetro-progresso');
        if (!ui.velocimetroProgressoPath) {
             console.error("[Velocímetro] ERRO: Não foi possível encontrar o elemento .velocimetro-progresso.");
             if(ui.barraProgressoContainer) ui.barraProgressoContainer.style.display = 'none';
             return; // Sai se não encontrou
        }
    }

    // Se o container ou o path não estiverem prontos/visíveis, reseta e sai
    if (!ui.barraProgressoContainer || ui.barraProgressoContainer.style.display === 'none' || !ui.velocimetroProgressoPath) {
        if (ui.velocidadeAtual) ui.velocidadeAtual.textContent = '0 km/h'; // Reseta texto
        if (ui.velocimetroProgressoPath) ui.velocimetroProgressoPath.style.strokeDashoffset = velocimetroPathLength; // Reseta barra
        return;
    }

    // Garante que o elemento de texto existe
    if (!ui.velocidadeAtual) {
        console.error("[Velocímetro] Elemento #velocidadeAtual não encontrado.");
        return;
    }

    // Cálculos para a barra de progresso
    const maxVel = Math.max(1, velocidadeMaxima); // Evita divisão por zero
    const velocidadeAtual = Math.max(0, Math.min(velocidade, maxVel)); // Garante que está nos limites
    const porcentagem = velocidadeAtual / maxVel;
    const offset = velocimetroPathLength * (1 - porcentagem); // Calcula o quanto "esconder" da barra

    // Aplica os estilos ao SVG e atualiza o texto
    try {
        ui.velocimetroProgressoPath.style.strokeDashoffset = offset;
        ui.velocidadeAtual.textContent = `${Math.round(velocidadeAtual)} km/h`;

        // Muda a cor da barra de progresso
        let corProgresso = 'var(--cor-primaria)';
        if (porcentagem > 0.85) corProgresso = 'var(--cor-perigo)';
        else if (porcentagem > 0.6) corProgresso = 'var(--cor-aviso)';
        ui.velocimetroProgressoPath.style.stroke = corProgresso;

    } catch (e) {
        console.error("[Velocímetro] Erro ao aplicar estilos:", e);
        ui.barraProgressoContainer.style.display = 'none'; // Esconde em caso de erro
    }
}

/** Renderiza as listas de histórico ou agendamentos de manutenção. */
function renderizarListaManutencao(ulElement, itens) {
     if (!ulElement) {
        //  console.warn("Tentativa de renderizar lista de manutenção em elemento nulo.");
         return;
     }
     ulElement.innerHTML = ''; // Limpa

     if (!itens || itens.length === 0) {
          const tipoLista = ulElement.closest('.maintenance-list')?.id === 'historicoManutencao' ? 'Histórico' : 'Agendamentos';
          ulElement.innerHTML = `<li class="placeholder">Nenhum registro de ${tipoLista?.toLowerCase() ?? 'manutenção'} encontrado.</li>`;
          return;
     }

     // Ordena os itens pela data (mais recentes/próximos primeiro) - Garante consistência
     const itensOrdenados = [...itens].sort((a, b) => {
         const dataA = minhaGaragem.getVeiculoSelecionado()?.historicoManutencao.find(m => m.id === a.id)?.data;
         const dataB = minhaGaragem.getVeiculoSelecionado()?.historicoManutencao.find(m => m.id === b.id)?.data;
         if (!dataA && !dataB) return 0;
         if (!dataA) return 1;
         if (!dataB) return -1;
         // Ordena agendamentos do mais próximo para o mais distante
         // Ordena histórico do mais recente para o mais antigo
         const agora = new Date();
         const ehAgendamentoA = dataA >= agora;
         const ehAgendamentoB = dataB >= agora;
         if (ehAgendamentoA !== ehAgendamentoB) return ehAgendamentoA ? -1 : 1; // Não mistura tipos se chamado incorretamente
         return ehAgendamentoA ? dataA.getTime() - dataB.getTime() : dataB.getTime() - dataA.getTime();
     });


     itensOrdenados.forEach(item => {
         const li = document.createElement('li');
         li.dataset.itemId = item.id;
         const textoSpan = document.createElement('span');
         textoSpan.textContent = item.texto;
         li.appendChild(textoSpan);

         const removeButton = document.createElement('button');
         removeButton.className = 'botao-remover-item';
         removeButton.title = 'Remover este item';
         removeButton.innerHTML = '<i class="fas fa-times"></i>';
         removeButton.setAttribute('aria-label', `Remover item: ${item.texto}`); // Acessibilidade

         li.appendChild(removeButton);
         ulElement.appendChild(li);
     });
}

/** Atualiza todo o painel de detalhes do veículo selecionado. */
function atualizarPainelVeiculoSelecionado() {
    const veiculo = minhaGaragem.getVeiculoSelecionado();
    // console.log("[Painel] Atualizando para veículo:", veiculo ? `${veiculo.modelo} (ID: ${veiculo.id})` : "Nenhum");

    // --- Reset da Área de Detalhes Extras (API) ---
    if (ui.detalhesExtrasVeiculoDiv) {
        ui.detalhesExtrasVeiculoDiv.innerHTML = '';
        ui.detalhesExtrasVeiculoDiv.style.display = 'none';
    }
    if (ui.btnVerDetalhesExtras) {
        ui.btnVerDetalhesExtras.style.display = 'none'; // Esconde botão
        ui.btnVerDetalhesExtras.disabled = false;     // Habilita botão
    }
    // --- Fim Reset API ---

    if (veiculo) {
        // Mostra o painel principal e esconde a mensagem de "selecione"
        if (ui.painelVeiculoSelecionado) ui.painelVeiculoSelecionado.style.display = 'block';
        if (ui.mensagemSelecione) ui.mensagemSelecione.style.display = 'none';

        // --- Header e Imagem ---
        const baseInfo = veiculo.exibirInformacoesBase();
        if(ui.infoModeloTipo) ui.infoModeloTipo.textContent = `${baseInfo.modelo} (${veiculo.constructor.name})`;
        if(ui.infoCor) ui.infoCor.textContent = baseInfo.cor;
        if(ui.infoId) ui.infoId.textContent = baseInfo.id;
        if(ui.botaoRemoverVeiculoHeader) ui.botaoRemoverVeiculoHeader.style.display = 'inline-flex';

        let imagemSrc = 'imagens/carro_normal.png'; // Padrão
        if (veiculo instanceof CarroEsportivo) imagemSrc = 'imagens/carro_esportivo.png';
        else if (veiculo instanceof Caminhao) imagemSrc = 'imagens/caminhao.png';
        if (ui.imagemVeiculo) {
            ui.imagemVeiculo.src = imagemSrc;
            ui.imagemVeiculo.alt = `Imagem de ${veiculo.modelo}`;
        }

        // --- Mostra o botão de Detalhes Extras ---
        if (ui.btnVerDetalhesExtras) {
            ui.btnVerDetalhesExtras.style.display = 'inline-flex';
        }

        // --- Reset dos controles específicos (status, velocímetro, botões) ---
        if(ui.infoEspecifica) ui.infoEspecifica.innerHTML = '';
        if(ui.barraProgressoContainer) ui.barraProgressoContainer.style.display = 'none';
        if(ui.infoStatusMotorContainer) ui.infoStatusMotorContainer.style.display = 'none';
        if(ui.botoesAcoesContainer) ui.botoesAcoesContainer.querySelectorAll('button').forEach(btn => btn.style.display = 'none');

        // --- Lógica Específica para Carro e Subtipos ---
        if (veiculo instanceof Carro) {
            const dadosCarro = veiculo.getDadosEspecificos();

            // Status Motor
            if (ui.infoStatusMotorContainer && ui.infoStatusMotor) {
                ui.infoStatusMotorContainer.style.display = 'block';
                ui.infoStatusMotor.innerHTML = dadosCarro.ligado
                    ? "<i class='fas fa-circle status-on'></i> Ligado"
                    : "<i class='fas fa-circle status-off'></i> Desligado";
            }

            // Velocímetro (obtem path aqui para garantir visibilidade do painel)
            ui.velocimetroProgressoPath = ui.painelVeiculoSelecionado?.querySelector('.velocimetro-progresso');
            if (ui.velocimetroProgressoPath && ui.barraProgressoContainer) {
                 ui.barraProgressoContainer.style.display = 'flex';
                 atualizarVelocimetro(dadosCarro.velocidade, dadosCarro.velocidadeMaxima);
            } else {
                 if(ui.barraProgressoContainer) ui.barraProgressoContainer.style.display = 'none';
            }

            // Botões Comuns
            const btnLigar = ui.botoesAcoesContainer?.querySelector('[data-action="ligar"]');
            const btnDesligar = ui.botoesAcoesContainer?.querySelector('[data-action="desligar"]');
            const btnAcelerar = ui.botoesAcoesContainer?.querySelector('[data-action="acelerar"]');
            const btnFrear = ui.botoesAcoesContainer?.querySelector('[data-action="frear"]');
            if(btnLigar) { btnLigar.style.display = 'inline-flex'; btnLigar.disabled = dadosCarro.ligado; }
            if(btnDesligar) { btnDesligar.style.display = 'inline-flex'; btnDesligar.disabled = !dadosCarro.ligado; }
            if(btnAcelerar) { btnAcelerar.style.display = 'inline-flex'; btnAcelerar.disabled = !dadosCarro.ligado || dadosCarro.velocidade >= dadosCarro.velocidadeMaxima; }
            if(btnFrear) { btnFrear.style.display = 'inline-flex'; btnFrear.disabled = !dadosCarro.ligado || dadosCarro.velocidade === 0; }

            // Infos e Botões Específicos de Subtipos
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
            } else { // Carro normal
                 if(ui.infoEspecifica) ui.infoEspecifica.innerHTML = '<p><i>Carro padrão.</i></p>';
            }
        } else {
             // Veículo não é instância de Carro (caso raro)
             if(ui.infoEspecifica) ui.infoEspecifica.innerHTML = '<p><i>Controles de condução não disponíveis.</i></p>';
             atualizarVelocimetro(0, 1); // Reseta velocímetro
        }

        // --- Aba Manutenção ---
        renderizarListaManutencao(ui.historicoUl, veiculo.getHistoricoPassadoFormatado());
        renderizarListaManutencao(ui.agendamentosUl, veiculo.getAgendamentosFuturosFormatados());

    } else {
        // Nenhum veículo selecionado
        if(ui.painelVeiculoSelecionado) ui.painelVeiculoSelecionado.style.display = 'none';
        if(ui.mensagemSelecione) ui.mensagemSelecione.style.display = 'block';
        ui.velocimetroProgressoPath = null; // Limpa referência
        atualizarVelocimetro(0, 1); // Reseta velocímetro
        // Botão e área de detalhes extras já foram escondidos no início
    }
}

/** Atualiza toda a interface: sidebar e painel principal. */
function atualizarInterfaceCompleta() {
    atualizarListaVeiculosSidebar();
    atualizarPainelVeiculoSelecionado();
}

// --- Funções de Interação e Gerenciamento ---

/** Lida com cliques nos botões de ação do veículo (Ligar, Acelerar, etc.). */
function lidarComAcaoVeiculo(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return; // Sai se o clique não foi em um botão de ação

    const acao = button.dataset.action;
    const veiculo = minhaGaragem.getVeiculoSelecionado();

    if (!veiculo) {
        showNotification("Selecione um veículo na lista lateral primeiro!", 'warning', 3000, ui);
        return;
    }

    let precisaSalvar = false; // Flag para salvar no localStorage
    let resultadoAcao = { success: false, message: `Ação '${acao}' não implementada ou falhou.` };

    try {
        // Verifica se o método existe no objeto do veículo
        if (typeof veiculo[acao] === 'function') {
             resultadoAcao = veiculo[acao](); // Chama o método dinamicamente

             // Normaliza o retorno para sempre ser um objeto {success, message?}
             if (typeof resultadoAcao === 'boolean') {
                 resultadoAcao = { success: resultadoAcao }; // Converte boolean para objeto
             } else if (resultadoAcao === undefined || resultadoAcao === null) {
                 // Assume sucesso se o método não retornar nada (pode acontecer com acelerar/frear)
                 resultadoAcao = { success: true };
             }

             precisaSalvar = resultadoAcao.success; // Marca para salvar se a ação teve sucesso
         } else {
              console.error(`Método '${acao}' não encontrado no veículo tipo ${veiculo.constructor.name}`);
              resultadoAcao = { success: false, message: `Ação '${acao}' inválida para este veículo.` };
         }

        // Exibe notificação com base no resultado
        if (resultadoAcao.message) {
            // Determina o tipo de notificação (success, warning, error, info)
            let notificationType = resultadoAcao.success ? 'info' : 'warning';
            if (resultadoAcao.success && ['ativarTurbo', 'carregar', 'descarregar'].includes(acao)) {
                notificationType = 'success'; // Ações especiais com sucesso
            } else if (!resultadoAcao.success && !resultadoAcao.message.toLowerCase().includes('máxima') && !resultadoAcao.message.toLowerCase().includes('parado') && !resultadoAcao.message.toLowerCase().includes('já estava') && !resultadoAcao.message.toLowerCase().includes('primeiro') && !resultadoAcao.message.toLowerCase().includes('inválida')) {
                 notificationType = 'error'; // Erros mais significativos
             }
            showNotification(resultadoAcao.message, notificationType, 3500, ui);
        } else if (resultadoAcao.success && (acao === 'ligar' || acao === 'desligar')) {
            // Mensagem padrão para ligar/desligar se não houver específica
            showNotification(`${veiculo.modelo} ${acao === 'ligar' ? 'ligado' : 'desligado'}.`, 'success', 2000, ui);
        }

    } catch (error) {
        console.error(`Erro ao executar ação '${acao}' para ${veiculo?.modelo}:`, error);
        showNotification(`Ocorreu um erro inesperado ao executar a ação '${acao}'. Verifique o console.`, 'error', 5000, ui);
    } finally {
        // Salva o estado se a ação foi bem-sucedida
        if (precisaSalvar) {
            minhaGaragem.salvarNoLocalStorage();
        }
        // Atualiza o painel DEPOIS da ação para refletir o novo estado
        atualizarPainelVeiculoSelecionado();
    }
}

/** Adiciona um novo veículo à garagem a partir do formulário modal. */
function adicionarNovoVeiculo(event) {
    event.preventDefault(); // Previne o envio padrão do formulário
    console.log("--- [Form Add] Iniciando adição ---");

    // Verifica se os elementos do formulário existem
    if (!ui.novoVeiculoTipo || !ui.novoVeiculoModelo || !ui.novoVeiculoCor || !ui.novoVeiculoCapacidade || !ui.divCapacidadeCaminhao || !ui.modalAdicionar || !ui.formNovoVeiculo) {
        console.error("[Form Add] Erro: Elementos do formulário ausentes na UI.");
        showNotification("Erro interno no formulário. Recarregue a página.", "error", 5000, ui);
        return;
    }

    const tipo = ui.novoVeiculoTipo.value;
    const modelo = ui.novoVeiculoModelo.value.trim();
    const cor = ui.novoVeiculoCor.value.trim();
    const capacidadeStr = ui.novoVeiculoCapacidade.value;
    let capacidadeCarga = 0;

    console.log("[Form Add] Valores:", { tipo, modelo, cor, capacidadeStr });

    // Validações básicas
    if (!tipo) { showNotification("Selecione o tipo de veículo.", 'warning', 3000, ui); ui.novoVeiculoTipo.focus(); return; }
    if (!modelo) { showNotification("Informe o modelo do veículo.", 'warning', 3000, ui); ui.novoVeiculoModelo.focus(); return; }
    if (!cor) { showNotification("Informe a cor do veículo.", 'warning', 3000, ui); ui.novoVeiculoCor.focus(); return; }

    let novoVeiculo = null;
    try {
        console.log("[Form Add] Instanciando tipo:", tipo);
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
                     showNotification("Para Caminhão, informe uma capacidade de carga válida (kg).", 'warning', 4000, ui);
                     ui.novoVeiculoCapacidade.focus(); return; // Não continua se inválido
                 }
                novoVeiculo = new Caminhao(modelo, cor, capacidadeCarga);
                break;
            default:
                showNotification("Tipo de veículo selecionado é inválido.", 'error', 3000, ui); return; // Tipo desconhecido
        }
        if (!novoVeiculo) throw new Error("Falha na criação da instância do veículo.");
        console.log("[Form Add] Instância criada:", novoVeiculo);

    } catch (error) {
        console.error("[Form Add] Erro na instanciação:", error);
        showNotification(`Erro ao criar veículo: ${error.message || 'Erro desconhecido'}`, 'error', 5000, ui); return;
    }

    console.log("[Form Add] Adicionando à garagem...");
    const resultadoAdicao = minhaGaragem.adicionarVeiculo(novoVeiculo);
    console.log("[Form Add] Resultado:", resultadoAdicao);

    if (resultadoAdicao.success) {
        console.log("[Form Add] Sucesso! Salvando e atualizando UI...");
        minhaGaragem.salvarNoLocalStorage(); // Salva o novo estado
        showNotification(`${novoVeiculo.modelo} adicionado com sucesso!`, 'success', 3000, ui);
        ui.formNovoVeiculo.reset(); // Limpa o formulário
        ui.divCapacidadeCaminhao.style.display = 'none'; // Esconde campo de capacidade
        if(ui.modalAdicionar.open) ui.modalAdicionar.close(); // Fecha o modal

        // Seleciona o veículo recém-adicionado e atualiza a interface
        if(minhaGaragem.selecionarVeiculo(novoVeiculo.id)){
             ativarTab('tab-visao-geral');
        }
        atualizarInterfaceCompleta(); // Atualiza sidebar e painel
        console.log("[Form Add] UI Atualizada.");
    } else {
         // Exibe a mensagem de erro retornada pela garagem (ex: veículo duplicado)
         console.warn("[Form Add] Falha ao adicionar:", resultadoAdicao.message);
         showNotification(resultadoAdicao.message || `Não foi possível adicionar ${modelo}.`, 'warning', 4000, ui);
         ui.novoVeiculoModelo.focus(); // Foca no modelo em caso de erro
    }
}

/** Adiciona ou agenda uma manutenção para o veículo selecionado. */
function agendarOuRegistrarManutencao(event) {
    event.preventDefault();
    const veiculo = minhaGaragem.getVeiculoSelecionado();

    if (!veiculo) {
        showNotification("Selecione um veículo antes de registrar manutenção!", 'warning', 3000, ui);
        return;
    }

    // Verifica elementos do form de manutenção
    if (!ui.manutencaoDataHora || !ui.manutencaoTipo || !ui.manutencaoCusto || !ui.manutencaoDescricao || !ui.formManutencao) {
        console.error("[Form Manut] Erro: Elementos do formulário ausentes na UI.");
        showNotification("Erro interno no formulário de manutenção.", "error", 5000, ui);
        return;
    }

    const dataHora = ui.manutencaoDataHora.value;
    const tipo = ui.manutencaoTipo.value.trim();
    const custoStr = ui.manutencaoCusto.value; // Pega como string
    const descricao = ui.manutencaoDescricao.value.trim();

    // Validações
    if (!dataHora) { showNotification("Selecione a data e hora da manutenção.", 'warning', 3000, ui); ui.manutencaoDataHora.focus(); return; }
    if (!tipo) { showNotification("Informe o tipo de serviço.", 'warning', 3000, ui); ui.manutencaoTipo.focus(); return; }

    let novaManutencao;
    try {
         // A classe Manutencao deve tratar a conversão e validação do custo
         novaManutencao = new Manutencao(dataHora, tipo, custoStr, descricao);
    } catch (error) {
         console.error("[Form Manut] Erro ao criar instância de Manutencao:", error);
         showNotification("Erro ao processar dados da manutenção. Verifique a data/hora.", 'error', 4000, ui); return;
    }

    // Adiciona a manutenção ao veículo
    const resultadoAddManut = veiculo.adicionarManutencao(novaManutencao);

    if (resultadoAddManut.success) {
        minhaGaragem.salvarNoLocalStorage(); // Salva
        ui.formManutencao.reset(); // Limpa form
        atualizarPainelVeiculoSelecionado(); // Atualiza listas na UI
        showNotification("Registro de manutenção salvo com sucesso!", 'success', 3000, ui);
    } else {
        // Exibe erro retornado pelo método (ex: dados inválidos)
        showNotification(resultadoAddManut.message || "Não foi possível salvar a manutenção.", 'error', 4000, ui);
        // Tenta focar no campo problemático
        if (resultadoAddManut.message?.toLowerCase().includes("data")) ui.manutencaoDataHora.focus();
        else if (resultadoAddManut.message?.toLowerCase().includes("tipo")) ui.manutencaoTipo.focus();
    }
}

/** Lida com cliques na lista de manutenção (para remover itens). */
function lidarComCliqueListaManutencao(event) {
    const removeButton = event.target.closest('.botao-remover-item');
    if (!removeButton) return; // Não foi clique no botão de remover

    const liElement = removeButton.closest('li[data-item-id]');
    if (!liElement || !liElement.dataset.itemId) return; // Não encontrou o item ou ID

    const idManutencao = liElement.dataset.itemId;
    removerManutencaoItem(idManutencao); // Chama a função de remoção
}

/** Remove um item de manutenção do veículo selecionado. */
function removerManutencaoItem(idManutencao) {
     const veiculo = minhaGaragem.getVeiculoSelecionado();
     if (!veiculo) return; // Nenhum veículo selecionado

     // Encontra o item para mostrar na confirmação
     const itemParaRemover = veiculo.historicoManutencao.find(m => m.id === idManutencao);
     const msgConfirm = itemParaRemover
        ? `Tem certeza que deseja remover este registro/agendamento?\n\n"${itemParaRemover.retornarFormatada(true)}"`
        : "Tem certeza que deseja remover este item de manutenção?"; // Fallback

     // Pede confirmação ao usuário
     if (confirm(msgConfirm)) {
         if (veiculo.removerManutencao(idManutencao)) {
             minhaGaragem.salvarNoLocalStorage(); // Salva
             atualizarPainelVeiculoSelecionado(); // Atualiza a lista na UI
             showNotification("Item de manutenção removido.", 'success', 2000, ui);
         } else {
              // A remoção falhou (item não encontrado na classe, pouco provável aqui)
              showNotification("Não foi possível remover o item.", 'error', 3000, ui);
              console.warn(`Falha ao tentar remover manutenção ID ${idManutencao} do veículo ${veiculo.id}`);
         }
     }
}

/** Remove o veículo atualmente selecionado da garagem. */
function removerVeiculoSelecionado() {
    const veiculo = minhaGaragem.getVeiculoSelecionado();
    if (!veiculo) {
        showNotification("Nenhum veículo selecionado para remover.", 'warning', 3000, ui);
        return;
    }

    // Confirmação dupla, pois é permanente
    if (confirm(`ATENÇÃO!\n\nRemover permanentemente ${veiculo.modelo} (${veiculo.cor}) da garagem?\n\nEsta ação NÃO pode ser desfeita.`)) {
         if (minhaGaragem.removerVeiculo(veiculo.id)) {
              minhaGaragem.salvarNoLocalStorage(); // Salva
              showNotification(`${veiculo.modelo} removido permanentemente.`, 'success', 3000, ui);
              atualizarInterfaceCompleta(); // Atualiza tudo (o painel vai sumir)
         } else {
             // Pouco provável falhar aqui se o veículo estava selecionado
             showNotification(`Falha ao remover ${veiculo.modelo}.`, 'error', 3000, ui);
             console.error(`Falha inesperada ao remover veículo ID ${veiculo.id}`);
         }
    }
}


// --- Funções da API Simulada ---

/**
 * Busca detalhes adicionais de um veículo na API simulada (arquivo JSON).
 * @async
 * @param {string} identificadorVeiculo - O ID do veículo a ser buscado.
 * @returns {Promise<object|null|{erro: boolean, mensagem: string}>} Detalhes, null ou objeto de erro.
 */
async function buscarDetalhesVeiculoAPI(identificadorVeiculo) {
    // console.log(`[API Fetch] Buscando ID: ${identificadorVeiculo}`);
    const urlAPI = './dados_veiculos_api.json'; // Caminho relativo ao index.html

    try {
        // Adiciona cache: "no-cache" para evitar problemas durante o desenvolvimento/teste
        const response = await fetch(urlAPI, { cache: "no-cache" });

        if (!response.ok) {
            // Trata erros HTTP como 404 (Não Encontrado) ou 500 (Erro Servidor - menos comum localmente)
            const erroMsg = `Falha ao carregar dados extras (Erro ${response.status}: ${response.statusText}). Verifique se o arquivo '${urlAPI}' existe e está acessível.`;
            console.error(`[API Fetch] Erro HTTP: ${response.status}`, erroMsg);
            return { erro: true, mensagem: erroMsg };
        }

        // Tenta converter a resposta para JSON
        const dadosTodosVeiculos = await response.json();

        // Verifica se o JSON é um array válido
        if (!Array.isArray(dadosTodosVeiculos)) {
             console.error("[API Fetch] Erro: O arquivo JSON não contém um array válido.");
             return { erro: true, mensagem: "Formato inválido no arquivo de dados extras (não é um array)." };
        }

        // Procura o veículo pelo ID dentro do array
        // Adiciona `v &&` para segurança caso haja itens nulos/inválidos no JSON
        const detalhes = dadosTodosVeiculos.find(v => v && v.id === identificadorVeiculo);

        if (detalhes) {
            // console.log("[API Fetch] Detalhes encontrados:", detalhes);
            return detalhes; // Retorna o objeto completo encontrado
        } else {
            // console.log("[API Fetch] Nenhum detalhe extra encontrado para este ID no JSON.");
            return null; // Retorna null para indicar "não encontrado"
        }

    } catch (error) {
        // Captura outros erros (problemas de rede, JSON mal formatado)
        console.error("[API Fetch] Falha ao buscar ou processar detalhes:", error);
        let mensagemErro = "Erro desconhecido ao buscar detalhes extras.";
        if (error instanceof SyntaxError) {
            // Erro específico de JSON inválido
            mensagemErro = "Erro de formato no arquivo JSON de dados extras. Verifique vírgulas, aspas, etc.";
        } else if (error instanceof TypeError && error.message.includes('fetch')) {
             // Erro relacionado à rede (pode acontecer mesmo localmente se houver problema)
             mensagemErro = "Erro de rede ao tentar buscar dados extras.";
        } else if (error.message) {
            // Usa a mensagem do erro se disponível
            mensagemErro = error.message;
        }
        return { erro: true, mensagem: mensagemErro }; // Retorna um objeto de erro
    }
}

/**
 * Manipula o clique no botão "Ver Detalhes Extras", busca os dados e atualiza a UI.
 * @async
 */
async function lidarCliqueDetalhesExtras() {
    const veiculo = minhaGaragem.getVeiculoSelecionado();
    if (!veiculo || !veiculo.id) {
        showNotification("Selecione um veículo primeiro.", "warning", 3000, ui);
        return;
    }

    // Verifica se os elementos da UI necessários existem
    if (!ui.detalhesExtrasVeiculoDiv || !ui.btnVerDetalhesExtras) {
        console.error("[Detalhes Extras] Erro: Elementos da UI (botão ou div) não encontrados.");
        showNotification("Erro interno na interface para detalhes extras.", "error", 4000, ui);
        return;
    }

    // --- Feedback de Carregamento ---
    ui.detalhesExtrasVeiculoDiv.innerHTML = `<p class="loading-feedback"><i class="fas fa-spinner fa-spin"></i> Carregando detalhes extras...</p>`;
    ui.detalhesExtrasVeiculoDiv.style.display = 'block'; // Mostra a div
    ui.btnVerDetalhesExtras.disabled = true; // Desabilita o botão
    // --- Fim Feedback ---

    // Chama a função assíncrona e espera o resultado
    const detalhes = await buscarDetalhesVeiculoAPI(veiculo.id);

    // --- Reabilita o botão ---
    // É importante reabilitar mesmo em caso de erro ou não encontrado
    if(ui.btnVerDetalhesExtras) ui.btnVerDetalhesExtras.disabled = false;
    // --- Fim Reabilitar ---

    // --- Processa e Exibe o Resultado ---
    if (detalhes && detalhes.erro) {
        // Erro durante a busca (tratado em buscarDetalhesVeiculoAPI)
        ui.detalhesExtrasVeiculoDiv.innerHTML = `<p class="error-feedback"><i class="fas fa-exclamation-triangle"></i> Erro: ${detalhes.mensagem}</p>`;
        console.error("[Detalhes Extras] Erro retornado pela busca:", detalhes.mensagem);

    } else if (detalhes) {
        // Detalhes encontrados com sucesso
        console.log("[Detalhes Extras] Exibindo detalhes.");
        // Formata o status do recall
        let recallStatus = detalhes.recallPendente
            ? `<span class="recall-pendente">Sim${detalhes.recallDescricao ? ` (${detalhes.recallDescricao})` : ''}</span>`
            : `<span class="recall-ok">Não</span>`;

        // Formata a data da última revisão (API) - com tratamento de erro
        let dataRevisaoFormatada = 'N/A';
        if (detalhes.ultimaRevisaoAPI) {
            try {
                // Adiciona T00:00:00 para tratar como data local sem fuso
                const dataObj = new Date(detalhes.ultimaRevisaoAPI + 'T00:00:00');
                if (!isNaN(dataObj)) { // Verifica se a data é válida
                     dataRevisaoFormatada = dataObj.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
                } else {
                    throw new Error("Data inválida após parse");
                }
            } catch (e) {
                console.warn("Erro ao formatar data da API:", detalhes.ultimaRevisaoAPI, e);
                dataRevisaoFormatada = 'Data Inválida';
            }
        }

        // Monta o HTML com os detalhes formatados
        ui.detalhesExtrasVeiculoDiv.innerHTML = `
            <p><i class="fas fa-dollar-sign"></i> <strong>Valor FIPE:</strong> ${detalhes.valorFipe ? detalhes.valorFipe.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A'}</p>
            <p><i class="fas fa-calendar-alt"></i> <strong>Última Revisão (API):</strong> ${dataRevisaoFormatada}</p>
            <p><i class="fas fa-exclamation-circle"></i> <strong>Recall Pendente:</strong> ${recallStatus}</p>
            <p><i class="fas fa-lightbulb"></i> <strong>Dica:</strong> ${detalhes.dicaManutencao || 'Nenhuma dica disponível.'}</p>
            <p><i class="fas fa-star"></i> <strong>Curiosidade:</strong> ${detalhes.fatoCurioso || '-'}</p>
        `;
    } else {
        // Veículo não encontrado na API simulada (retorno foi null)
        console.log("[Detalhes Extras] Veículo não encontrado na API simulada.");
        ui.detalhesExtrasVeiculoDiv.innerHTML = `<p class="notfound-feedback"><i class="fas fa-search"></i> Nenhum detalhe extra encontrado na 'API' para ${veiculo.modelo}.</p>`;
    }
    // --- Fim Processamento ---
}


// --- Inicialização da Aplicação ---

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Carregado. Iniciando Garagem Virtual V3 (API Sim)...");

    // Envolve a inicialização principal em try/catch para capturar erros graves
    try {
        // 1. Calcula Comprimento do Path do Velocímetro (se existir)
        const pathElement = document.querySelector('.velocimetro-progresso');
        if (pathElement && typeof pathElement.getTotalLength === 'function') {
            try {
                velocimetroPathLength = pathElement.getTotalLength();
                document.documentElement.style.setProperty('--velocimetro-path-length', velocimetroPathLength);
                console.log(`[Init] Comprimento path velocímetro: ${velocimetroPathLength.toFixed(2)}`);
            } catch (e) {
                 console.error("[Init] Erro ao calcular comprimento do path:", e);
                 document.documentElement.style.setProperty('--velocimetro-path-length', 251.2); // Fallback
            }
        } else {
            console.warn("[Init] Elemento .velocimetro-progresso não encontrado ou sem getTotalLength. Usando padrão.");
            document.documentElement.style.setProperty('--velocimetro-path-length', 251.2); // Fallback
        }

        // 2. Carrega Dados da Garagem (LocalStorage)
        const veiculosSalvos = Garagem.carregarDoLocalStorage();
        minhaGaragem.veiculos = veiculosSalvos;
        const idSelecionadoSalvo = localStorage.getItem('garagemVeiculoSelecionadoId');
        if (idSelecionadoSalvo && minhaGaragem.encontrarVeiculo(idSelecionadoSalvo)) {
            minhaGaragem.selecionarVeiculo(idSelecionadoSalvo); // Seleciona o salvo
        } else {
             minhaGaragem.selecionarVeiculo(null); // Limpa seleção
             if(idSelecionadoSalvo) localStorage.removeItem('garagemVeiculoSelecionadoId'); // Remove ID inválido
        }

        // 3. Configura Listeners de Eventos (com verificações de existência)
        if (ui.btnAbrirModalAdicionar && ui.modalAdicionar) {
            ui.btnAbrirModalAdicionar.addEventListener('click', () => {
                if(ui.formNovoVeiculo) ui.formNovoVeiculo.reset();
                if(ui.divCapacidadeCaminhao) ui.divCapacidadeCaminhao.style.display = 'none';
                if (!ui.modalAdicionar.open) {
                    try { ui.modalAdicionar.showModal(); } catch (e) { console.error("Erro ao abrir modal:", e); }
                }
            });
        } else { console.warn("[Init] Botão/Modal Adicionar não configurado."); }

        if (ui.btnFecharModalAdicionar && ui.modalAdicionar) {
            ui.btnFecharModalAdicionar.addEventListener('click', () => { if (ui.modalAdicionar.open) ui.modalAdicionar.close(); });
        }
        if (ui.modalAdicionar) {
            ui.modalAdicionar.addEventListener('click', (event) => { if (event.target === ui.modalAdicionar && ui.modalAdicionar.open) ui.modalAdicionar.close(); }); // Fechar ao clicar fora
        }

        if (ui.formNovoVeiculo) {
            ui.formNovoVeiculo.addEventListener('submit', adicionarNovoVeiculo);
        } else { console.error("[Init] Erro: Formulário #formNovoVeiculo não encontrado!"); }

        if (ui.novoVeiculoTipo && ui.divCapacidadeCaminhao) {
            ui.novoVeiculoTipo.addEventListener('change', (event) => {
                ui.divCapacidadeCaminhao.style.display = (event.target.value === 'Caminhao') ? 'block' : 'none';
            });
        } else { console.warn("[Init] Select Tipo Veículo ou Div Capacidade não configurados."); }

        if (ui.formManutencao) {
             ui.formManutencao.addEventListener('submit', agendarOuRegistrarManutencao);
        } else { console.warn("[Init] Formulário Manutenção não configurado."); }

        if (ui.tabLinks && ui.tabLinks.length > 0) {
            ui.tabLinks.forEach(button => {
                button.addEventListener('click', () => ativarTab(button.dataset.tab));
            });
        } else { console.warn("[Init] Links das Abas não configurados."); }

        if (ui.botoesAcoesContainer) {
            ui.botoesAcoesContainer.addEventListener('click', lidarComAcaoVeiculo);
        } else { console.warn("[Init] Container Botões Ações não configurado."); }

        if(ui.botaoRemoverVeiculoHeader) {
            ui.botaoRemoverVeiculoHeader.addEventListener('click', removerVeiculoSelecionado);
        } else { console.warn("[Init] Botão Remover Header não configurado."); }

        // Listeners para remoção em listas de manutenção
        const setupMaintenanceListListener = (ulElement) => {
             if (ulElement) {
                ulElement.addEventListener('click', lidarComCliqueListaManutencao);
             } else {
                 const id = ulElement === ui.historicoUl ? '#historicoManutencao .lista-itens' : '#agendamentosFuturos .lista-itens';
                 console.warn(`[Init] Lista de Manutenção (${id}) não configurada.`);
             }
        };
        setupMaintenanceListListener(ui.historicoUl);
        setupMaintenanceListListener(ui.agendamentosUl);


        if (ui.notificationCloseBtn) {
            ui.notificationCloseBtn.addEventListener('click', () => hideNotification(ui));
        } else { console.warn("[Init] Botão Fechar Notificação não configurado."); }

        // Listener para o botão de Detalhes Extras (API)
        if (ui.btnVerDetalhesExtras) {
            ui.btnVerDetalhesExtras.addEventListener('click', lidarCliqueDetalhesExtras);
            console.log("[Init] Listener para #btnVerDetalhesExtras adicionado.");
        } else {
            console.warn("[Init] Botão #btnVerDetalhesExtras não encontrado no DOM.");
        }

        // 4. Renderização Inicial da UI
        ativarTab('tab-visao-geral'); // Garante que a aba correta está ativa
        atualizarInterfaceCompleta(); // Exibe a lista e o painel (ou mensagem inicial)

        // 5. Verifica Agendamentos Próximos (com um pequeno delay)
        setTimeout(() => {
            try {
                const mensagensAgendamento = minhaGaragem.verificarAgendamentosProximos();
                if (mensagensAgendamento && mensagensAgendamento.length > 0) {
                    console.log(`[Init] ${mensagensAgendamento.length} agendamento(s) próximo(s) encontrado(s).`);
                    mensagensAgendamento.forEach((msg, index) => {
                        // Adiciona um delay entre múltiplas notificações de agendamento
                        setTimeout(() => showNotification(msg, 'info', 8000 + index * 500, ui), index * 700);
                    });
                } else {
                    console.log("[Init] Nenhum agendamento próximo.");
                }
            } catch(error) {
                console.error("[Init] Erro ao verificar/mostrar agendamentos próximos:", error);
            }
        }, 1500); // Delay para não sobrecarregar logo no início

        console.log("✅ Garagem Virtual inicializada e pronta!");

    } catch (error) {
        // Captura erros graves durante a inicialização
        console.error("❌===== ERRO CRÍTICO NA INICIALIZAÇÃO DA APLICAÇÃO =====", error);
        alert("Ocorreu um erro grave ao iniciar a Garagem Virtual. A aplicação pode não funcionar corretamente. Verifique o console (F12) para detalhes técnicos.");
        // Opcional: Exibe mensagem de erro na página
        const body = document.querySelector('body');
        if (body) {
            body.innerHTML = `<div style="padding: 20px; margin: 20px; background-color: #ffdddd; border: 2px solid red; color: #a02533; text-align: center; font-family: sans-serif;">
                                <h1>Erro na Aplicação</h1>
                                <p>Não foi possível carregar a Garagem Virtual corretamente.</p>
                                <p><strong>Detalhes do Erro:</strong> ${error.message}</p>
                                <p><em>Verifique o console do navegador (F12) para mais informações.</em></p>
                              </div>`;
        }
    }
});