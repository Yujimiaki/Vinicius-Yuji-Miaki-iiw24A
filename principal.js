'use strict';

// --- Constantes e Configuração ---
const backendUrl = 'http://localhost:3001';
const VELOCIDADE_MAXIMA_GAUGE = 220; // Velocidade máxima para o visual do velocímetro

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
};

// --- Funções Auxiliares ---
function showNotification(message, type = 'info', duration = 4000) {
    ui.notificationMessage.textContent = message;
    ui.notificationArea.className = 'show'; 
    ui.notificationArea.classList.add(type);
    setTimeout(() => ui.notificationArea.classList.remove('show'), duration);
}

// --- Funções de API e UI (Veículos) ---
async function carregarEExibirVeiculos() {
    try {
        const response = await fetch(`${backendUrl}/api/veiculos`);
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
            </div>`;
        ui.listaVeiculosSidebar.appendChild(li);
    });
}

async function selecionarEExibirVeiculo(veiculoId) {
    try {
        const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}`);
        if (!response.ok) throw new Error('Veículo não encontrado.');
        const veiculo = await response.json();

        ui.painelVeiculoSelecionado.style.display = 'block';
        ui.mensagemSelecione.style.display = 'none';

        ui.infoModeloPlaca.textContent = `${veiculo.modelo} (${veiculo.placa})`;
        ui.infoMarca.textContent = veiculo.marca;
        ui.infoCor.textContent = veiculo.cor;
        ui.infoAno.textContent = veiculo.ano;
        ui.infoId.textContent = veiculo._id;

        const actionButtons = [ui.botaoRemoverHeader, ui.botaoLigarDesligar, ui.botaoAcelerar, ui.botaoFrear];
        actionButtons.forEach(btn => btn.dataset.id = veiculo._id);
        ui.manutencaoVeiculoIdInput.value = veiculo._id;
        
        atualizarPainelControle(veiculo);

        document.querySelectorAll('.veiculo-item').forEach(item => item.classList.remove('selecionado'));
        document.querySelector(`.veiculo-item[data-id="${veiculoId}"]`)?.classList.add('selecionado');
        
        await carregarEExibirManutencoes(veiculoId);
    } catch (error) {
        showNotification(error.message, 'error');
        ui.painelVeiculoSelecionado.style.display = 'none';
        ui.mensagemSelecione.style.display = 'block';
    }
}

function atualizarPainelControle(veiculo) {
    const isLigado = veiculo.ligado;
    ui.infoStatusMotor.innerHTML = `<i class="fas fa-circle status-${isLigado ? 'on' : 'off'}"></i> <span class="status-${isLigado ? 'on' : 'off'}">${isLigado ? 'Ligado' : 'Desligado'}</span>`;
    ui.botaoLigarDesligar.innerHTML = `<i class="fas fa-power-off"></i> ${isLigado ? 'Desligar' : 'Ligar'}`;
    ui.botaoLigarDesligar.classList.toggle('botao-perigo', isLigado);
    ui.botaoAcelerar.disabled = !isLigado;
    ui.botaoFrear.disabled = !isLigado;

    const progresso = veiculo.velocidade / VELOCIDADE_MAXIMA_GAUGE;
    const pathLength = ui.velocimetroProgresso.getTotalLength();
    ui.velocimetroProgresso.style.strokeDasharray = pathLength;
    ui.velocimetroProgresso.style.strokeDashoffset = pathLength * (1 - progresso);
    
    let corVelocimetro = 'var(--cor-primaria)';
    if (veiculo.velocidade > VELOCIDADE_MAXIMA_GAUGE * 0.8) corVelocimetro = 'var(--cor-perigo)';
    else if (veiculo.velocidade > VELOCIDADE_MAXIMA_GAUGE * 0.5) corVelocimetro = 'var(--cor-aviso)';
    ui.velocimetroProgresso.style.stroke = corVelocimetro;
    
    ui.velocimetroTexto.textContent = `${veiculo.velocidade} km/h`;
}

// --- Funções de Ação da API ---
async function executarAcaoVeiculo(veiculoId, acao) {
    try {
        const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}/${acao}`, { method: 'POST' });
        const resultado = await response.json();
        
        if (!response.ok) showNotification(resultado.message, 'warning');
        else if (acao === 'ligar' || acao === 'desligar') showNotification(resultado.message, 'info');
        
        if (resultado.veiculo) atualizarPainelControle(resultado.veiculo);
    } catch (error) {
        showNotification(`Erro de comunicação: ${error.message}`, 'error');
    }
}

// --- Funções de Manutenção ---
async function carregarEExibirManutencoes(veiculoId) {
    ui.listaManutencoes.innerHTML = '<li class="placeholder">Carregando histórico...</li>';
    try {
        const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}/manutencoes`);
        if (!response.ok) throw new Error('Falha ao buscar histórico.');
        const manutencoes = await response.json();

        ui.listaManutencoes.innerHTML = '';
        if (manutencoes.length === 0) {
            ui.listaManutencoes.innerHTML = '<li class="placeholder">Nenhum registro de manutenção.</li>';
            return;
        }
        manutencoes.forEach(manut => {
            const li = document.createElement('li');
            const dataFormatada = new Date(manut.data).toLocaleDateString('pt-BR');
            const custoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(manut.custo);
            li.innerHTML = `<span><strong>${manut.descricaoServico}</strong> em ${dataFormatada}</span><span>${custoFormatado}</span>`;
            ui.listaManutencoes.appendChild(li);
        });
    } catch (error) {
        showNotification(error.message, 'error');
        ui.listaManutencoes.innerHTML = '<li class="placeholder error">Erro ao carregar histórico.</li>';
    }
}

async function handleAdicionarManutencao(event) {
    event.preventDefault();
    const veiculoId = ui.manutencaoVeiculoIdInput.value;
    if (!veiculoId) return showNotification('Nenhum veículo selecionado.', 'error');

    const manutencaoData = Object.fromEntries(new FormData(ui.formNovaManutencao).entries());

    try {
        const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}/manutencoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(manutencaoData),
        });
        const resultado = await response.json();
        if (!response.ok) throw new Error(resultado.message || `Erro ${response.status}`);
        
        showNotification('Manutenção registrada com sucesso!', 'success');
        ui.formNovaManutencao.reset();
        ui.manutencaoVeiculoIdInput.value = veiculoId;
        await carregarEExibirManutencoes(veiculoId);
    } catch (error) {
        showNotification(`Falha ao registrar: ${error.message}`, 'error');
    }
}

// --- Handlers de Formulários (CRUD Veículos) ---
async function handleAdicionarVeiculo(event) {
    event.preventDefault();
    const veiculoData = Object.fromEntries(new FormData(ui.formNovoVeiculo).entries());
    try {
        const response = await fetch(`${backendUrl}/api/veiculos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

async function abrirModalDeEdicao(veiculoId) {
    try {
        const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}`);
        if (!response.ok) throw new Error('Não foi possível carregar os dados.');
        const veiculo = await response.json();
        Object.assign(ui, { editVeiculoId: { value: veiculo._id }, editVeiculoPlaca: { value: veiculo.placa }, editVeiculoMarca: { value: veiculo.marca }, editVeiculoModelo: { value: veiculo.modelo }, editVeiculoAno: { value: veiculo.ano }, editVeiculoCor: { value: veiculo.cor } });
        ui.modalEditar.showModal();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function handleEditarVeiculo(event) {
    event.preventDefault();
    const veiculoId = ui.editVeiculoId.value;
    const veiculoData = Object.fromEntries(new FormData(ui.formEditarVeiculo).entries());
    try {
        const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(veiculoData),
        });
        const resultado = await response.json();
        if (!response.ok) throw new Error(resultado.message || `Erro ${response.status}`);
        showNotification(`Veículo ${resultado.modelo} atualizado!`, 'success');
        ui.modalEditar.close();
        await carregarEExibirVeiculos();
        if (document.querySelector('.veiculo-item.selecionado')?.dataset.id === veiculoId) {
            await selecionarEExibirVeiculo(veiculoId);
        }
    } catch (error) {
        showNotification(`Falha ao atualizar: ${error.message}`, 'error');
    }
}

async function handleDeletarVeiculo(veiculoId) {
    if (confirm("Tem certeza que deseja excluir este veículo?")) {
        try {
            const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}`, { method: 'DELETE' });
            const resultado = await response.json();
            if (!response.ok) throw new Error(resultado.message || `Erro ${response.status}`);
            showNotification(resultado.message, 'success');
            if (ui.botaoRemoverHeader.dataset.id === veiculoId) {
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

    ui.btnAbrirModalAdicionar.addEventListener('click', () => ui.modalAdicionar.showModal());
    ui.btnFecharModalAdicionar.addEventListener('click', () => ui.modalAdicionar.close());
    ui.btnFecharModalEditar.addEventListener('click', () => ui.modalEditar.close());
    ui.notificationCloseBtn.addEventListener('click', () => ui.notificationArea.classList.remove('show'));

    ui.formNovoVeiculo.addEventListener('submit', handleAdicionarVeiculo);
    ui.formEditarVeiculo.addEventListener('submit', handleEditarVeiculo);
    ui.formNovaManutencao.addEventListener('submit', handleAdicionarManutencao);
    
    ui.listaVeiculosSidebar.addEventListener('click', (event) => {
        const veiculoItem = event.target.closest('.veiculo-item');
        if (!veiculoItem) return;
        const veiculoId = veiculoItem.dataset.id;
        if (event.target.closest('.btn-edit')) abrirModalDeEdicao(veiculoId);
        else if (event.target.closest('.veiculo-info')) selecionarEExibirVeiculo(veiculoId);
    });

    ui.botaoRemoverHeader.addEventListener('click', (e) => handleDeletarVeiculo(e.currentTarget.dataset.id));
    ui.botaoLigarDesligar.addEventListener('click', (e) => executarAcaoVeiculo(e.currentTarget.dataset.id, e.currentTarget.innerText.trim().toLowerCase() === 'ligar' ? 'ligar' : 'desligar'));
    ui.botaoAcelerar.addEventListener('click', (e) => executarAcaoVeiculo(e.currentTarget.dataset.id, 'acelerar'));
    ui.botaoFrear.addEventListener('click', (e) => executarAcaoVeiculo(e.currentTarget.dataset.id, 'frear'));

    console.log("✅ Garagem Inteligente inicializada com relacionamentos!");
});

// Estilos dinâmicos para botões de ação na lista
const extraStyles = `
    .veiculo-item { display: flex; justify-content: space-between; align-items: center; }
    .veiculo-info { flex-grow: 1; cursor: pointer; display: flex; align-items: center; gap: 10px; padding: 10px 0; }
    .veiculo-actions { display: flex; opacity: 0; transition: opacity 0.2s ease; }
    .veiculo-item:hover .veiculo-actions { opacity: 1; }
    .btn-action { background: transparent; border: none; cursor: pointer; font-size: 1rem; padding: 5px; margin: 0; color: var(--cor-secundaria); }
    .veiculo-item.selecionado .btn-action { color: var(--cor-texto-claro); }
    .btn-action:hover { background-color: rgba(0,0,0,0.1); border-radius: 4px; }`;
document.head.appendChild(Object.assign(document.createElement("style"), { innerText: extraStyles }));