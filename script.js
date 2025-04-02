// ===== ARQUIVO: script.js =====

'use strict'; // Ajuda a pegar erros comuns

// --- Classe Manutencao ATUALIZADA (com validação usando Notificações) ---
class Manutencao {
    constructor(dataISO, tipo, custo, descricao = '') {
        this.data = dataISO instanceof Date ? dataISO : new Date(dataISO);
        this.tipo = tipo ? tipo.trim() : ''; // Garante que tipo é string e remove espaços extras
        this.custo = parseFloat(custo) || 0;
        this.descricao = descricao ? descricao.trim() : '';
        this.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    retornarFormatada(incluirHorario = false) {
        if (!this.isValidDate()) {
            return `${this.tipo || 'Tipo Indefinido'} - Data Inválida - ${this.formatarCusto()}`;
        }
        const opcoesData = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const opcoesHora = { hour: '2-digit', minute: '2-digit' };

        let dataStr = this.data.toLocaleDateString('pt-BR', opcoesData);
        // Verifica se a hora e minutos não são padrão (meia-noite) antes de incluir
        if (incluirHorario && (this.data.getHours() !== 0 || this.data.getMinutes() !== 0 || this.data.getSeconds() !== 0)) {
             dataStr += ' às ' + this.data.toLocaleTimeString('pt-BR', opcoesHora);
        }

        return `${this.tipo} em ${dataStr} - ${this.formatarCusto()}${this.descricao ? ` (${this.descricao})` : ''}`;
    }

    formatarCusto() {
        return this.custo > 0 ? this.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ""; // Omite se custo for zero ou não informado
    }

    isValidDate() {
      return this.data instanceof Date && !isNaN(this.data);
    }

    // Validação AGORA usa showNotification
    validarDados() {
        if (!this.isValidDate()) {
            console.error("Erro de validação: Data inválida.", this.data);
            showNotification("Erro: Data da manutenção inválida ou não informada.", 'error'); // << MUDANÇA
            return false;
        }
        if (typeof this.tipo !== 'string' || this.tipo === '') { // Verifica se é vazio após trim
            console.error("Erro de validação: Tipo de serviço não pode ser vazio.", this.tipo);
            showNotification("Erro: Tipo de serviço não pode ser vazio.", 'error'); // << MUDANÇA
            return false;
        }
        if (typeof this.custo !== 'number' || this.custo < 0) {
            console.error("Erro de validação: Custo inválido.", this.custo);
            showNotification("Erro: Custo inválido (deve ser um número maior ou igual a zero).", 'error'); // << MUDANÇA
            return false;
        }
        return true;
    }

    toJSON() {
        return {
            _tipoClasse: 'Manutencao',
            dataISO: this.isValidDate() ? this.data.toISOString() : null,
            tipo: this.tipo,
            custo: this.custo,
            descricao: this.descricao,
            id: this.id
        };
    }
}

// --- Classes de Veículo ATUALIZADAS (com validação usando Notificações) ---
class Veiculo {
    constructor(modelo, cor, id = null) {
        if (!modelo || typeof modelo !== 'string' || modelo.trim() === '') throw new Error("Modelo do veículo é obrigatório.");
        if (!cor || typeof cor !== 'string' || cor.trim() === '') throw new Error("Cor do veículo é obrigatória.");

        this.modelo = modelo.trim();
        this.cor = cor.trim();
        this.historicoManutencao = [];
        this.id = id || Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Usa notificação se dados inválidos
    adicionarManutencao(manutencao) {
        if (!(manutencao instanceof Manutencao)) {
             showNotification("Erro interno: Tentativa de adicionar objeto que não é Manutencao.", 'error');
             return false;
        }
        // A validação interna da Manutenção já mostra a notificação
        if (!manutencao.validarDados()) {
             return false; // Falha na validação dos dados da manutenção
        }

        // Evitar duplicatas pelo ID (pouco provável, mas seguro)
        if (this.historicoManutencao.some(m => m.id === manutencao.id)) {
            console.warn(`Manutenção com ID ${manutencao.id} já existe para ${this.modelo}.`);
            showNotification("Esta manutenção já foi registrada.", 'warning');
            return false;
        }

        this.historicoManutencao.push(manutencao);
        this.historicoManutencao.sort((a, b) => (b.data && a.data) ? b.data.getTime() - a.data.getTime() : 0); // Ordena (mais recente primeiro)
        console.log(`Manutenção/Agendamento adicionado para ${this.modelo}: ${manutencao.retornarFormatada(true)}`);
        return true; // Sucesso
    }

    removerManutencao(idManutencao) {
        const index = this.historicoManutencao.findIndex(m => m.id === idManutencao);
        if (index > -1) {
            this.historicoManutencao.splice(index, 1);
            console.log(`Manutenção ${idManutencao} removida de ${this.modelo}.`);
            return true;
        }
        console.warn(`Manutenção ${idManutencao} não encontrada em ${this.modelo}.`);
        showNotification("Item de manutenção não encontrado para remoção.", 'error');
        return false;
    }

    getHistoricoFormatado(apenasFuturo = false) {
        const agora = new Date();
        agora.setHours(0, 0, 0, 0); // Compara apenas a data para agendamentos futuros

        let resultado = [];
        this.historicoManutencao.forEach(manutencao => {
            if (!manutencao.isValidDate()) return;

            const dataManutencao = new Date(manutencao.data);
            dataManutencao.setHours(0,0,0,0); // Zera hora para comparação de data

            const isFuture = dataManutencao.getTime() >= agora.getTime(); // Inclui hoje como futuro

            if ((apenasFuturo && isFuture) || (!apenasFuturo && !isFuture)) {
                resultado.push({
                    id: manutencao.id,
                    texto: manutencao.retornarFormatada(true) // Inclui horário sempre
                });
            }
        });

         // Reordena baseado na data completa (com hora)
         resultado.sort((a, b) => {
             const mA = this.historicoManutencao.find(m => m.id === a.id);
             const mB = this.historicoManutencao.find(m => m.id === b.id);
             if (!mA || !mB || !mA.data || !mB.data) return 0; // Segurança

             // Ordena futuros do mais próximo para o mais distante
             // Ordena passados do mais recente para o mais antigo
             return apenasFuturo ? mA.data.getTime() - mB.data.getTime() : mB.data.getTime() - mA.data.getTime();
         });
        return resultado;
    }

    exibirInformacoesBase() {
         // Esta função não será mais usada diretamente para popular a UI
         // A UI buscará os dados específicos e montará a exibição
         return {
             id: this.id,
             modelo: this.modelo,
             cor: this.cor
         };
    }

    toJSON() {
        return {
            _tipoClasse: this.constructor.name,
            modelo: this.modelo,
            cor: this.cor,
            id: this.id,
            historicoManutencao: this.historicoManutencao.map(m => m.toJSON())
        };
    }
}


class Carro extends Veiculo {
    constructor(modelo, cor, id = null, ligado = false, velocidade = 0) {
        super(modelo, cor, id);
        this.ligado = ligado;
        this.velocidade = Math.max(0, velocidade); // Garante não negativo
        this.velocidadeMaxima = 150;
    }

    ligar() { if (!this.ligado) { this.ligado = true; console.log(`${this.modelo} ligado.`); return true;} return false; }
    desligar() { if(this.ligado) {this.ligado = false; this.velocidade = 0; console.log(`${this.modelo} desligado.`); return true;} return false;}

    acelerar() {
        if (this.ligado) {
            if (this.velocidade < this.velocidadeMaxima) {
                this.velocidade = Math.min(this.velocidade + 10, this.velocidadeMaxima);
                console.log(`${this.modelo} V: ${this.velocidade} km/h`);
                return true; // Indica que acelerou
            } else {
                 console.log(`${this.modelo} já na velocidade máxima!`);
                 return false; // Não acelerou
            }
        } else {
            showNotification('Ligue o veículo primeiro!', 'warning'); // << MUDANÇA
            return false;
        }
    }
    frear() {
        if (this.velocidade > 0) {
            this.velocidade = Math.max(0, this.velocidade - 10);
            console.log(`${this.modelo} V: ${this.velocidade} km/h`);
            return true; // Indica que freou
        }
        return false; // Já estava parado
    }

    // Não usaremos mais exibirInformacoes para montar a string completa
    getDadosEspecificos() {
        return {
            ligado: this.ligado,
            velocidade: this.velocidade,
            velocidadeMaxima: this.velocidadeMaxima
        };
    }

    toJSON() {
        return {
            ...super.toJSON(),
            ligado: this.ligado,
            velocidade: this.velocidade
        };
    }
}

class CarroEsportivo extends Carro {
    constructor(modelo, cor, id = null, ligado = false, velocidade = 0, turboBoostUsado = false) {
        super(modelo, cor, id, ligado, velocidade);
        this.velocidadeMaxima = 360;
        this.turboBoostUsado = turboBoostUsado;
    }

    // Usa notificação
    ativarTurbo() {
        if (!this.ligado) {
            showNotification('Ligue o carro antes de usar o turbo boost!', 'warning'); // << MUDANÇA
            return false;
        }
        if (this.turboBoostUsado) {
            showNotification('O Turbo Boost já foi utilizado neste veículo!', 'warning'); // << MUDANÇA
            return false;
        }

        const boost = 50;
        const velocidadeAntiga = this.velocidade;
        this.velocidade = Math.min(this.velocidade + boost, this.velocidadeMaxima);
        this.turboBoostUsado = true;
        console.log(`TURBO BOOST! ${this.modelo} ${velocidadeAntiga} -> ${this.velocidade} km/h.`);
        showNotification('Turbo Boost Ativado!', 'success'); // << MUDANÇA
        return true; // Indica que o boost foi ativado
    }

    acelerar() { // Aceleração normal mais forte
        if (this.ligado) {
             if (this.velocidade < this.velocidadeMaxima) {
                const incremento = 25; // Mais rápido que carro normal
                this.velocidade = Math.min(this.velocidade + incremento, this.velocidadeMaxima);
                console.log(`${this.modelo} V: ${this.velocidade} km/h`);
                return true;
             } else {
                 console.log(`${this.modelo} já na velocidade máxima!`);
                 return false;
             }
        } else {
            showNotification('Ligue o veículo primeiro!', 'warning');
            return false;
        }
    }

     // Sobrescreve para adicionar info do boost
    getDadosEspecificos() {
        return {
            ...super.getDadosEspecificos(), // Pega dados de Carro (ligado, velocidade)
            turboBoostUsado: this.turboBoostUsado
        };
    }

    toJSON() {
        return {
            ...super.toJSON(),
            turboBoostUsado: this.turboBoostUsado
        };
    }
}

class Caminhao extends Carro {
    constructor(modelo, cor, capacidadeCarga, id = null, ligado = false, velocidade = 0, cargaAtual = 0) {
        // Validação da capacidade
        const cap = parseInt(capacidadeCarga, 10);
        if (isNaN(cap) || cap <= 0) {
            throw new Error("Capacidade de carga do caminhão deve ser um número positivo.");
        }
        super(modelo, cor, id, ligado, velocidade);
        this.capacidadeCarga = cap;
        this.cargaAtual = Math.max(0, Math.min(parseInt(cargaAtual, 10) || 0, this.capacidadeCarga)); // Garante carga válida
        this.velocidadeMaxima = 120;
    }

    // Usa notificação
    carregar(quantidade = 1000) { // Permite especificar quantidade
        if(this.ligado) {
             showNotification("Desligue o caminhão para carregar/descarregar com segurança.", 'warning');
             return false;
        }
        const quant = parseInt(quantidade, 10);
        if (isNaN(quant) || quant <= 0) {
            showNotification("Quantidade inválida para carregar.", 'warning');
             return false;
        }
        if (this.cargaAtual + quant <= this.capacidadeCarga) {
            this.cargaAtual += quant;
            console.log(`Carga: ${this.cargaAtual} kg`);
            showNotification(`${quant}kg carregados. Carga atual: ${this.cargaAtual}kg`, 'success', 2500);
            return true;
        } else {
            showNotification('Carga excede a capacidade do caminhão!', 'warning');
            return false;
        }
    }

    descarregar(quantidade = 500) {
        if(this.ligado) {
             showNotification("Desligue o caminhão para carregar/descarregar com segurança.", 'warning');
             return false;
        }
        const quant = parseInt(quantidade, 10);
         if (isNaN(quant) || quant <= 0) {
            showNotification("Quantidade inválida para descarregar.", 'warning');
             return false;
        }
        if (this.cargaAtual > 0) {
             const descarregado = Math.min(quant, this.cargaAtual);
             this.cargaAtual -= descarregado;
             console.log(`Carga: ${this.cargaAtual} kg`);
             showNotification(`${descarregado}kg descarregados. Carga atual: ${this.cargaAtual}kg`, 'success', 2500);
             return true;
        } else {
            showNotification('Caminhão já está vazio.', 'info');
            return false;
        }
    }

     acelerar() { // Acelera mais devagar e considera carga
        if (this.ligado) {
            if (this.velocidade < this.velocidadeMaxima) {
                // Quanto mais carga, menor o fator (mais lento acelera)
                const fatorCarga = Math.max(0.3, 1 - (this.cargaAtual / (this.capacidadeCarga * 1.5))); // Ajuste fórmula
                const incremento = Math.max(1, Math.round(7 * fatorCarga)); // Incremento base 7
                this.velocidade = Math.min(this.velocidade + incremento, this.velocidadeMaxima);
                console.log(`${this.modelo} V: ${this.velocidade} km/h (fator carga: ${fatorCarga.toFixed(2)})`);
                return true;
            } else {
                console.log(`${this.modelo} já na velocidade máxima!`);
                return false;
            }
        } else {
            showNotification('Ligue o caminhão primeiro!', 'warning');
            return false;
        }
    }
    frear() { // Freia mais devagar com carga
        if (this.velocidade > 0) {
            const fatorCarga = Math.max(0.4, 1 - (this.cargaAtual / (this.capacidadeCarga * 2))); // Freia um pouco menos efetivo com carga
            const decremento = Math.max(2, Math.round(8 * fatorCarga)); // Decremento base 8
            this.velocidade = Math.max(0, this.velocidade - decremento);
            console.log(`${this.modelo} V: ${this.velocidade} km/h`);
            return true;
        }
         return false;
    }

    // Sobrescreve para adicionar info da Carga
    getDadosEspecificos() {
        return {
            ...super.getDadosEspecificos(), // Pega dados de Carro (ligado, velocidade)
            cargaAtual: this.cargaAtual,
            capacidadeCarga: this.capacidadeCarga
        };
    }

    toJSON() {
        return {
            ...super.toJSON(),
            capacidadeCarga: this.capacidadeCarga,
            cargaAtual: this.cargaAtual
        };
    }
}


// --- Classe Garagem (com validação usando Notificações) ---
class Garagem {
    constructor() {
        this.veiculos = [];
        this.veiculoSelecionadoId = null;
    }

    adicionarVeiculo(veiculo) {
        if (!(veiculo instanceof Veiculo)) {
            console.error("Tentativa de adicionar objeto inválido à garagem.");
            showNotification("Erro interno: Tipo de objeto inválido para adicionar à garagem.", 'error');
            return false;
        }
        if (this.veiculos.some(v => v.id === veiculo.id)) {
             console.warn(`Veículo com ID ${veiculo.id} (${veiculo.modelo}) já existe.`);
             // Não mostra notificação aqui, pode ser carregamento inicial
             return false; // tecnicamente não adicionou de novo
        }
        this.veiculos.push(veiculo);
        console.log(`Veículo ${veiculo.modelo} (ID: ${veiculo.id}) adicionado.`);
        // Não salva aqui automaticamente, a função que chama (addNovoVeiculo) salva
        return true;
    }

    removerVeiculo(idVeiculo) {
        const index = this.veiculos.findIndex(v => v.id === idVeiculo);
        if (index > -1) {
            const removido = this.veiculos.splice(index, 1)[0];
            console.log(`Veículo ${removido.modelo} (ID: ${idVeiculo}) removido.`);
            if(this.veiculoSelecionadoId === idVeiculo) {
                this.selecionarVeiculo(null); // Desseleciona
            }
            this.salvarNoLocalStorage(); // Salva após remover
            return true;
        }
        console.warn(`Veículo com ID ${idVeiculo} não encontrado para remoção.`);
        showNotification("Veículo não encontrado para remoção.", 'error');
        return false;
    }

    encontrarVeiculo(idVeiculo) {
        return this.veiculos.find(v => v.id === idVeiculo);
    }

    selecionarVeiculo(idVeiculo) {
         const veiculo = this.encontrarVeiculo(idVeiculo);
         if(idVeiculo === null || !veiculo) {
              this.veiculoSelecionadoId = null;
         } else {
              this.veiculoSelecionadoId = idVeiculo;
              console.log(`Veículo selecionado: ${veiculo.modelo} (ID: ${idVeiculo})`);
         }
         // Salva o ID selecionado para lembrar entre sessões (opcional)
         localStorage.setItem('garagemVeiculoSelecionadoId', this.veiculoSelecionadoId || '');
         atualizarInterfaceCompleta(); // Atualiza a interface
    }

    getVeiculoSelecionado() {
        return this.encontrarVeiculo(this.veiculoSelecionadoId);
    }

    salvarNoLocalStorage() {
        try {
            const garagemJSON = JSON.stringify(this.veiculos); // Usa os toJSON() das classes
            localStorage.setItem('minhaGaragemVirtual', garagemJSON);
            console.log("Garagem salva no LocalStorage.");
        } catch (error) {
            console.error("Erro ao salvar garagem no LocalStorage:", error);
            showNotification("Erro crítico ao salvar dados da garagem. Verifique o console.", 'error', 10000); // Duração maior
        }
    }

    carregarDoLocalStorage() {
        const garagemJSON = localStorage.getItem('minhaGaragemVirtual');
        this.veiculos = []; // Limpa antes de carregar

        if (garagemJSON) {
            try {
                const veiculosSalvos = JSON.parse(garagemJSON);

                veiculosSalvos.forEach(obj => {
                    try { // Try...catch por veículo, para um não quebrar o resto
                        let veiculo = null;
                        let historico = [];
                        if (obj.historicoManutencao && Array.isArray(obj.historicoManutencao)) {
                            historico = obj.historicoManutencao.map(mObj => {
                                if (mObj && mObj._tipoClasse === 'Manutencao' && mObj.dataISO) {
                                   return new Manutencao(mObj.dataISO, mObj.tipo, mObj.custo, mObj.descricao);
                                }
                                return null;
                            }).filter(m => m !== null && m.isValidDate()); // Remove nulos e inválidos
                            historico.sort((a, b) => b.data.getTime() - a.data.getTime()); // Reordena
                        }

                        switch (obj._tipoClasse) {
                            case 'Carro':
                                veiculo = new Carro(obj.modelo, obj.cor, obj.id, obj.ligado, obj.velocidade);
                                break;
                            case 'CarroEsportivo':
                                veiculo = new CarroEsportivo(obj.modelo, obj.cor, obj.id, obj.ligado, obj.velocidade, obj.turboBoostUsado || false);
                                break;
                            case 'Caminhao':
                                veiculo = new Caminhao(obj.modelo, obj.cor, obj.capacidadeCarga, obj.id, obj.ligado, obj.velocidade, obj.cargaAtual);
                                break;
                            default:
                                console.warn("Tipo de veículo desconhecido encontrado no LS:", obj);
                        }

                        if (veiculo) {
                            veiculo.historicoManutencao = historico;
                            this.adicionarVeiculo(veiculo); // Usa o método para log (sem salvar de novo)
                        }
                     } catch (veiculoError) {
                          console.error(`Erro ao carregar veículo específico ID ${obj?.id || 'desconhecido'}:`, veiculoError);
                          showNotification(`Erro ao carregar dados de um veículo (${obj?.modelo || 'desconhecido'}). Verifique o console.`, 'error');
                     }
                });
                console.log("Garagem carregada do LocalStorage.");

            } catch (error) {
                console.error("Erro CRÍTICO ao carregar/parsear dados da garagem:", error);
                showNotification("Erro grave ao carregar dados salvos. Resetando garagem. Verifique o console.", 'error', 10000);
                localStorage.removeItem('minhaGaragemVirtual'); // Remove dados corrompidos
                this.veiculos = [];
            }
        } else {
             console.log("Nenhum dado de garagem encontrado no LocalStorage.");
        }

        // Tenta restaurar a seleção anterior
        const idSalvo = localStorage.getItem('garagemVeiculoSelecionadoId');
        this.veiculoSelecionadoId = this.encontrarVeiculo(idSalvo) ? idSalvo : null;

        atualizarInterfaceCompleta(); // Atualiza interface após carregar
    }

    // Usa notificação
    verificarAgendamentosProximos() {
        const agora = new Date();
        const limite = new Date(agora.getTime() + (2 * 24 * 60 * 60 * 1000)); // Próximas 48 horas
        let notificacoes = [];

        this.veiculos.forEach(veiculo => {
            veiculo.historicoManutencao.forEach(manutencao => {
                if (manutencao.isValidDate() && manutencao.data > agora && manutencao.data <= limite) {
                    const tempoRestante = Math.round((manutencao.data.getTime() - agora.getTime()) / (60*60*1000)); // horas restantes
                    const dataFormatada = manutencao.data.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})
                                         + ' às '
                                         + manutencao.data.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
                    notificacoes.push(`Lembrete: ${manutencao.tipo} p/ ${veiculo.modelo} agendado para ${dataFormatada} (${tempoRestante}h aprox).`);
                }
            });
        });

        if (notificacoes.length > 0) {
            console.log("Agendamentos próximos:", notificacoes);
             // Mostra uma notificação por agendamento próximo
             notificacoes.forEach((notif, index) => {
                 // Atraso pequeno entre múltiplas notificações
                 setTimeout(() => showNotification(notif, 'info', 8000 + index*500), index * 700); // Aumenta duração e atraso
             });
        }
    }
}

// ===== INSTÂNCIA GLOBAL DA GARAGEM =====
const minhaGaragem = new Garagem();

// ===== FUNÇÕES DE NOTIFICAÇÃO (Mantidas da resposta anterior) =====
let notificationTimeout;

function showNotification(message, type = 'info', duration = 5000) {
    const notificationArea = document.getElementById('notification-area');
    const notificationMessage = document.getElementById('notification-message');
    if (!notificationArea || !notificationMessage) {
         console.warn("Área de notificação não encontrada!");
         alert(message); // Fallback para alert
         return;
    }
    clearTimeout(notificationTimeout);
    notificationMessage.textContent = message;
    notificationArea.className = 'notification'; // Reseta classes de tipo
    notificationArea.classList.add(type);
    notificationArea.classList.add('show');
    notificationArea.style.display = 'flex';
    notificationTimeout = setTimeout(hideNotification, duration);
}

function hideNotification() {
    const notificationArea = document.getElementById('notification-area');
    if (!notificationArea) return;
    notificationArea.classList.remove('show');
    // Não esconder imediatamente, esperar transição CSS
    setTimeout(() => {
         if(!notificationArea.classList.contains('show')) {
             notificationArea.style.display = 'none';
         }
    }, 500); // Tempo maior para garantir (deve bater com transição CSS + um pouco)
    clearTimeout(notificationTimeout);
}


// ===== FUNÇÕES DE INTERAÇÃO (Adaptadas para Nova UI e Notificações) =====

function interagir(acao) {
    const veiculo = minhaGaragem.getVeiculoSelecionado();
    if (!veiculo && acao !== 'removerVeiculo') { // Remover não precisa de veículo selecionado (se fosse de lista)
        showNotification("Selecione um veículo na barra lateral primeiro!", 'warning');
        return;
    }

    let precisaSalvar = false; // Salva apenas se estado do VEÍCULO mudar
    let acaoRealizada = false;

    try {
        switch (acao) {
            case 'ligar':
                 if(veiculo instanceof Carro) { // Verifica se tem método ligar
                     acaoRealizada = veiculo.ligar();
                     if(acaoRealizada) { precisaSalvar = true; showNotification(`${veiculo.modelo} ligado.`, 'success', 2000); }
                     else { showNotification(`${veiculo.modelo} já estava ligado.`, 'info', 2000); }
                 } else showNotification("Ação 'ligar' não aplicável.", 'warning');
                break;
            case 'desligar':
                 if(veiculo instanceof Carro) {
                     acaoRealizada = veiculo.desligar();
                     if(acaoRealizada) { precisaSalvar = true; showNotification(`${veiculo.modelo} desligado.`, 'success', 2000); }
                     else { showNotification(`${veiculo.modelo} já estava desligado.`, 'info', 2000); }
                 } else showNotification("Ação 'desligar' não aplicável.", 'warning');
                break;
            case 'acelerar':
                 if(veiculo instanceof Carro) {
                     acaoRealizada = veiculo.acelerar();
                     // Não mostra notificação aqui para não poluir, mas precisa salvar se velocidade mudou
                     if(acaoRealizada) precisaSalvar = true;
                 } else showNotification("Ação 'acelerar' não aplicável.", 'warning');
                break;
            case 'frear':
                 if(veiculo instanceof Carro) {
                     acaoRealizada = veiculo.frear();
                     // Não mostra notificação, mas salva se velocidade mudou
                      if(acaoRealizada) precisaSalvar = true;
                 } else showNotification("Ação 'frear' não aplicável.", 'warning');
                break;
            case 'ativarTurbo':
                if (veiculo instanceof CarroEsportivo) {
                    // O método já mostra a notificação e retorna true/false
                    acaoRealizada = veiculo.ativarTurbo();
                    if (acaoRealizada) precisaSalvar = true; // Salva se o boost foi USADO
                } else showNotification("Ação 'Boost' não aplicável.", 'warning');
                break;
            case 'carregar':
                if (veiculo instanceof Caminhao) {
                     // Pedir quantidade? Por agora, usa o default
                     acaoRealizada = veiculo.carregar(); // Método já notifica e retorna true/false
                     if (acaoRealizada) precisaSalvar = true;
                } else showNotification("Ação 'carregar' não aplicável.", 'warning');
                break;
             case 'descarregar':
                 if (veiculo instanceof Caminhao) {
                     acaoRealizada = veiculo.descarregar(); // Método já notifica e retorna true/false
                     if (acaoRealizada) precisaSalvar = true;
                 } else showNotification("Ação 'descarregar' não aplicável.", 'warning');
                break;
            case 'removerVeiculo':
                 if (!veiculo) { // Checa de novo caso botão esteja visível por erro
                     showNotification("Nenhum veículo selecionado para remover.", 'warning');
                     return; // Sai da função interagir
                 }
                if (confirm(`ATENÇÃO!\n\nRemover ${veiculo.modelo} (${veiculo.cor}) da garagem?\n\nEsta ação NÃO pode ser desfeita.`)) {
                     // RemoverVeiculo já salva e atualiza a UI ao deselecionar
                     acaoRealizada = minhaGaragem.removerVeiculo(veiculo.id);
                     if(acaoRealizada) showNotification(`${veiculo.modelo} removido permanentemente.`, 'success');
                     // Não precisa salvar de novo nem chamar atualizarInterfaceCompleta aqui
                     return; // Sai da função interagir após remover
                }
                break;
            default:
                console.warn("Ação não reconhecida:", acao);
                showNotification(`Ação desconhecida: ${acao}`, 'error');
        }

        if (precisaSalvar) {
            minhaGaragem.salvarNoLocalStorage();
        }

    } catch (error) {
        console.error(`Erro ao executar ação '${acao}':`, error);
        showNotification(`Ocorreu um erro ao executar a ação '${acao}'. Verifique o console.`, 'error');
    } finally {
        // Atualiza a interface APÓS a ação (exceto remover que já cuida disso)
         atualizarInterfaceCompleta();
    }
}


function adicionarNovoVeiculo() {
    const tipo = document.getElementById('novoVeiculoTipo').value;
    const modelo = document.getElementById('novoVeiculoModelo').value;
    const cor = document.getElementById('novoVeiculoCor').value;
    const capCargaInput = document.getElementById('novoVeiculoCapacidade');
    const capacidadeCarga = capCargaInput ? parseInt(capCargaInput.value, 10) : 0;

    // Validações básicas de preenchimento
    if (!tipo) { showNotification("Selecione o tipo do veículo.", 'warning'); return; }
    if (!modelo || modelo.trim() === '') { showNotification("Informe o modelo do veículo.", 'warning'); return; }
    if (!cor || cor.trim() === '') { showNotification("Informe a cor do veículo.", 'warning'); return; }


    let novoVeiculo = null;
    try {
        switch (tipo) {
            case 'Carro': novoVeiculo = new Carro(modelo, cor); break;
            case 'CarroEsportivo': novoVeiculo = new CarroEsportivo(modelo, cor); break;
            case 'Caminhao':
                 if (!capacidadeCarga || capacidadeCarga <= 0) {
                     showNotification("Para caminhão, informe uma capacidade de carga válida (kg, número positivo).", 'warning');
                     return;
                 }
                novoVeiculo = new Caminhao(modelo, cor, capacidadeCarga);
                break;
            default:
                showNotification("Tipo de veículo selecionado é inválido.", 'error');
                return;
        }
    } catch (error) {
        console.error("Erro ao criar novo veículo:", error);
        // A validação no construtor (ex: capacidade caminhão) pode jogar erro
        showNotification(`Erro ao criar veículo: ${error.message}`, 'error');
        return;
    }


    if (minhaGaragem.adicionarVeiculo(novoVeiculo)) {
        minhaGaragem.salvarNoLocalStorage(); // Salva APÓS adicionar com sucesso
        showNotification(`${novoVeiculo.modelo} (${tipo}) adicionado à garagem!`, 'success');
        document.getElementById('formNovoVeiculo').reset();
        const capacidadeDiv = document.getElementById('divCapacidadeCaminhao');
        if(capacidadeDiv) capacidadeDiv.style.display = 'none';

        atualizarInterfaceCompleta(); // Atualiza lista
        minhaGaragem.selecionarVeiculo(novoVeiculo.id); // Seleciona o novo
    }
    // Se adicionarVeiculo retornar false (duplicata), a notificação já foi mostrada (se necessário)
}

function agendarOuRegistrarManutencao(e) {
    e.preventDefault(); // Previne o recarregamento da página pelo form
    const veiculo = minhaGaragem.getVeiculoSelecionado();
    if (!veiculo) {
        showNotification("Selecione um veículo para registrar/agendar manutenção!", 'warning');
        return;
    }

    const dataHoraInput = document.getElementById('manutencaoDataHora');
    const tipoInput = document.getElementById('manutencaoTipo');
    const custoInput = document.getElementById('manutencaoCusto');
    const descricaoInput = document.getElementById('manutencaoDescricao');

    const dataHora = dataHoraInput.value;
    const tipo = tipoInput.value;
    const custoStr = custoInput.value.replace(',', '.');
    const custo = parseFloat(custoStr) || 0;
    const descricao = descricaoInput.value;

    // Validação de preenchimento no JS antes de criar objeto
    if (!dataHora) { showNotification("Selecione a data e hora da manutenção.", 'warning'); dataHoraInput.focus(); return; }
    if (!tipo || tipo.trim() === '') { showNotification("Informe o tipo de serviço.", 'warning'); tipoInput.focus(); return; }
    if (isNaN(custo) || custo < 0) { showNotification("O custo informado é inválido (deve ser um número positivo ou zero).", 'warning'); custoInput.focus(); return;}


    let novaManutencao;
    try {
         novaManutencao = new Manutencao(dataHora, tipo, custo, descricao);
    } catch (error) {
         console.error("Erro ao criar objeto Manutencao:", error);
         showNotification("Erro ao processar dados da manutenção. Verifique data/hora.", 'error');
         return;
    }

    // AdicionarManutencao fará a validação interna final e mostrará erro se necessário
    if (veiculo.adicionarManutencao(novaManutencao)) {
        minhaGaragem.salvarNoLocalStorage(); // Salva o histórico atualizado
        document.getElementById('formManutencao').reset(); // Limpa o formulário
        atualizarInterfaceCompleta(); // Atualiza a exibição
        showNotification("Manutenção/Agendamento adicionado!", 'success');
    }
}

function removerManutencaoItem(idManutencao) {
     const veiculo = minhaGaragem.getVeiculoSelecionado();
     if (!veiculo) {
         showNotification("Nenhum veículo selecionado para remover manutenção.", 'warning');
         return;
     }
     // Usar confirm é aceitável para remoção
     if (confirm("Tem certeza que deseja remover este item de manutenção/agendamento?")) {
         if (veiculo.removerManutencao(idManutencao)) {
             minhaGaragem.salvarNoLocalStorage(); // Salva após remover
             atualizarInterfaceCompleta(); // Atualiza a lista na tela
             showNotification("Item removido.", 'success', 2000);
         }
         // Se removerManutencao der erro, a notificação é mostrada lá dentro
     }
}


// --- FUNÇÕES DE ATUALIZAÇÃO DA INTERFACE ---

function atualizarListaSelecaoVeiculos() {
    const select = document.getElementById('selectVeiculo');
    const idSelecionadoAnteriormente = select.value; // Guarda o que estava selecionado

    select.innerHTML = '<option value="">-- Selecione um Veículo --</option>'; // Opção padrão

    // Ordena veículos por modelo para consistência
    const veiculosOrdenados = [...minhaGaragem.veiculos].sort((a, b) => a.modelo.localeCompare(b.modelo));

    veiculosOrdenados.forEach(v => {
        const option = document.createElement('option');
        option.value = v.id;
        option.textContent = `${v.modelo} (${v.cor}) - ${v.constructor.name}`; // Ex: "Ferrari (Vermelho) - CarroEsportivo"
        select.appendChild(option);
    });

    // Restaura a seleção se o veículo ainda existir, ou usa o ID da garagem
     if (minhaGaragem.encontrarVeiculo(minhaGaragem.veiculoSelecionadoId)) {
         select.value = minhaGaragem.veiculoSelecionadoId;
     } else if (minhaGaragem.encontrarVeiculo(idSelecionadoAnteriormente)) {
          select.value = idSelecionadoAnteriormente;
          // Atualiza o ID na garagem se a seleção mudou por aqui
          minhaGaragem.selecionarVeiculo(idSelecionadoAnteriormente);
     } else {
          select.value = ""; // Nenhum selecionado
          // Garante que a garagem também não tenha seleção inválida
          if (minhaGaragem.veiculoSelecionadoId && !minhaGaragem.encontrarVeiculo(minhaGaragem.veiculoSelecionadoId)) {
              minhaGaragem.selecionarVeiculo(null);
          }
     }


     // Remove listener antigo e adiciona novo para evitar múltiplos listeners
     select.onchange = null; // Remove listener antigo
     select.onchange = (event) => {
         minhaGaragem.selecionarVeiculo(event.target.value || null);
     };
}

function atualizarPainelVeiculoSelecionado() {
    const veiculo = minhaGaragem.getVeiculoSelecionado();
    const painel = document.getElementById('painelVeiculoSelecionado');
    const mensagemPadrao = document.getElementById('mensagem-selecione');

    // Cache dos elementos da UI para performance
    const uiElements = {
        imgVeiculo: document.getElementById('imagemVeiculo'),
        infoModeloTipo: document.getElementById('info-modelo-tipo'),
        infoCor: document.getElementById('info-cor'),
        infoId: document.getElementById('info-id'),
        infoStatusMotor: document.getElementById('info-status-motor'),
        infoEspecifica: document.getElementById('info-especifica'),
        velocidadeAtual: document.getElementById('velocidadeAtual'),
        barraProgressoContainer: document.getElementById('barraProgressoContainer'),
        botoesAcoes: document.getElementById('botoesAcoes'),
        formManutencaoContainer: document.getElementById('formManutencaoContainer'),
        historicoUl: document.querySelector('#historicoManutencao .lista-itens'),
        agendamentosUl: document.querySelector('#agendamentosFuturos .lista-itens'),
        botaoTurbo: document.getElementById('botaoTurbo'),
        botaoCarregar: document.getElementById('botaoCarregar'),
        botaoDescarregar: document.getElementById('botaoDescarregar'),
        botaoRemover: document.getElementById('botaoRemoverVeiculo')
    };

    if (veiculo) {
        painel.style.display = 'block';
        mensagemPadrao.style.display = 'none';

        // 1. Atualiza Imagem
        let imagemSrc = 'imagens/carro_normal.png'; // Padrão
        if (veiculo instanceof CarroEsportivo) imagemSrc = 'imagens/carro_esportivo.png';
        else if (veiculo instanceof Caminhao) imagemSrc = 'imagens/caminhao.png';
        uiElements.imgVeiculo.src = imagemSrc;
        uiElements.imgVeiculo.alt = `Imagem de ${veiculo.modelo}`;

        // 2. Atualiza Informações Básicas
        const baseInfo = veiculo.exibirInformacoesBase(); // Pega {id, modelo, cor}
        uiElements.infoModeloTipo.textContent = `${baseInfo.modelo} (${veiculo.constructor.name})`;
        uiElements.infoCor.textContent = baseInfo.cor;
        uiElements.infoId.textContent = baseInfo.id;

        // 3. Atualiza Status e Infos Específicas (se aplicável)
        uiElements.infoEspecifica.innerHTML = ''; // Limpa infos específicas
        uiElements.barraProgressoContainer.style.display = 'none'; // Esconde velocímetro por padrão
        uiElements.infoStatusMotor.style.display = 'none'; // Esconde status motor por padrão

        if (veiculo instanceof Carro) {
            const dadosCarro = veiculo.getDadosEspecificos();

            // Status Motor
            uiElements.infoStatusMotor.style.display = 'inline'; // Mostra status
             if(dadosCarro.ligado) {
                 uiElements.infoStatusMotor.innerHTML = "<i class='fas fa-circle status-on'></i> Ligado";
             } else {
                  uiElements.infoStatusMotor.innerHTML = "<i class='fas fa-circle status-off'></i> Desligado";
             }

             // Velocidade e Barra
            uiElements.barraProgressoContainer.style.display = 'flex';
            uiElements.velocidadeAtual.textContent = `${Math.round(dadosCarro.velocidade)} km/h`;
            atualizarBarraProgresso(dadosCarro.velocidade, dadosCarro.velocidadeMaxima);

            // Infos Específicas de Subclasses
            if (veiculo instanceof CarroEsportivo) {
                 uiElements.infoEspecifica.innerHTML += `<p><i class="fas fa-bolt"></i> Boost Disponível: <span id="info-boost">${!dadosCarro.turboBoostUsado ? 'Sim' : 'Não'}</span></p>`;
            } else if (veiculo instanceof Caminhao) {
                 uiElements.infoEspecifica.innerHTML += `<p><i class="fas fa-weight-hanging"></i> Carga: <span id="info-carga">${dadosCarro.cargaAtual} / ${dadosCarro.capacidadeCarga} kg</span></p>`;
            }
        }
        // Poderia ter um 'else' aqui para veículos que NÃO são Carro (ex: Bicicleta, se adicionado)

        // 4. Mostra containers e ajusta botões
        uiElements.botoesAcoes.style.display = 'block';
        uiElements.formManutencaoContainer.style.display = 'block';

        uiElements.botaoTurbo.style.display = (veiculo instanceof CarroEsportivo) ? 'inline-flex' : 'none';
        uiElements.botaoCarregar.style.display = (veiculo instanceof Caminhao) ? 'inline-flex' : 'none';
        uiElements.botaoDescarregar.style.display = (veiculo instanceof Caminhao) ? 'inline-flex' : 'none';
        uiElements.botaoRemover.style.display = 'inline-flex';

        // 5. Atualiza Listas de Manutenção
        if(uiElements.historicoUl) renderizarListaManutencao(uiElements.historicoUl, veiculo.getHistoricoFormatado(false)); // Título agora está no HTML
        if(uiElements.agendamentosUl) renderizarListaManutencao(uiElements.agendamentosUl, veiculo.getHistoricoFormatado(true));

    } else {
        painel.style.display = 'none';
        mensagemPadrao.style.display = 'block';
    }
}


function atualizarBarraProgresso(velocidade, velocidadeMaxima) {
    const bolinhas = document.querySelectorAll('#barraProgresso .bolinha');
    if (bolinhas.length === 0) return;

    const maxVel = velocidadeMaxima > 0 ? velocidadeMaxima : 1; // Evita divisão por zero
    const porcentagem = Math.max(0, Math.min(1, velocidade / maxVel)); // Garante entre 0 e 1
    const numBolinhasAtivas = Math.round(porcentagem * bolinhas.length);

    bolinhas.forEach((bolinha, index) => {
        // Adiciona ou remove a classe 'ativa'
        bolinha.classList.toggle('ativa', index < numBolinhasAtivas);
    });
}

function renderizarListaManutencao(ulElement, itens) { // Título removido, agora é fixo no HTML
     if (!ulElement) {
          console.error("Elemento UL para lista de manutenção não encontrado");
          return;
     }
     ulElement.innerHTML = ''; // Limpa a lista

     if (itens.length === 0) {
          const li = document.createElement('li');
          li.textContent = 'Nenhum registro encontrado.';
          li.style.fontStyle = 'italic';
          li.style.color = '#888';
          li.style.textAlign = 'center';
          ulElement.appendChild(li);
          return;
     }

     itens.forEach(item => {
         const li = document.createElement('li');
         const textoSpan = document.createElement('span'); // Span para o texto evitar conflito com botão
         textoSpan.textContent = item.texto; // Usar textContent para segurança básica
         li.appendChild(textoSpan);

         const removeButton = document.createElement('button');
         removeButton.className = 'botao-remover-item';
         removeButton.title = 'Remover este item';
         removeButton.innerHTML = '<i class="fas fa-times"></i>'; // Usa ícone
         removeButton.onclick = () => removerManutencaoItem(item.id); // Arrow function para passar o ID

         li.appendChild(removeButton);
         ulElement.appendChild(li);
     });
}

// Função única para atualizar toda a interface relevante
function atualizarInterfaceCompleta() {
    console.log("Atualizando interface completa...");
    atualizarListaSelecaoVeiculos();
    atualizarPainelVeiculoSelecionado();
}

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Carregado. Iniciando Garagem...");
    minhaGaragem.carregarDoLocalStorage(); // Carrega dados primeiro

    // Configura listeners DEPOIS de carregar os dados
    const tipoSelect = document.getElementById('novoVeiculoTipo');
    if(tipoSelect) {
        tipoSelect.addEventListener('change', (event) => {
            const capacidadeDiv = document.getElementById('divCapacidadeCaminhao');
            if(capacidadeDiv) capacidadeDiv.style.display = (event.target.value === 'Caminhao') ? 'block' : 'none';
        });
    }

    const formNovo = document.getElementById('formNovoVeiculo');
    if(formNovo) {
        formNovo.addEventListener('submit', (event) => {
            event.preventDefault();
            adicionarNovoVeiculo();
        });
    }

    const formManut = document.getElementById('formManutencao');
    if(formManut) {
         formManut.addEventListener('submit', agendarOuRegistrarManutencao);
    }

    // O listener do select principal é adicionado/atualizado em atualizarListaSelecaoVeiculos

    atualizarInterfaceCompleta(); // Garante que a interface reflita o estado carregado

    // Verifica agendamentos próximos (pode mostrar notificações)
    // Atraso leve para não sobrepor notificações de carregamento (se houver)
    setTimeout(() => {
        if(minhaGaragem.veiculos.length > 0) {
            minhaGaragem.verificarAgendamentosProximos();
        }
    }, 1500);


    console.log("Garagem inicializada.");
});