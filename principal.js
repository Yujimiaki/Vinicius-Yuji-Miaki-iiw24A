'use strict';

// --- Constantes e Configuração ---
const backendUrl = 'http://localhost:3001';
const VELOCIDADE_MAXIMA_GAUGE = 220;
// ===================================================================
//  COLE SUA CHAVE DA API OPENWEATHER AQUI
//  Obtenha em: https://openweathermap.org/appid
// ===================================================================
const OPENWEATHER_API_KEY = 'SUA_CHAVE_API_AQUI'; 

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
    editVeiculoTipo: document.getElementById('editVeiculoTipo'), // Campo tipo para editar
    listaVeiculosSidebar: document.getElementById('listaVeiculosSidebar'),
    painelVeiculoSelecionado: document.getElementById('painelVeiculoSelecionado'),
    mensagemSelecione: document.getElementById('mensagem-selecione'),
    infoModeloPlaca: document.getElementById('info-modelo-placa'),
    infoTipo: document.getElementById('info-tipo'), // Campo para exibir o tipo
    infoMarca: document.getElementById('info-marca'),
    infoCor: document.getElementById('info-cor'),
    infoAno: document.getElementById('info-ano'),
    infoId: document.getElementById('info-id'),
    botaoRemoverHeader: document.getElementById('botaoRemoverHeader'),
    botaoEditarHeader: document.getElementById('botaoEditarHeader'),
    authContainer: document.getElementById('auth-container'),
    appContainer: document.getElementById('app-container'),
    formLogin: document.getElementById('formLogin'),
    formRegister: document.getElementById('formRegister'),
    btnLogout: document.getElementById('btnLogout'),
    painelDeControle: document.getElementById('painelDeControle'),
    infoStatusMotor: document.getElementById('info-status-motor'),
    velocimetroProgresso: document.getElementById('velocimetro-progresso'),
    velocimetroTexto: document.getElementById('velocimetro-texto'),
    botoesAcoes: document.getElementById('botoesAcoes'),
    botaoLigarDesligar: document.getElementById('botaoLigarDesligar'),
    botaoAcelerar: document.getElementById('botaoAcelerar'),
    botaoFrear: document.getElementById('botaoFrear'),
    tabs: document.querySelectorAll('.tab-link'),
    tabContents: document.querySelectorAll('.tab-content'),
    formNovaManutencao: document.getElementById('formNovaManutencao'),
    manutencaoVeiculoIdInput: document.getElementById('manutencaoVeiculoId'),
    listaManutencoes: document.getElementById('listaManutencoesVeiculo'),
    btnVerDetalhesExtras: document.getElementById('btnVerDetalhesExtras'),
    detalhesExtrasVeiculo: document.getElementById('detalhesExtrasVeiculo'),
    // Elementos da Previsão do Tempo
    secaoPrevisaoTempo: document.getElementById('secao-previsao-tempo'),
    cidadeInput: document.getElementById('cidade-input-tempo'),
    btnVerificarClima: document.getElementById('verificar-clima-btn'),
    previsaoResultado: document.getElementById('previsao-tempo-resultado'),
    previsaoStatus: document.getElementById('previsao-status-mensagem'),
};

let notificationTimeout;

// --- Funções Auxiliares e de Autenticação (sem alterações) ---
function showNotification(message, type = 'info', duration = 4000) { if (notificationTimeout) clearTimeout(notificationTimeout); ui.notificationMessage.textContent = message; ui.notificationArea.className = ''; ui.notificationArea.classList.add(type, 'show'); notificationTimeout = setTimeout(() => ui.notificationArea.classList.remove('show'), duration); }
function getAuthHeaders() { const token = localStorage.getItem('garagemToken'); const headers = { 'Content-Type': 'application/json' }; if (token) { headers['Authorization'] = `Bearer ${token}`; } return headers; }
async function handleRegister(event) { event.preventDefault(); const email = document.getElementById('registerEmail').value; const password = document.getElementById('registerPassword').value; try { const response = await fetch(`${backendUrl}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), }); const data = await response.json(); if (!response.ok) throw new Error(data.message); showNotification(data.message, 'success'); ui.formRegister.reset(); document.getElementById('loginEmail').value = email; } catch (error) { showNotification(`Falha no registro: ${error.message}`, 'error'); } }
async function handleLogin(event) { event.preventDefault(); const email = document.getElementById('loginEmail').value; const password = document.getElementById('loginPassword').value; try { const response = await fetch(`${backendUrl}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), }); const data = await response.json(); if (!response.ok) throw new Error(data.message); localStorage.setItem('garagemToken', data.token); showNotification(data.message, 'success'); checkLoginState(); } catch (error) { showNotification(`Falha no login: ${error.message}`, 'error'); } }
function handleLogout() { localStorage.removeItem('garagemToken'); showNotification('Você saiu da sua conta.', 'info'); checkLoginState(); }

function checkLoginState() {
    const token = localStorage.getItem('garagemToken');
    if (token) {
        ui.authContainer.style.display = 'none';
        ui.appContainer.style.display = 'flex';
        ui.secaoPrevisaoTempo.style.display = 'block'; // Mostra a previsão do tempo
        carregarEExibirVeiculos();
    } else {
        ui.authContainer.style.display = 'block';
        ui.appContainer.style.display = 'none';
        ui.secaoPrevisaoTempo.style.display = 'none'; // Esconde a previsão do tempo
        ui.listaVeiculosSidebar.innerHTML = '<li class="placeholder">Faça login para ver seus veículos.</li>';
        ui.painelVeiculoSelecionado.style.display = 'none';
        ui.mensagemSelecione.style.display = 'block';
    }
}

// --- Funções de UI do Painel ---
function atualizarPainelControle(veiculo) { const { ligado, velocidade } = veiculo; ui.infoStatusMotor.textContent = ligado ? 'Ligado' : 'Desligado'; ui.infoStatusMotor.className = ligado ? 'status-on' : 'status-off'; ui.botaoLigarDesligar.innerHTML = `<i class="fas fa-power-off"></i> ${ligado ? 'Desligar' : 'Ligar'}`; ui.botaoLigarDesligar.dataset.action = ligado ? 'desligar' : 'ligar'; ui.botaoAcelerar.disabled = !ligado; ui.botaoFrear.disabled = !ligado; ui.velocimetroTexto.textContent = `${velocidade} km/h`; const comprimentoCircunferencia = ui.velocimetroProgresso.r.baseVal.value * 2 * Math.PI; const offset = comprimentoCircunferencia - (velocidade / VELOCIDADE_MAXIMA_GAUGE) * comprimentoCircunferencia; ui.velocimetroProgresso.style.strokeDashoffset = Math.max(0, offset); }

// --- Funções CRUD e Ações de Veículos ---
async function carregarEExibirVeiculos() { try { const response = await fetch(`${backendUrl}/api/veiculos`, { headers: getAuthHeaders() }); if (response.status === 401) { handleLogout(); showNotification('Sua sessão expirou. Faça login novamente.', 'warning'); return; } if (!response.ok) throw new Error('Falha ao buscar veículos.'); const veiculos = await response.json(); atualizarListaVeiculosSidebar(veiculos); } catch (error) { showNotification(error.message, "error"); ui.listaVeiculosSidebar.innerHTML = '<li class="placeholder">Erro ao carregar.</li>'; } }
function atualizarListaVeiculosSidebar(veiculos) { ui.listaVeiculosSidebar.innerHTML = ''; const veiculoSelecionadoId = ui.painelVeiculoSelecionado.dataset.id; if (!veiculos || veiculos.length === 0) { ui.listaVeiculosSidebar.innerHTML = '<li class="placeholder">Nenhum veículo adicionado.</li>'; return; } veiculos.forEach(veiculo => { const li = document.createElement('li'); li.dataset.id = veiculo._id; if (veiculo._id === veiculoSelecionadoId) { li.classList.add('selecionado'); } li.innerHTML = ` <i class="fas fa-car"></i> <span class="veiculo-nome">${veiculo.modelo} (${veiculo.placa})</span> <div class="sidebar-actions"> <button class="sidebar-action-btn edit" title="Editar ${veiculo.modelo}"><i class="fas fa-pencil-alt"></i></button> <button class="sidebar-action-btn delete" title="Excluir ${veiculo.modelo}"><i class="fas fa-trash-alt"></i></button> </div> `; ui.listaVeiculosSidebar.appendChild(li); }); }

async function selecionarEExibirVeiculo(veiculoId) {
    document.querySelectorAll('#listaVeiculosSidebar li').forEach(li => li.classList.remove('selecionado'));
    const itemSelecionado = document.querySelector(`#listaVeiculosSidebar li[data-id='${veiculoId}']`);
    if(itemSelecionado) itemSelecionado.classList.add('selecionado');

    try {
        const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Veículo não encontrado.');
        const veiculo = await response.json();

        ui.painelVeiculoSelecionado.dataset.id = veiculo._id;
        ui.infoModeloPlaca.textContent = `${veiculo.modelo} (${veiculo.placa})`;
        ui.infoTipo.textContent = veiculo.tipo; // Exibe o tipo
        ui.infoMarca.textContent = veiculo.marca;
        ui.infoCor.textContent = veiculo.cor;
        ui.infoAno.textContent = veiculo.ano;
        ui.infoId.textContent = veiculo._id;
        ui.botaoRemoverHeader.dataset.id = veiculo._id;
        ui.botaoEditarHeader.dataset.id = veiculo._id;
        atualizarPainelControle(veiculo);
        
        ui.tabs.forEach(tab => tab.classList.remove('active'));
        ui.tabContents.forEach(content => content.classList.remove('active'));
        document.querySelector('.tab-link[data-tab="tab-manutencao"]').classList.add('active');
        document.getElementById('tab-manutencao').classList.add('active');
        
        ui.mensagemSelecione.style.display = 'none';
        ui.painelVeiculoSelecionado.style.display = 'block';

    } catch (error) {
        showNotification(error.message, 'error');
        ui.painelVeiculoSelecionado.style.display = 'none';
        ui.mensagemSelecione.style.display = 'block';
    }
}

async function handleAdicionarVeiculo(event) { event.preventDefault(); const veiculoData = Object.fromEntries(new FormData(ui.formNovoVeiculo).entries()); if (!veiculoData.tipo || !veiculoData.placa || !veiculoData.marca || !veiculoData.modelo || !veiculoData.ano || !veiculoData.cor) { showNotification("Todos os campos são obrigatórios!", 'warning'); return; } try { const response = await fetch(`${backendUrl}/api/veiculos`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(veiculoData), }); const resultado = await response.json(); if (!response.ok) { throw new Error(resultado.message || `Erro ${response.status}`); } showNotification(`Veículo ${resultado.modelo} adicionado!`, 'success'); ui.formNovoVeiculo.reset(); ui.modalAdicionar.close(); await carregarEExibirVeiculos(); } catch (error) { showNotification(`Falha ao adicionar: ${error.message}`, 'error'); } }

async function abrirModalDeEdicao(veiculoId) { try { const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}`, { headers: getAuthHeaders() }); if (!response.ok) throw new Error('Não foi possível carregar os dados do veículo para edição.'); const veiculo = await response.json(); ui.editVeiculoId.value = veiculo._id; ui.editVeiculoPlaca.value = veiculo.placa; ui.editVeiculoMarca.value = veiculo.marca; ui.editVeiculoModelo.value = veiculo.modelo; ui.editVeiculoAno.value = veiculo.ano; ui.editVeiculoCor.value = veiculo.cor; ui.editVeiculoTipo.value = veiculo.tipo; ui.modalEditar.showModal(); } catch (error) { showNotification(error.message, 'error'); } }
async function handleEditarVeiculo(event) { event.preventDefault(); const veiculoId = ui.editVeiculoId.value; const veiculoData = Object.fromEntries(new FormData(ui.formEditarVeiculo).entries()); try { const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(veiculoData) }); const resultado = await response.json(); if (!response.ok) throw new Error(resultado.message); showNotification(`Veículo ${resultado.modelo} atualizado com sucesso!`, 'success'); ui.modalEditar.close(); await carregarEExibirVeiculos(); if (ui.painelVeiculoSelecionado.dataset.id === veiculoId) { await selecionarEExibirVeiculo(veiculoId); } } catch (error) { showNotification(`Falha ao atualizar: ${error.message}`, 'error'); } }
async function handleDeletarVeiculo(veiculoId) { if (confirm("Tem certeza que deseja excluir este veículo e todo o seu histórico?")) { try { const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}`, { method: 'DELETE', headers: getAuthHeaders() }); const resultado = await response.json(); if (!response.ok) throw new Error(resultado.message); showNotification(resultado.message, 'success'); if (ui.painelVeiculoSelecionado.dataset.id === veiculoId) { ui.painelVeiculoSelecionado.style.display = 'none'; ui.painelVeiculoSelecionado.dataset.id = ''; ui.mensagemSelecione.style.display = 'block'; } await carregarEExibirVeiculos(); } catch (error) { showNotification(`Falha ao excluir: ${error.message}`, 'error'); } } }
async function executarAcaoVeiculo(event) { const button = event.target.closest('button'); if (!button) return; const action = button.dataset.action; const veiculoId = ui.painelVeiculoSelecionado.dataset.id; if (!action || !veiculoId) return; try { const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}/${action}`, { method: 'POST', headers: getAuthHeaders(), }); const resultado = await response.json(); if (!response.ok) throw new Error(resultado.message); if (resultado.message) { showNotification(resultado.message, 'info', 2000); } atualizarPainelControle(resultado.veiculo); } catch (error) { showNotification(error.message, 'warning'); } }

// --- Funções da Previsão do Tempo ---
async function buscarPrevisaoTempo() {
    const cidade = ui.cidadeInput.value.trim();
    if (!cidade) {
        showNotification('Por favor, digite o nome de uma cidade.', 'warning');
        return;
    }
    if (OPENWEATHER_API_KEY === 'SUA_CHAVE_API_AQUI') {
        showNotification('Chave da API OpenWeather não configurada no principal.js!', 'error');
        return;
    }

    ui.previsaoStatus.textContent = 'Buscando previsão...';
    ui.previsaoResultado.innerHTML = '';

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pt_br`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Cidade não encontrada ou erro na API.');
        }
        const data = await response.json();
        exibirPrevisaoTempo(data);
        ui.previsaoStatus.textContent = '';
    } catch (error) {
        ui.previsaoStatus.textContent = error.message;
        console.error("Erro ao buscar clima:", error);
    }
}

function exibirPrevisaoTempo(data) {
    const { name, main, weather, wind } = data;
    const iconUrl = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;

    const html = `
        <h3>Tempo agora em ${name}</h3>
        <div class="dia-previsao">
            <p class="data-dia"><img src="${iconUrl}" alt="${weather[0].description}" class="icone-tempo"> ${weather[0].description}</p>
            <p><strong>Temperatura:</strong> ${main.temp.toFixed(1)} °C</p>
            <p><strong>Sensação Térmica:</strong> ${main.feels_like.toFixed(1)} °C</p>
            <p><strong>Umidade:</strong> ${main.humidity}%</p>
            <p><strong>Vento:</strong> ${wind.speed.toFixed(1)} m/s</p>
        </div>
    `;
    ui.previsaoResultado.innerHTML = html;
}

// --- Inicialização e Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Autenticação
    ui.formLogin.addEventListener('submit', handleLogin);
    ui.formRegister.addEventListener('submit', handleRegister);
    ui.btnLogout.addEventListener('click', handleLogout);

    // Modais
    ui.btnAbrirModalAdicionar.addEventListener('click', () => ui.modalAdicionar.showModal());
    ui.btnFecharModalAdicionar.addEventListener('click', () => ui.modalAdicionar.close());
    ui.btnFecharModalEditar.addEventListener('click', () => ui.modalEditar.close());
    ui.notificationCloseBtn.addEventListener('click', () => ui.notificationArea.classList.remove('show'));

    // Forms
    ui.formNovoVeiculo.addEventListener('submit', handleAdicionarVeiculo);
    ui.formEditarVeiculo.addEventListener('submit', handleEditarVeiculo);

    // Lista de Veículos
    ui.listaVeiculosSidebar.addEventListener('click', (event) => {
        const veiculoLi = event.target.closest('li[data-id]');
        if (!veiculoLi) return;
        
        const veiculoId = veiculoLi.dataset.id;
        const isEditButton = event.target.closest('.sidebar-action-btn.edit');
        const isDeleteButton = event.target.closest('.sidebar-action-btn.delete');

        if (isEditButton) { abrirModalDeEdicao(veiculoId); } 
        else if (isDeleteButton) { handleDeletarVeiculo(veiculoId); } 
        else { selecionarEExibirVeiculo(veiculoId); }
    });

    // Botões de Ação do Painel
    ui.botaoRemoverHeader.addEventListener('click', (e) => handleDeletarVeiculo(e.currentTarget.dataset.id));
    ui.botaoEditarHeader.addEventListener('click', (e) => abrirModalDeEdicao(e.currentTarget.dataset.id));
    ui.botoesAcoes.addEventListener('click', executarAcaoVeiculo);
    ui.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            ui.tabs.forEach(t => t.classList.remove('active'));
            ui.tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // Listener da Previsão do Tempo
    ui.btnVerificarClima.addEventListener('click', buscarPrevisaoTempo);
    ui.cidadeInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            buscarPrevisaoTempo();
        }
    });
    
    checkLoginState();

    console.log("✅ Garagem Inteligente V3 (Completa e Final) inicializada!");
});