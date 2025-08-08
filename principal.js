// js/principal.js
'use strict';

// Supondo que você tenha este arquivo. Se não, a função de fallback será usada.
import { showNotification } from './utils/notifications.js';

// --- Constantes ---
const backendUrl = 'http://localhost:3001';

// --- Referências aos Elementos da UI ---
const ui = {
    // CORREÇÃO: Adicionar os elementos de notificação aqui
    notificationArea: document.getElementById('notification-area'),
    notificationMessage: document.getElementById('notification-message'),
    notificationCloseBtn: document.querySelector('#notification-area .close-btn'),
    
    // Modais
    modalAdicionar: document.getElementById('modalAdicionarVeiculo'),
    modalEditar: document.getElementById('modalEditarVeiculo'),

    // Botões de Modal
    btnAbrirModalAdicionar: document.getElementById('btnAbrirModalAdicionar'),
    btnFecharModalAdicionar: document.getElementById('btnFecharModalAdicionar'),
    btnFecharModalEditar: document.getElementById('btnFecharModalEditar'),

    // Formulários
    formNovoVeiculo: document.getElementById('formNovoVeiculo'),
    formEditarVeiculo: document.getElementById('formEditarVeiculo'),
    
    // Campos do formulário de Edição
    editVeiculoId: document.getElementById('editVeiculoId'),
    editVeiculoPlaca: document.getElementById('editVeiculoPlaca'),
    editVeiculoMarca: document.getElementById('editVeiculoMarca'),
    editVeiculoModelo: document.getElementById('editVeiculoModelo'),
    editVeiculoAno: document.getElementById('editVeiculoAno'),
    editVeiculoCor: document.getElementById('editVeiculoCor'),

    // Lista e Painéis
    listaVeiculosSidebar: document.getElementById('listaVeiculosSidebar'),
    painelVeiculoSelecionado: document.getElementById('painelVeiculoSelecionado'),
    mensagemSelecione: document.getElementById('mensagem-selecione'),

    // Detalhes do Veículo Selecionado
    infoModeloPlaca: document.getElementById('info-modelo-placa'),
    infoMarca: document.getElementById('info-marca'),
    infoCor: document.getElementById('info-cor'),
    infoAno: document.getElementById('info-ano'),
    infoId: document.getElementById('info-id'),
};


// O RESTANTE DO SEU ARQUIVO principal.js PODE PERMANECER O MESMO
// Vou colar ele inteiro por garantia.

// --- Funções de API ---

/**
 * Busca todos os veículos do backend e atualiza a UI.
 */
async function carregarEExibirVeiculos() {
    try {
        const response = await fetch(`${backendUrl}/api/veiculos`);
        if (!response.ok) {
            throw new Error('Falha ao buscar veículos do servidor.');
        }
        const veiculos = await response.json();
        atualizarListaVeiculosSidebar(veiculos);
    } catch (error) {
        console.error("Erro ao carregar veículos:", error);
        showNotification("Não foi possível carregar os veículos da garagem.", "error", 5000, ui);
        ui.listaVeiculosSidebar.innerHTML = '<li class="placeholder" style="color:red;">Erro ao carregar. Tente recarregar a página.</li>';
    }
}

/**
 * Atualiza a lista de veículos na barra lateral, adicionando botões de ação.
 * @param {Array} veiculos - A lista de veículos vinda do backend.
 */
function atualizarListaVeiculosSidebar(veiculos) {
    const listaUl = ui.listaVeiculosSidebar;
    listaUl.innerHTML = ''; 

    if (!veiculos || veiculos.length === 0) {
        listaUl.innerHTML = '<li class="placeholder">Nenhum veículo na garagem.</li>';
        return;
    }

    veiculos.sort((a, b) => a.modelo.localeCompare(b.modelo));

    veiculos.forEach(veiculo => {
        const li = document.createElement('li');
        li.className = 'veiculo-item';
        li.dataset.id = veiculo._id;

        li.innerHTML = `
            <div class="veiculo-info" data-id="${veiculo._id}">
                <i class="fas fa-car"></i>
                <span>${veiculo.modelo} (${veiculo.placa})</span>
            </div>
            <div class="veiculo-actions">
                <button class="btn-action btn-edit" data-id="${veiculo._id}" title="Editar Veículo">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action btn-delete" data-id="${veiculo._id}" title="Excluir Veículo">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        listaUl.appendChild(li);
    });
}

/**
 * Exibe os detalhes de um veículo selecionado no painel principal.
 * @param {string} veiculoId O ID do veículo a ser exibido.
 */
async function exibirDetalhesVeiculo(veiculoId) {
    try {
        const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}`);
        if (!response.ok) {
            throw new Error('Veículo não encontrado ou erro no servidor.');
        }
        const veiculo = await response.json();

        ui.painelVeiculoSelecionado.style.display = 'block';
        ui.mensagemSelecione.style.display = 'none';

        ui.infoModeloPlaca.textContent = `${veiculo.modelo} (${veiculo.placa})`;
        ui.infoMarca.textContent = veiculo.marca;
        ui.infoCor.textContent = veiculo.cor;
        ui.infoAno.textContent = veiculo.ano;
        ui.infoId.textContent = veiculo._id;
        
        document.querySelectorAll('.veiculo-item').forEach(item => item.classList.remove('selecionado'));
        document.querySelector(`.veiculo-item[data-id="${veiculoId}"]`).classList.add('selecionado');

    } catch (error) {
        console.error("Erro ao exibir detalhes:", error);
        showNotification(error.message, 'error', 4000, ui);
        ui.painelVeiculoSelecionado.style.display = 'none';
        ui.mensagemSelecione.style.display = 'block';
    }
}

// --- Funções de Manipulação de Eventos ---

/**
 * Lida com o envio do formulário para adicionar um novo veículo.
 * @param {Event} event O evento de submit do formulário.
 */
async function handleAdicionarVeiculo(event) {
    event.preventDefault();
    const formData = new FormData(ui.formNovoVeiculo);

    const veiculoData = {
        placa: (formData.get('placa') ?? '').trim(),
        marca: (formData.get('marca') ?? '').trim(),
        modelo: (formData.get('modelo') ?? '').trim(),
        ano: parseInt(formData.get('ano') ?? '0', 10),
        cor: (formData.get('cor') ?? '').trim(),
    };

    try {
        const response = await fetch(`${backendUrl}/api/veiculos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(veiculoData),
        });
        const resultado = await response.json();
        if (!response.ok) throw new Error(resultado.message || `Erro ${response.status}`);

        showNotification(`Veículo ${resultado.modelo} adicionado com sucesso!`, 'success', 3000, ui);
        ui.formNovoVeiculo.reset();
        ui.modalAdicionar.close();
        await carregarEExibirVeiculos();
    } catch (error) {
        showNotification(`Falha ao adicionar: ${error.message}`, 'error', 5000, ui);
    }
}

/**
 * Abre o modal de edição e preenche com os dados do veículo.
 * @param {string} veiculoId O ID do veículo a ser editado.
 */
async function abrirModalDeEdicao(veiculoId) {
    try {
        const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}`);
        if (!response.ok) throw new Error('Não foi possível carregar os dados do veículo para edição.');
        
        const veiculo = await response.json();

        ui.editVeiculoId.value = veiculo._id;
        ui.editVeiculoPlaca.value = veiculo.placa;
        ui.editVeiculoMarca.value = veiculo.marca;
        ui.editVeiculoModelo.value = veiculo.modelo;
        ui.editVeiculoAno.value = veiculo.ano;
        ui.editVeiculoCor.value = veiculo.cor;

        ui.modalEditar.showModal();
    } catch (error) {
        showNotification(error.message, 'error', 4000, ui);
    }
}

/**
 * Lida com o envio do formulário de edição para atualizar um veículo.
 * @param {Event} event O evento de submit do formulário.
 */
async function handleEditarVeiculo(event) {
    event.preventDefault();
    const veiculoId = ui.editVeiculoId.value;

    const veiculoData = {
        placa: ui.editVeiculoPlaca.value.trim(),
        marca: ui.editVeiculoMarca.value.trim(),
        modelo: ui.editVeiculoModelo.value.trim(),
        ano: parseInt(ui.editVeiculoAno.value, 10),
        cor: ui.editVeiculoCor.value.trim(),
    };

    try {
        const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(veiculoData),
        });
        const resultado = await response.json();
        if (!response.ok) throw new Error(resultado.message || `Erro ${response.status}`);

        showNotification(`Veículo ${resultado.modelo} atualizado com sucesso!`, 'success', 3000, ui);
        ui.modalEditar.close();
        await carregarEExibirVeiculos();
        
        const painelMostrandoId = document.querySelector('.veiculo-item.selecionado')?.dataset.id;
        if(painelMostrandoId === veiculoId) {
            await exibirDetalhesVeiculo(veiculoId);
        }

    } catch (error) {
        showNotification(`Falha ao atualizar: ${error.message}`, 'error', 5000, ui);
    }
}

/**
 * Deleta um veículo após confirmação do usuário.
 * @param {string} veiculoId O ID do veículo a ser deletado.
 */
async function handleDeletarVeiculo(veiculoId) {
    if (confirm("Você tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.")) {
        try {
            const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}`, {
                method: 'DELETE',
            });
            const resultado = await response.json();
            if (!response.ok) throw new Error(resultado.message || `Erro ${response.status}`);

            showNotification(resultado.message, 'success', 4000, ui);
            
            const painelMostrandoId = document.querySelector('.veiculo-item.selecionado')?.dataset.id;
            if (painelMostrandoId === veiculoId) {
                 ui.painelVeiculoSelecionado.style.display = 'none';
                 ui.mensagemSelecione.style.display = 'block';
            }

            await carregarEExibirVeiculos();
        } catch (error) {
            showNotification(`Falha ao excluir: ${error.message}`, 'error', 5000, ui);
        }
    }
}

// --- Inicialização e Event Listeners Globais ---
document.addEventListener('DOMContentLoaded', () => {
    carregarEExibirVeiculos();

    ui.btnAbrirModalAdicionar.addEventListener('click', () => ui.modalAdicionar.showModal());

    ui.btnFecharModalAdicionar.addEventListener('click', () => ui.modalAdicionar.close());
    ui.btnFecharModalEditar.addEventListener('click', () => ui.modalEditar.close());

    ui.formNovoVeiculo.addEventListener('submit', handleAdicionarVeiculo);
    ui.formEditarVeiculo.addEventListener('submit', handleEditarVeiculo);
    
    ui.listaVeiculosSidebar.addEventListener('click', (event) => {
        const target = event.target;
        const veiculoId = target.closest('[data-id]')?.dataset.id;

        if (!veiculoId) return;

        if (target.closest('.btn-edit')) {
            abrirModalDeEdicao(veiculoId);
        } else if (target.closest('.btn-delete')) {
            handleDeletarVeiculo(veiculoId);
        } else if (target.closest('.veiculo-info')) {
            exibirDetalhesVeiculo(veiculoId);
        }
    });

    console.log("✅ Aplicação CRUD da Garagem Inteligente inicializada!");
});

// Fornecendo uma implementação de fallback para showNotification, caso não exista
if (typeof showNotification === 'undefined') {
    window.showNotification = (message, type = 'info', duration = 3000, uiRef) => {
        if (uiRef && uiRef.notificationArea && uiRef.notificationMessage) {
            uiRef.notificationMessage.textContent = message;
            uiRef.notificationArea.className = `notification show ${type}`;
            setTimeout(() => {
                 if (uiRef.notificationArea) {
                    uiRef.notificationArea.classList.remove('show');
                 }
            }, duration);
        } else {
            console.warn("showNotification: Elementos de notificação não encontrados no objeto UI. Usando alert().");
            alert(`[${type.toUpperCase()}] ${message}`);
        }
    };
}


// A injeção de estilos permanece a mesma
const extraStyles = `
    .veiculo-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 18px;
        cursor: default;
        border-bottom: 1px solid var(--cor-borda);
        transition: background-color 0.2s ease;
    }
    .veiculo-item .veiculo-info {
        cursor: pointer;
    }
    .veiculo-item:hover {
        background-color: #e9ecef;
    }
    .veiculo-item.selecionado {
        background-color: var(--cor-primaria);
        color: var(--cor-texto-claro);
    }
    .veiculo-item.selecionado .veiculo-info i {
         color: var(--cor-texto-claro);
    }
    .veiculo-info {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-grow: 1;
    }
    .veiculo-actions {
        display: flex;
        gap: 8px;
        opacity: 0;
        transition: opacity 0.2s ease;
    }
    .veiculo-item:hover .veiculo-actions {
        opacity: 1;
    }
    .btn-action {
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        padding: 4px;
        margin: 0;
        color: var(--cor-secundaria);
        border-radius: 4px;
    }
    .veiculo-item.selecionado .btn-action {
        color: var(--cor-texto-claro);
    }
    .btn-action:hover {
        background-color: rgba(0,0,0,0.1);
    }
    .btn-action.btn-delete:hover {
        color: var(--cor-perigo);
    }
    #listaVeiculosSidebar {
        padding: 0;
        margin: 0;
    }
    .info-id-text {
        font-size: 0.8em;
        word-break: break-all;
    }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = extraStyles;
document.head.appendChild(styleSheet);