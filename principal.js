'use strict';

// --- Constantes e Configuração ---
const backendUrl = 'http://localhost:3001';

// --- Referências aos Elementos da UI ---
const ui = {
    // Notificações
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

    // Listas e Painéis
    listaVeiculosSidebar: document.getElementById('listaVeiculosSidebar'),
    painelVeiculoSelecionado: document.getElementById('painelVeiculoSelecionado'),
    mensagemSelecione: document.getElementById('mensagem-selecione'),

    // Detalhes do Veículo Selecionado
    infoModeloPlaca: document.getElementById('info-modelo-placa'),
    infoMarca: document.getElementById('info-marca'),
    infoCor: document.getElementById('info-cor'),
    infoAno: document.getElementById('info-ano'),
    infoId: document.getElementById('info-id'),
    botaoRemoverHeader: document.getElementById('botaoRemoverHeader'),
};

// --- Funções Auxiliares ---

/**
 * Exibe uma notificação na tela.
 * @param {string} message - A mensagem a ser exibida.
 * @param {'success'|'error'|'info'|'warning'} type - O tipo de notificação.
 * @param {number} duration - Duração em milissegundos para a notificação ficar visível.
 */
function showNotification(message, type = 'info', duration = 4000) {
    ui.notificationMessage.textContent = message;
    ui.notificationArea.className = 'show'; // Remove classes antigas
    ui.notificationArea.classList.add(type);

    setTimeout(() => {
        ui.notificationArea.classList.remove('show');
    }, duration);
}

// --- Funções de API e UI ---

/**
 * Busca todos os veículos do backend e atualiza a lista na sidebar.
 */
async function carregarEExibirVeiculos() {
    try {
        const response = await fetch(`${backendUrl}/api/veiculos`);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Falha ao buscar veículos do servidor.');
        }
        const veiculos = await response.json();
        atualizarListaVeiculosSidebar(veiculos);
    } catch (error) {
        showNotification(error.message, "error");
        ui.listaVeiculosSidebar.innerHTML = '<li class="placeholder error">Erro ao carregar. Tente recarregar.</li>';
    }
}

/**
 * Renderiza a lista de veículos na barra lateral com botões de ação.
 * @param {Array<object>} veiculos - A lista de veículos vinda da API.
 */
function atualizarListaVeiculosSidebar(veiculos) {
    ui.listaVeiculosSidebar.innerHTML = ''; 

    if (!veiculos || veiculos.length === 0) {
        ui.listaVeiculosSidebar.innerHTML = '<li class="placeholder">Nenhum veículo adicionado.</li>';
        return;
    }

    veiculos.forEach(veiculo => {
        const li = document.createElement('li');
        li.className = 'veiculo-item';
        li.dataset.id = veiculo._id;

        li.innerHTML = `
            <div class="veiculo-info" title="Selecionar ${veiculo.modelo}">
                <i class="fas fa-car"></i>
                <span>${veiculo.modelo} (${veiculo.placa})</span>
            </div>
            <div class="veiculo-actions">
                <button class="btn-action btn-edit" data-id="${veiculo._id}" title="Editar ${veiculo.modelo}">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        `;
        ui.listaVeiculosSidebar.appendChild(li);
    });
}

/**
 * Exibe os detalhes de um veículo no painel principal.
 * @param {string} veiculoId - O ID do veículo a ser exibido.
 */
async function selecionarEExibirVeiculo(veiculoId) {
    try {
        const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}`);
        if (!response.ok) {
            throw new Error('Veículo não encontrado ou erro no servidor.');
        }
        const veiculo = await response.json();

        ui.painelVeiculoSelecionado.style.display = 'block';
        ui.mensagemSelecione.style.display = 'none';

        // Atualiza as informações básicas
        ui.infoModeloPlaca.textContent = `${veiculo.modelo} (${veiculo.placa})`;
        ui.infoMarca.textContent = veiculo.marca;
        ui.infoCor.textContent = veiculo.cor;
        ui.infoAno.textContent = veiculo.ano;
        ui.infoId.textContent = veiculo._id;

        // Associa o ID ao botão de remover do header
        ui.botaoRemoverHeader.dataset.id = veiculo._id;
        
        // Marca o item como selecionado na lista
        document.querySelectorAll('.veiculo-item').forEach(item => item.classList.remove('selecionado'));
        const itemSelecionado = document.querySelector(`.veiculo-item[data-id="${veiculoId}"]`);
        if(itemSelecionado) itemSelecionado.classList.add('selecionado');

    } catch (error) {
        showNotification(error.message, 'error');
        ui.painelVeiculoSelecionado.style.display = 'none';
        ui.mensagemSelecione.style.display = 'block';
    }
}

// --- Funções de Manipulação de Formulários (Handlers) ---

/**
 * Lida com o envio do formulário para adicionar um novo veículo.
 */
async function handleAdicionarVeiculo(event) {
    event.preventDefault();
    const formData = new FormData(ui.formNovoVeiculo);
    const veiculoData = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${backendUrl}/api/veiculos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(veiculoData),
        });
        const resultado = await response.json();
        if (!response.ok) throw new Error(resultado.message || `Erro ${response.status}`);

        showNotification(`Veículo ${resultado.modelo} adicionado com sucesso!`, 'success');
        ui.formNovoVeiculo.reset();
        ui.modalAdicionar.close();
        await carregarEExibirVeiculos();
    } catch (error) {
        showNotification(`Falha ao adicionar: ${error.message}`, 'error');
    }
}

/**
 * Abre o modal de edição e preenche com os dados do veículo.
 */
async function abrirModalDeEdicao(veiculoId) {
    try {
        const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}`);
        if (!response.ok) throw new Error('Não foi possível carregar os dados para edição.');
        
        const veiculo = await response.json();
        ui.editVeiculoId.value = veiculo._id;
        ui.editVeiculoPlaca.value = veiculo.placa;
        ui.editVeiculoMarca.value = veiculo.marca;
        ui.editVeiculoModelo.value = veiculo.modelo;
        ui.editVeiculoAno.value = veiculo.ano;
        ui.editVeiculoCor.value = veiculo.cor;

        ui.modalEditar.showModal();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

/**
 * Lida com o envio do formulário de edição para atualizar um veículo.
 */
async function handleEditarVeiculo(event) {
    event.preventDefault();
    const veiculoId = ui.editVeiculoId.value;
    const formData = new FormData(ui.formEditarVeiculo);
    const veiculoData = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(veiculoData),
        });
        const resultado = await response.json();
        if (!response.ok) throw new Error(resultado.message || `Erro ${response.status}`);

        showNotification(`Veículo ${resultado.modelo} atualizado com sucesso!`, 'success');
        ui.modalEditar.close();
        await carregarEExibirVeiculos();
        
        // Se o veículo editado é o que está sendo exibido, atualiza o painel
        const painelMostrandoId = document.querySelector('.veiculo-item.selecionado')?.dataset.id;
        if(painelMostrandoId === veiculoId) {
            await selecionarEExibirVeiculo(veiculoId);
        }

    } catch (error) {
        showNotification(`Falha ao atualizar: ${error.message}`, 'error');
    }
}

/**
 * Deleta um veículo após confirmação.
 */
async function handleDeletarVeiculo(veiculoId) {
    if (confirm("Você tem certeza que deseja excluir este veículo? Esta ação é irreversível.")) {
        try {
            const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}`, {
                method: 'DELETE',
            });
            const resultado = await response.json();
            if (!response.ok) throw new Error(resultado.message || `Erro ${response.status}`);

            showNotification(resultado.message, 'success');
            
            // Se o veículo removido estava selecionado, volta para a tela inicial
            const painelMostrandoId = ui.botaoRemoverHeader.dataset.id;
            if (painelMostrandoId === veiculoId) {
                 ui.painelVeiculoSelecionado.style.display = 'none';
                 ui.mensagemSelecione.style.display = 'block';
            }
            await carregarEExibirVeiculos();

        } catch (error) {
            showNotification(`Falha ao excluir: ${error.message}`, 'error');
        }
    }
}

// --- Inicialização e Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    carregarEExibirVeiculos();

    // Modais
    ui.btnAbrirModalAdicionar.addEventListener('click', () => ui.modalAdicionar.showModal());
    ui.btnFecharModalAdicionar.addEventListener('click', () => ui.modalAdicionar.close());
    ui.btnFecharModalEditar.addEventListener('click', () => ui.modalEditar.close());
    ui.notificationCloseBtn.addEventListener('click', () => ui.notificationArea.classList.remove('show'));

    // Formulários
    ui.formNovoVeiculo.addEventListener('submit', handleAdicionarVeiculo);
    ui.formEditarVeiculo.addEventListener('submit', handleEditarVeiculo);
    
    // Delegação de eventos na lista da sidebar
    ui.listaVeiculosSidebar.addEventListener('click', (event) => {
        const target = event.target;
        const veiculoItem = target.closest('.veiculo-item');
        const editButton = target.closest('.btn-edit');
        const veiculoInfo = target.closest('.veiculo-info');

        if (editButton) {
            abrirModalDeEdicao(editButton.dataset.id);
        } else if (veiculoInfo && veiculoItem) {
            selecionarEExibirVeiculo(veiculoItem.dataset.id);
        }
    });

    // Botão de remover no header do painel
    ui.botaoRemoverHeader.addEventListener('click', (event) => {
        const veiculoId = event.currentTarget.dataset.id;
        if (veiculoId) {
            handleDeletarVeiculo(veiculoId);
        }
    });

    console.log("✅ Aplicação CRUD da Garagem Inteligente inicializada!");
});

// Adiciona estilos dinâmicos para os botões de ação na lista
const extraStyles = `
    .veiculo-item {
        display: flex; justify-content: space-between; align-items: center;
    }
    .veiculo-info {
        flex-grow: 1; cursor: pointer; display: flex; align-items: center; gap: 10px; padding: 10px 0;
    }
    .veiculo-actions { display: flex; opacity: 0; transition: opacity 0.2s ease; }
    .veiculo-item:hover .veiculo-actions { opacity: 1; }
    .btn-action {
        background: transparent; border: none; cursor: pointer; font-size: 1rem;
        padding: 5px; margin: 0; color: var(--cor-secundaria);
    }
    .veiculo-item.selecionado .btn-action { color: var(--cor-texto-claro); }
    .btn-action:hover { background-color: rgba(0,0,0,0.1); border-radius: 4px; }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = extraStyles;
document.head.appendChild(styleSheet);