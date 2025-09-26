'use strict';

// --- Constantes e Configuração ---
const backendUrl = 'http://localhost:3001';
const VELOCIDADE_MAXIMA_GAUGE = 220; 

// --- Referências aos Elementos da UI ---
const ui = {
    notificationArea: document.getElementById('notification-area'),
    notificationMessage: document.getElementById('notification-message'),
    notificationCloseBtn: document.querySelector('#notification-area .close-btn'),
    modalAdicionar: document.getElementById('modalAdicionarVeiculo'),
    modalEditar: document.getElementById('modalEditarVeiculo'),
    btnAbrirModalAdicionar: document.getElementById('btnAbrirModalAdicionar'),
    btnFecharModalAdicionar: document.getElementById('btnFecharModalAdicionar'),
    btnFecharModalEditar: document.getElementById('btnFecharModalEditar'),
    formNovoVeiculo: document.getElementById('formNovoVeiculo'),
    formEditarVeiculo: document.getElementById('formEditarVeiculo'),
    editVeiculoId: document.getElementById('editVeiculoId'),
    editVeiculoPlaca: document.getElementById('editVeiculoPlaca'),
    editVeiculoMarca: document.getElementById('editVeiculoMarca'),
    editVeiculoModelo: document.getElementById('editVeiculoModelo'),
    editVeiculoAno: document.getElementById('editVeiculoAno'),
    editVeiculoCor: document.getElementById('editVeiculoCor'),
    listaVeiculosSidebar: document.getElementById('listaVeiculosSidebar'),
    painelVeiculoSelecionado: document.getElementById('painelVeiculoSelecionado'),
    mensagemSelecione: document.getElementById('mensagem-selecione'),
    infoModeloPlaca: document.getElementById('info-modelo-placa'),
    infoMarca: document.getElementById('info-marca'),
    infoCor: document.getElementById('info-cor'),
    infoAno: document.getElementById('info-ano'),
    infoId: document.getElementById('info-id'),
    botaoRemoverHeader: document.getElementById('botaoRemoverHeader'),
    painelDeControle: document.getElementById('painelDeControle'),
    infoStatusMotor: document.getElementById('info-status-motor'),
    velocimetroProgresso: document.getElementById('velocimetro-progresso'),
    velocimetroTexto: document.getElementById('velocimetro-texto'),
    botaoLigarDesligar: document.getElementById('botaoLigarDesligar'),
    botaoAcelerar: document.getElementById('botaoAcelerar'),
    botaoFrear: document.getElementById('botaoFrear'),
    formNovaManutencao: document.getElementById('formNovaManutencao'),
    manutencaoVeiculoIdInput: document.getElementById('manutencaoVeiculoId'),
    listaManutencoes: document.getElementById('listaManutencoesVeiculo'),
    // <-- ADICIONADOS PARA AUTENTICAÇÃO -->
    authContainer: document.getElementById('auth-container'),
    appContainer: document.getElementById('app-container'),
    formLogin: document.getElementById('formLogin'),
    formRegister: document.getElementById('formRegister'),
    btnLogout: document.getElementById('btnLogout'),
};

// --- Funções Auxiliares ---
function showNotification(message, type = 'info', duration = 4000) {
    ui.notificationMessage.textContent = message;
    ui.notificationArea.className = 'show';
    ui.notificationArea.classList.add(type);
    setTimeout(() => ui.notificationArea.classList.remove('show'), duration);
}

// <-- ALTERAÇÃO IMPORTANTE: Função para pegar headers com token -->
function getAuthHeaders() {
    const token = localStorage.getItem('garagemToken');
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// --- Funções de Autenticação (NOVAS) ---
async function handleRegister(event) {
    event.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`${backendUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        showNotification(data.message, 'success');
        ui.formRegister.reset();
        document.getElementById('loginEmail').value = email;
    } catch (error) {
        showNotification(`Falha no registro: ${error.message}`, 'error');
        console.error("Erro no registro:", error);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${backendUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        localStorage.setItem('garagemToken', data.token);
        showNotification(data.message, 'success');
        checkLoginState();
    } catch (error) {
        showNotification(`Falha no login: ${error.message}`, 'error');
        console.error("Erro no login:", error);
    }
}

function handleLogout() {
    localStorage.removeItem('garagemToken');
    showNotification('Você saiu da sua conta.', 'info');
    checkLoginState();
}

// --- Função de Gerenciamento de Estado da UI (NOVA) ---
function checkLoginState() {
    const token = localStorage.getItem('garagemToken');
    if (token) {
        ui.authContainer.style.display = 'none';
        ui.appContainer.style.display = 'flex';
        carregarEExibirVeiculos();
    } else {
        ui.authContainer.style.display = 'block';
        ui.appContainer.style.display = 'none';
        ui.listaVeiculosSidebar.innerHTML = '<li class="placeholder">Faça login para ver seus veículos.</li>';
        ui.painelVeiculoSelecionado.style.display = 'none';
        ui.mensagemSelecione.style.display = 'block';
    }
}

// --- Funções de API e UI (Veículos) - AGORA COM TOKEN ---

async function carregarEExibirVeiculos() {
    try {
        const response = await fetch(`${backendUrl}/api/veiculos`, {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
             handleLogout();
             showNotification('Sua sessão expirou. Faça login novamente.', 'warning');
             return;
        }
        
        if (!response.ok) throw new Error((await response.json()).message || 'Falha ao buscar veículos.');
        const veiculos = await response.json();
        atualizarListaVeiculosSidebar(veiculos);
    } catch (error) {
        showNotification(error.message, "error");
        ui.listaVeiculosSidebar.innerHTML = '<li class="placeholder error">Erro ao carregar.</li>';
    }
}

function atualizarListaVeiculosSidebar(veiculos) {
    ui.listaVeiculosSidebar.innerHTML = '';
    if (!veiculos || veiculos.length === 0) {
        ui.listaVeiculosSidebar.innerHTML = '<li class="placeholder">Nenhum veículo adicionado.</li>';
        return;
    }
    veiculos.forEach(veiculo => {
        const li = document.createElement('li');
        li.dataset.id = veiculo._id;
        li.innerHTML = `
            <i class="fas fa-car"></i>
            <span>${veiculo.modelo} (${veiculo.placa})</span>
            <button class="botao-remover-item" title="Excluir ${veiculo.modelo}"><i class="fas fa-trash-alt"></i></button>
        `;
        ui.listaVeiculosSidebar.appendChild(li);
    });
}

async function selecionarEExibirVeiculo(veiculoId) {
    try {
        const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Veículo não encontrado.');
        const veiculo = await response.json();

        //... (lógica para exibir os detalhes do veículo)
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function handleAdicionarVeiculo(event) {
    event.preventDefault();
    const veiculoData = Object.fromEntries(new FormData(ui.formNovoVeiculo).entries());
    try {
        const response = await fetch(`${backendUrl}/api/veiculos`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(veiculoData),
        });
        const resultado = await response.json();
        if (!response.ok) throw new Error(resultado.message || `Erro ${response.status}`);
        showNotification(`Veículo ${resultado.modelo} adicionado!`, 'success');
        ui.formNovoVeiculo.reset();
        ui.modalAdicionar.close();
        await carregarEExibirVeiculos();
    } catch (error) {
        showNotification(`Falha ao adicionar: ${error.message}`, 'error');
    }
}

// <-- FUNÇÃO CORRIGIDA E COMPLETA -->
async function handleDeletarVeiculo(veiculoId) {
    if (confirm("Tem certeza que deseja excluir este veículo e todo o seu histórico?")) {
        try {
            const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}`, {
                method: 'DELETE',
                headers: getAuthHeaders() // Envia o token para autorização
            });
            
            const resultado = await response.json();
            if (!response.ok) {
                throw new Error(resultado.message || `Erro ${response.status}`);
            }

            showNotification(resultado.message, 'success');

            // Se o veículo deletado era o que estava selecionado, limpa o painel
            if (ui.botaoRemoverHeader.dataset.id === veiculoId) {
                ui.painelVeiculoSelecionado.style.display = 'none';
                ui.mensagemSelecione.style.display = 'block';
            }
            // Atualiza a lista na sidebar
            await carregarEExibirVeiculos();

        } catch (error) {
            showNotification(`Falha ao excluir: ${error.message}`, 'error');
            console.error("Erro ao deletar:", error);
        }
    }
}


// --- Inicialização e Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Listeners de Autenticação
    ui.formLogin.addEventListener('submit', handleLogin);
    ui.formRegister.addEventListener('submit', handleRegister);
    ui.btnLogout.addEventListener('click', handleLogout);

    // Listeners dos Modais
    ui.btnAbrirModalAdicionar.addEventListener('click', () => ui.modalAdicionar.showModal());
    ui.btnFecharModalAdicionar.addEventListener('click', () => ui.modalAdicionar.close());
    ui.btnFecharModalEditar.addEventListener('click', () => ui.modalEditar.close());
    ui.notificationCloseBtn.addEventListener('click', () => ui.notificationArea.classList.remove('show'));

    // Listeners de Formulários
    ui.formNovoVeiculo.addEventListener('submit', handleAdicionarVeiculo);
    // Adicione aqui os outros listeners que você tinha: formEditarVeiculo, formNovaManutencao, etc.

    // Listener da Lista de Veículos (Sidebar)
    ui.listaVeiculosSidebar.addEventListener('click', (event) => {
        const veiculoLi = event.target.closest('li');
        if (!veiculoLi || !veiculoLi.dataset.id) return;

        const veiculoId = veiculoLi.dataset.id;
        
        // Verifica se o clique foi no botão de remover
        if (event.target.closest('.botao-remover-item')) {
            handleDeletarVeiculo(veiculoId);
        } else {
            // Se não foi no botão de remover, seleciona o veículo
            selecionarEExibirVeiculo(veiculoId);
        }
    });

    // Outros listeners de botões de ação
    ui.botaoRemoverHeader.addEventListener('click', (e) => handleDeletarVeiculo(e.currentTarget.dataset.id));
    // Adicione aqui os listeners para Ligar/Desligar, Acelerar, Frear, etc.

    // Verifica o estado de login assim que a página carrega
    checkLoginState();

    console.log("✅ Garagem Inteligente inicializada!");
});

// Inclua aqui o resto das suas funções (abrirModalDeEdicao, handleEditarVeiculo, executarAcaoVeiculo, etc.),
// lembrando-se sempre de adicionar `{ headers: getAuthHeaders() }` em todas as chamadas `fetch`.