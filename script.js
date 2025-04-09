'use strict'; // Ajuda a pegar erros comuns

// --- Classe Manutencao ---
class Manutencao {
    constructor(dataISO, tipo, custo, descricao = '') {
        if (dataISO instanceof Date && !isNaN(dataISO)) {
            this.data = dataISO;
        } else if (typeof dataISO === 'string') {
             try {
                this.data = new Date(dataISO);
                if (isNaN(this.data)) throw new Error("Data inválida recebida.");
             } catch (e) {
                 console.error("Erro ao criar data para Manutencao:", dataISO, e);
                 this.data = new Date(NaN);
             }
        } else {
             this.data = new Date(NaN);
        }

        this.tipo = tipo ? tipo.trim() : '';
        if (typeof custo === 'string') {
            custo = custo.replace(',', '.');
        }
        this.custo = parseFloat(custo);
         if (isNaN(this.custo) || this.custo < 0) {
             this.custo = 0;
         }

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
        if (incluirHorario && (this.data.getHours() !== 0 || this.data.getMinutes() !== 0 || this.data.getSeconds() !== 0)) {
             dataStr += ' às ' + this.data.toLocaleTimeString('pt-BR', opcoesHora);
        }

        return `${this.tipo} em ${dataStr} - ${this.formatarCusto()}${this.descricao ? ` (${this.descricao})` : ''}`;
    }

    formatarCusto() {
        return this.custo > 0 ? this.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "Grátis/Agendado";
    }

    isValidDate() {
      return this.data instanceof Date && !isNaN(this.data.getTime());
    }

    validarDados() {
        if (!this.isValidDate()) {
            console.error("Erro de validação: Data inválida.", this.data);
            showNotification("Erro: Data da manutenção inválida ou não informada.", 'error');
            return false;
        }
        if (typeof this.tipo !== 'string' || this.tipo === '') {
            console.error("Erro de validação: Tipo de serviço não pode ser vazio.", this.tipo);
            showNotification("Erro: Tipo de serviço não pode ser vazio.", 'error');
            return false;
        }
        if (typeof this.custo !== 'number' || this.custo < 0) {
            console.error("Erro de validação: Custo inválido.", this.custo);
            showNotification("Erro: Custo inválido (deve ser um número maior ou igual a zero).", 'error');
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


// --- Classe Veiculo ---
class Veiculo {
    constructor(modelo, cor, id = null) {
        if (!modelo || typeof modelo !== 'string' || modelo.trim() === '') throw new Error("Modelo do veículo é obrigatório.");
        if (!cor || typeof cor !== 'string' || cor.trim() === '') throw new Error("Cor do veículo é obrigatória.");

        this.modelo = modelo.trim();
        this.cor = cor.trim();
        this.historicoManutencao = [];
        this.id = id || Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    adicionarManutencao(manutencao) {
        if (!(manutencao instanceof Manutencao)) {
             showNotification("Erro interno: Tentativa de adicionar objeto que não é Manutencao.", 'error');
             console.error("Tipo inválido passado para adicionarManutencao:", manutencao);
             return false;
        }
        if (!manutencao.validarDados()) {
             return false;
        }
        if (this.historicoManutencao.some(m => m.id === manutencao.id)) {
            console.warn(`Manutenção com ID ${manutencao.id} já existe para ${this.modelo}.`);
            showNotification("Esta manutenção já foi registrada (ID duplicado).", 'warning');
            return false;
        }

        this.historicoManutencao.push(manutencao);
        this.historicoManutencao.sort((a, b) => {
            if (!a.isValidDate() && !b.isValidDate()) return 0;
            if (!a.isValidDate()) return 1;
            if (!b.isValidDate()) return -1;
            return b.data.getTime() - a.data.getTime();
        });
        console.log(`Manutenção/Agendamento adicionado para ${this.modelo}: ${manutencao.retornarFormatada(true)}`);
        return true;
    }

    removerManutencao(idManutencao) {
        const index = this.historicoManutencao.findIndex(m => m.id === idManutencao);
        if (index > -1) {
            const removida = this.historicoManutencao.splice(index, 1)[0];
            console.log(`Manutenção ${idManutencao} (${removida.tipo}) removida de ${this.modelo}.`);
            return true;
        }
        console.warn(`Manutenção ${idManutencao} não encontrada em ${this.modelo}.`);
        showNotification("Item de manutenção não encontrado para remoção.", 'error');
        return false;
    }

    getHistoricoPassadoFormatado() {
        const agora = new Date();
        return this._getManutencoesFormatadas(item => item.isValidDate() && item.data < agora);
    }

    getAgendamentosFuturosFormatados() {
         const agora = new Date();
         // Considera hoje como futuro se a hora ainda não passou
         return this._getManutencoesFormatadas(item => item.isValidDate() && item.data >= agora, true);
    }

    _getManutencoesFormatadas(filtro, ordenarAscendente = false) {
        let resultado = this.historicoManutencao
            .filter(filtro)
            .map(manutencao => ({
                id: manutencao.id,
                texto: manutencao.retornarFormatada(true)
            }));

        resultado.sort((a, b) => {
             const mA = this.historicoManutencao.find(m => m.id === a.id);
             const mB = this.historicoManutencao.find(m => m.id === b.id);
             if (!mA || !mB || !mA.isValidDate() || !mB.isValidDate()) return 0;

             const diff = mA.data.getTime() - mB.data.getTime();
             return ordenarAscendente ? diff : -diff;
         });
        return resultado;
    }


    exibirInformacoesBase() {
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


// --- Classe Carro ---
class Carro extends Veiculo {
    constructor(modelo, cor, id = null, ligado = false, velocidade = 0) {
        super(modelo, cor, id);
        this.ligado = ligado;
        this.velocidade = Math.max(0, velocidade);
        this.velocidadeMaxima = 150;
    }

    ligar() { if (!this.ligado) { this.ligado = true; console.log(`${this.modelo} ligado.`); return true;} return false; }
    desligar() { if(this.ligado) {this.ligado = false; this.velocidade = 0; console.log(`${this.modelo} desligado.`); return true;} return false;}

    acelerar() {
        if (this.ligado) {
            if (this.velocidade < this.velocidadeMaxima) {
                this.velocidade = Math.min(this.velocidade + 10, this.velocidadeMaxima);
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
    frear() {
        if (this.velocidade > 0) {
            this.velocidade = Math.max(0, this.velocidade - 10);
            console.log(`${this.modelo} V: ${this.velocidade} km/h`);
            return true;
        }
        return false;
    }

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


// --- Classe CarroEsportivo ---
class CarroEsportivo extends Carro {
    constructor(modelo, cor, id = null, ligado = false, velocidade = 0, turboBoostUsado = false) {
        super(modelo, cor, id, ligado, velocidade);
        this.velocidadeMaxima = 360;
        this.turboBoostUsado = turboBoostUsado;
    }

    ativarTurbo() {
        if (!this.ligado) {
            showNotification('Ligue o carro antes de usar o turbo boost!', 'warning');
            return false;
        }
        if (this.turboBoostUsado) {
            showNotification('O Turbo Boost já foi utilizado neste veículo!', 'warning');
            return false;
        }
        if (this.velocidade === 0) {
             showNotification('Acelere um pouco antes de usar o turbo!', 'info');
             return false;
        }

        const boost = 50;
        const velocidadeAntiga = this.velocidade;
        this.velocidade = Math.min(this.velocidade + boost, this.velocidadeMaxima);
        this.turboBoostUsado = true;
        console.log(`TURBO BOOST! ${this.modelo} ${velocidadeAntiga} -> ${this.velocidade} km/h.`);
        showNotification('Turbo Boost Ativado!', 'success');
        return true;
    }

    acelerar() {
        if (this.ligado) {
             if (this.velocidade < this.velocidadeMaxima) {
                const incremento = 25;
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

    getDadosEspecificos() {
        return {
            ...super.getDadosEspecificos(),
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


// --- Classe Caminhao ---
class Caminhao extends Carro {
    constructor(modelo, cor, capacidadeCarga, id = null, ligado = false, velocidade = 0, cargaAtual = 0) {
        const cap = parseInt(capacidadeCarga, 10);
        if (isNaN(cap) || cap <= 0) {
            throw new Error("Capacidade de carga do caminhão deve ser um número positivo.");
        }
        super(modelo, cor, id, ligado, velocidade);
        this.capacidadeCarga = cap;
        this.cargaAtual = Math.max(0, Math.min(parseInt(cargaAtual, 10) || 0, this.capacidadeCarga));
        this.velocidadeMaxima = 120;
    }

    carregar(quantidade = 1000) {
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
            const espacoLivre = this.capacidadeCarga - this.cargaAtual;
            if (espacoLivre > 0) {
                 this.cargaAtual = this.capacidadeCarga;
                 showNotification(`Carga máxima atingida. ${espacoLivre}kg carregados. Carga atual: ${this.cargaAtual}kg`, 'warning', 3000);
                 return true;
            } else {
                 showNotification('Caminhão já está na capacidade máxima!', 'warning');
                 return false;
            }
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

     acelerar() {
        if (this.ligado) {
            if (this.velocidade < this.velocidadeMaxima) {
                const fatorCarga = Math.max(0.3, 1 - (this.cargaAtual / (this.capacidadeCarga * 1.5)));
                const incremento = Math.max(1, Math.round(7 * fatorCarga));
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
    frear() {
        if (this.velocidade > 0) {
            const fatorCarga = Math.max(0.4, 1 - (this.cargaAtual / (this.capacidadeCarga * 2)));
            const decremento = Math.max(2, Math.round(8 * fatorCarga));
            this.velocidade = Math.max(0, this.velocidade - decremento);
            console.log(`${this.modelo} V: ${this.velocidade} km/h`);
            return true;
        }
         return false;
    }

    getDadosEspecificos() {
        return {
            ...super.getDadosEspecificos(),
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


// --- Classe Garagem ---
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
             return false;
        }
        this.veiculos.push(veiculo);
        console.log(`Veículo ${veiculo.modelo} (ID: ${veiculo.id}) adicionado.`);
        this.veiculos.sort((a, b) => a.modelo.localeCompare(b.modelo));
        return true;
    }

    removerVeiculo(idVeiculo) {
        const index = this.veiculos.findIndex(v => v.id === idVeiculo);
        if (index > -1) {
            const removido = this.veiculos.splice(index, 1)[0];
            console.log(`Veículo ${removido.modelo} (ID: ${idVeiculo}) removido.`);
            if(this.veiculoSelecionadoId === idVeiculo) {
                this.selecionarVeiculo(null);
            }
            this.salvarNoLocalStorage();
            atualizarInterfaceCompleta(); // Atualiza UI *depois*
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
         const veiculoEncontrado = this.encontrarVeiculo(idVeiculo);
         const idAnterior = this.veiculoSelecionadoId;

         if(idVeiculo && veiculoEncontrado) {
             this.veiculoSelecionadoId = idVeiculo;
             console.log(`Veículo selecionado: ${veiculoEncontrado.modelo} (ID: ${idVeiculo})`);
         } else {
             this.veiculoSelecionadoId = null;
             console.log("Nenhum veículo selecionado.");
         }

         localStorage.setItem('garagemVeiculoSelecionadoId', this.veiculoSelecionadoId || '');

         if (idAnterior !== this.veiculoSelecionadoId) {
             if(this.veiculoSelecionadoId) {
                 ativarTab('tab-visao-geral'); // Reseta para aba principal
             }
             atualizarInterfaceCompleta();
         }
    }

    getVeiculoSelecionado() {
        return this.encontrarVeiculo(this.veiculoSelecionadoId);
    }

    salvarNoLocalStorage() {
        try {
            // Usar toJSON garante que só dados relevantes sejam salvos
            const garagemJSON = JSON.stringify(this.veiculos.map(v => v.toJSON()));
            localStorage.setItem('minhaGaragemVirtual', garagemJSON);
            console.log("Garagem salva no LocalStorage.");
        } catch (error) {
            console.error("Erro ao salvar garagem no LocalStorage:", error);
            showNotification("Erro crítico ao salvar dados da garagem. Verifique o console.", 'error', 10000);
        }
    }

    carregarDoLocalStorage() {
        const garagemJSON = localStorage.getItem('minhaGaragemVirtual');
        this.veiculos = [];

        if (garagemJSON) {
            try {
                const veiculosSalvos = JSON.parse(garagemJSON);

                veiculosSalvos.forEach(obj => {
                    try {
                        let veiculo = null;
                        let historico = [];
                        if (obj.historicoManutencao && Array.isArray(obj.historicoManutencao)) {
                           historico = obj.historicoManutencao.map(mObj => {
                                if (mObj && mObj._tipoClasse === 'Manutencao') {
                                    const manut = new Manutencao(mObj.dataISO, mObj.tipo, mObj.custo, mObj.descricao);
                                    if(mObj.id) manut.id = mObj.id; // Restaura ID salvo
                                    return manut;
                                }
                                return null;
                            }).filter(m => m !== null);
                           historico.sort((a, b) => {
                               if (!a.isValidDate() && !b.isValidDate()) return 0;
                               if (!a.isValidDate()) return 1;
                               if (!b.isValidDate()) return -1;
                               return b.data.getTime() - a.data.getTime();
                           });
                        }

                        switch (obj._tipoClasse) {
                            case 'Carro':
                                veiculo = new Carro(obj.modelo, obj.cor, obj.id, obj.ligado, obj.velocidade);
                                break;
                            case 'CarroEsportivo':
                                veiculo = new CarroEsportivo(obj.modelo, obj.cor, obj.id, obj.ligado, obj.velocidade, obj.turboBoostUsado || false);
                                break;
                            case 'Caminhao':
                                const capacidade = obj.capacidadeCarga ? parseInt(obj.capacidadeCarga, 10) : 0;
                                if (isNaN(capacidade) || capacidade <= 0) {
                                    console.warn(`Capacidade inválida (${obj.capacidadeCarga}) para caminhão ${obj.modelo} (ID: ${obj.id}). Usando 1000.`);
                                    obj.capacidadeCarga = 1000;
                                }
                                veiculo = new Caminhao(obj.modelo, obj.cor, obj.capacidadeCarga, obj.id, obj.ligado, obj.velocidade, obj.cargaAtual);
                                break;
                            default:
                                console.warn("Tipo de veículo desconhecido encontrado no LS:", obj);
                        }

                        if (veiculo) {
                            veiculo.historicoManutencao = historico;
                            if (!this.veiculos.some(v => v.id === veiculo.id)) {
                                this.veiculos.push(veiculo);
                            } else {
                                console.warn(`Veículo duplicado (ID: ${veiculo.id}) encontrado durante carregamento.`);
                            }
                        }
                     } catch (veiculoError) {
                          console.error(`Erro ao carregar/recriar veículo ID ${obj?.id || 'desconhecido'} (Modelo: ${obj?.modelo}):`, veiculoError);
                          showNotification(`Erro ao carregar dados de um veículo (${obj?.modelo || 'desconhecido'}). Verifique o console.`, 'error');
                     }
                });

                 this.veiculos.sort((a, b) => a.modelo.localeCompare(b.modelo));
                 console.log("Garagem carregada do LocalStorage.");

            } catch (error) {
                console.error("Erro CRÍTICO ao carregar/parsear dados da garagem:", error);
                showNotification("Erro grave ao carregar dados salvos. Resetando garagem. Verifique o console.", 'error', 10000);
                localStorage.removeItem('minhaGaragemVirtual');
                localStorage.removeItem('garagemVeiculoSelecionadoId');
                this.veiculos = [];
                this.veiculoSelecionadoId = null;
            }
        } else {
             console.log("Nenhum dado de garagem encontrado no LocalStorage.");
        }

        const idSalvo = localStorage.getItem('garagemVeiculoSelecionadoId');
        this.veiculoSelecionadoId = this.encontrarVeiculo(idSalvo) ? idSalvo : null;
        if(this.veiculoSelecionadoId) {
            console.log(`Seleção anterior restaurada: ${this.getVeiculoSelecionado().modelo}`)
        }
    }

    verificarAgendamentosProximos() {
        const agora = new Date();
        const limite = new Date(agora.getTime() + (2 * 24 * 60 * 60 * 1000));
        let notificacoes = [];

        this.veiculos.forEach(veiculo => {
            veiculo.historicoManutencao.forEach(manutencao => {
                if (manutencao.isValidDate() && manutencao.data >= agora && manutencao.data <= limite) {
                    const diffMillis = manutencao.data.getTime() - agora.getTime();
                    const diffHoras = Math.round(diffMillis / (60 * 60 * 1000));
                    const diffDias = Math.floor(diffMillis / (24 * 60 * 60 * 1000));

                    let tempoRestanteStr;
                    if (diffMillis < 60 * 60 * 1000) tempoRestanteStr = "em menos de 1h";
                    else if (diffDias === 0) tempoRestanteStr = `hoje (~${diffHoras}h)`;
                    else if (diffDias === 1) tempoRestanteStr = `amanhã (~${diffHoras}h)`;
                    else tempoRestanteStr = `em ${diffDias} dias (~${diffHoras}h)`;

                    const dataFormatada = manutencao.data.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})
                                         + ' às '
                                         + manutencao.data.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});

                    notificacoes.push({
                        msg: `Lembrete: ${manutencao.tipo} p/ ${veiculo.modelo} ${tempoRestanteStr} (${dataFormatada}).`,
                        veiculoId: veiculo.id
                    });
                }
            });
        });

        if (notificacoes.length > 0) {
            console.log("Agendamentos próximos:", notificacoes.map(n=>n.msg));
             notificacoes.forEach((notif, index) => {
                 setTimeout(() => showNotification(notif.msg, 'info', 8000 + index*500), 1500 + index * 700);
             });
        }
    }
}

// ===== INSTÂNCIA GLOBAL DA GARAGEM =====
const minhaGaragem = new Garagem();

// ===== ELEMENTOS DA UI (Cache) =====
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
    barraProgresso: document.getElementById('barraProgresso'),
    infoEspecifica: document.getElementById('info-especifica'),
    botoesAcoes: document.getElementById('botoesAcoes'),
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


// ===== FUNÇÕES DE NOTIFICAÇÃO =====
let notificationTimeout;

function showNotification(message, type = 'info', duration = 4000) {
    if (!ui.notificationArea || !ui.notificationMessage) {
         console.warn("Área de notificação não encontrada!"); alert(message); return;
    }
    clearTimeout(notificationTimeout);
    ui.notificationMessage.textContent = message;
    ui.notificationArea.className = 'notification';
    ui.notificationArea.classList.add(type);
    ui.notificationArea.classList.add('show');
    ui.notificationArea.style.display = 'flex';
    notificationTimeout = setTimeout(hideNotification, duration);
}

function hideNotification() {
    if (!ui.notificationArea) return;
    ui.notificationArea.classList.remove('show');
    setTimeout(() => {
         if (!ui.notificationArea.classList.contains('show')) {
             ui.notificationArea.style.display = 'none';
             ui.notificationArea.className = 'notification';
         }
    }, 500);
    clearTimeout(notificationTimeout);
}


// ===== FUNÇÕES DE INTERAÇÃO (Ações do Veículo) =====
function interagir(acao) {
    const veiculo = minhaGaragem.getVeiculoSelecionado();
    if (!veiculo) {
        showNotification("Selecione um veículo na lista lateral primeiro!", 'warning'); return;
    }

    let precisaSalvar = false;
    let acaoRealizada = false;
    let feedbackMsg = '';
    let feedbackType = 'info';

    try {
        switch (acao) {
            case 'ligar':
                 if(veiculo instanceof Carro) {
                     acaoRealizada = veiculo.ligar();
                     if(acaoRealizada) { precisaSalvar = true; feedbackMsg = `${veiculo.modelo} ligado.`; feedbackType = 'success'; }
                     else { feedbackMsg = `${veiculo.modelo} já estava ligado.`; feedbackType = 'info';}
                 } else feedbackMsg = "Ação 'ligar' não aplicável.";
                break;
            case 'desligar':
                 if(veiculo instanceof Carro) {
                     acaoRealizada = veiculo.desligar();
                     if(acaoRealizada) { precisaSalvar = true; feedbackMsg = `${veiculo.modelo} desligado.`; feedbackType = 'success'; }
                      else { feedbackMsg = `${veiculo.modelo} já estava desligado.`; feedbackType = 'info';}
                 } else feedbackMsg = "Ação 'desligar' não aplicável.";
                break;
            case 'acelerar':
                 if(veiculo instanceof Carro) {
                     acaoRealizada = veiculo.acelerar();
                     if(acaoRealizada) precisaSalvar = true;
                 } else feedbackMsg = "Ação 'acelerar' não aplicável.";
                break;
            case 'frear':
                 if(veiculo instanceof Carro) {
                     acaoRealizada = veiculo.frear();
                      if(acaoRealizada) precisaSalvar = true;
                 } else feedbackMsg = "Ação 'frear' não aplicável.";
                break;
            case 'ativarTurbo':
                if (veiculo instanceof CarroEsportivo) {
                    acaoRealizada = veiculo.ativarTurbo();
                    if (acaoRealizada) precisaSalvar = true;
                } else feedbackMsg = "Ação 'Boost' não aplicável.";
                break;
            case 'carregar':
                if (veiculo instanceof Caminhao) {
                     acaoRealizada = veiculo.carregar(); // Usa quantidade default
                     if (acaoRealizada) precisaSalvar = true;
                } else feedbackMsg = "Ação 'carregar' não aplicável.";
                break;
             case 'descarregar':
                 if (veiculo instanceof Caminhao) {
                     acaoRealizada = veiculo.descarregar(); // Usa quantidade default
                     if (acaoRealizada) precisaSalvar = true;
                 } else feedbackMsg = "Ação 'descarregar' não aplicável.";
                break;
            case 'removerVeiculo':
                if (confirm(`ATENÇÃO!\n\nRemover permanentemente ${veiculo.modelo} (${veiculo.cor}) da garagem?\n\nEsta ação NÃO pode ser desfeita.`)) {
                     if(minhaGaragem.removerVeiculo(veiculo.id)) {
                          showNotification(`${veiculo.modelo} removido permanentemente.`, 'success');
                     }
                     return; // Sai da função interagir
                } else {
                    return; // Usuário cancelou
                }
            default:
                console.warn("Ação não reconhecida:", acao);
                feedbackMsg = `Ação desconhecida: ${acao}`;
                feedbackType = 'error';
        }

        if (feedbackMsg && !feedbackMsg.includes('não aplicável')) { // Evita notificar ações não aplicáveis
            showNotification(feedbackMsg, feedbackType, 2500);
        }
        if (precisaSalvar) {
            minhaGaragem.salvarNoLocalStorage();
        }

    } catch (error) {
        console.error(`Erro ao executar ação '${acao}' para ${veiculo?.modelo}:`, error);
        showNotification(`Ocorreu um erro inesperado ao executar a ação '${acao}'. Verifique o console.`, 'error');
    } finally {
        if (acao !== 'removerVeiculo') {
            // Apenas atualiza o painel, pois a lista não muda com ações internas
            atualizarPainelVeiculoSelecionado();
        }
    }
}


// ===== FUNÇÕES DE GERENCIAMENTO DE VEÍCULOS =====
function adicionarNovoVeiculo() {
    const tipo = ui.novoVeiculoTipo.value;
    const modelo = ui.novoVeiculoModelo.value.trim();
    const cor = ui.novoVeiculoCor.value.trim();
    const capacidadeStr = ui.novoVeiculoCapacidade.value;
    const capacidadeCarga = tipo === 'Caminhao' ? parseInt(capacidadeStr, 10) : 0;

    if (!tipo) { showNotification("Selecione o tipo.", 'warning'); ui.novoVeiculoTipo.focus(); return; }
    if (!modelo) { showNotification("Informe o modelo.", 'warning'); ui.novoVeiculoModelo.focus(); return; }
    if (!cor) { showNotification("Informe a cor.", 'warning'); ui.novoVeiculoCor.focus(); return; }
    if (tipo === 'Caminhao' && (!capacidadeStr || isNaN(capacidadeCarga) || capacidadeCarga <= 0)) {
        showNotification("Informe uma capacidade de carga válida (kg).", 'warning');
        ui.novoVeiculoCapacidade.focus(); return;
    }

    let novoVeiculo = null;
    try {
        switch (tipo) {
            case 'Carro': novoVeiculo = new Carro(modelo, cor); break;
            case 'CarroEsportivo': novoVeiculo = new CarroEsportivo(modelo, cor); break;
            case 'Caminhao': novoVeiculo = new Caminhao(modelo, cor, capacidadeCarga); break;
            default: showNotification("Tipo inválido.", 'error'); return;
        }
    } catch (error) {
        console.error("Erro ao criar veículo:", error);
        showNotification(`Erro: ${error.message}`, 'error'); return;
    }

    if (minhaGaragem.adicionarVeiculo(novoVeiculo)) {
        minhaGaragem.salvarNoLocalStorage();
        showNotification(`${novoVeiculo.modelo} adicionado!`, 'success');
        ui.formNovoVeiculo.reset();
        ui.divCapacidadeCaminhao.style.display = 'none';
        ui.modalAdicionar.close();
        minhaGaragem.selecionarVeiculo(novoVeiculo.id); // Seleciona e atualiza UI
    } else {
         showNotification("Não foi possível adicionar (verifique console).", 'warning');
         ui.novoVeiculoModelo.focus();
    }
}

function agendarOuRegistrarManutencao(e) {
    e.preventDefault();
    const veiculo = minhaGaragem.getVeiculoSelecionado();
    if (!veiculo) {
        showNotification("Selecione um veículo!", 'warning'); return;
    }

    const dataHora = ui.manutencaoDataHora.value;
    const tipo = ui.manutencaoTipo.value.trim();
    const custoStr = ui.manutencaoCusto.value;
    const descricao = ui.manutencaoDescricao.value.trim();

    if (!dataHora) { showNotification("Selecione data/hora.", 'warning'); ui.manutencaoDataHora.focus(); return; }
    if (!tipo) { showNotification("Informe o tipo de serviço.", 'warning'); ui.manutencaoTipo.focus(); return; }

    let novaManutencao;
    try {
         novaManutencao = new Manutencao(dataHora, tipo, custoStr, descricao);
    } catch (error) {
         console.error("Erro ao criar Manutencao:", error);
         showNotification("Erro nos dados da manutenção (verifique data).", 'error'); return;
    }

    if (veiculo.adicionarManutencao(novaManutencao)) {
        minhaGaragem.salvarNoLocalStorage();
        ui.formManutencao.reset();
        atualizarPainelVeiculoSelecionado(); // Atualiza listas de manutenção
        showNotification("Registro salvo!", 'success');
    }
}

function removerManutencaoItem(idManutencao) {
     const veiculo = minhaGaragem.getVeiculoSelecionado();
     if (!veiculo) {
         showNotification("Erro: Veículo não selecionado.", 'error'); return;
     }
     const itemParaRemover = veiculo.historicoManutencao.find(m => m.id === idManutencao);
     const msgConfirm = itemParaRemover
        ? `Remover:\n"${itemParaRemover.retornarFormatada(true)}"?`
        : "Remover este item?";

     if (confirm(msgConfirm)) {
         if (veiculo.removerManutencao(idManutencao)) {
             minhaGaragem.salvarNoLocalStorage();
             atualizarPainelVeiculoSelecionado(); // Atualiza listas
             showNotification("Item removido.", 'success', 2000);
         }
     }
}

// --- FUNÇÕES DE ATUALIZAÇÃO DA INTERFACE ---

function atualizarListaVeiculosSidebar() {
    const listaUl = ui.listaVeiculosSidebar;
    if (!listaUl) return;
    listaUl.innerHTML = '';

    if (minhaGaragem.veiculos.length === 0) {
        listaUl.innerHTML = '<li class="placeholder">Nenhum veículo na garagem.</li>'; return;
    }

    minhaGaragem.veiculos.forEach(v => { // Já está ordenada na garagem
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
                 minhaGaragem.selecionarVeiculo(v.id);
             }
        });
        listaUl.appendChild(li);
    });
}

function ativarTab(tabId) {
    ui.tabContents.forEach(content => content.classList.toggle('active', content.id === tabId));
    ui.tabLinks.forEach(link => link.classList.toggle('active', link.dataset.tab === tabId));
    // console.log(`Aba ativa: ${tabId}`);
}

function atualizarPainelVeiculoSelecionado() {
    const veiculo = minhaGaragem.getVeiculoSelecionado();

    if (veiculo) {
        ui.painelVeiculoSelecionado.style.display = 'block';
        ui.mensagemSelecione.style.display = 'none';

        // 1. Header
        const baseInfo = veiculo.exibirInformacoesBase();
        ui.infoModeloTipo.textContent = `${baseInfo.modelo} (${veiculo.constructor.name})`;
        ui.infoCor.textContent = baseInfo.cor;
        ui.infoId.textContent = baseInfo.id;
        ui.botaoRemoverVeiculoHeader.style.display = 'inline-flex';

        // ===== AQUI SELECIONA A IMAGEM CORRETA =====
        let imagemSrc = 'imagens/carro_normal.png'; // Padrão
        if (veiculo instanceof CarroEsportivo) {
            imagemSrc = 'imagens/carro_esportivo.png';
        } else if (veiculo instanceof Caminhao) {
            imagemSrc = 'imagens/caminhaoo.png';
        }
        ui.imagemVeiculo.src = imagemSrc; // Define o src
        ui.imagemVeiculo.alt = `Imagem de ${veiculo.modelo}`; // Define o alt text
        // ============================================

        // --- Aba Visão Geral ---
        ui.infoEspecifica.innerHTML = '';
        ui.barraProgressoContainer.style.display = 'none';
        ui.infoStatusMotor.parentElement.style.display = 'none';
        // Esconde botões por padrão, mostra só os aplicáveis
        ui.botoesAcoes.querySelectorAll('button').forEach(btn => btn.style.display = 'none');


        if (veiculo instanceof Carro) {
            const dadosCarro = veiculo.getDadosEspecificos();
            // Mostra botões comuns de carro
            ui.botoesAcoes.querySelector('[onclick*="ligar"]').style.display = 'inline-flex';
            ui.botoesAcoes.querySelector('[onclick*="desligar"]').style.display = 'inline-flex';
            ui.botoesAcoes.querySelector('[onclick*="acelerar"]').style.display = 'inline-flex';
            ui.botoesAcoes.querySelector('[onclick*="frear"]').style.display = 'inline-flex';

            // Status Motor
            ui.infoStatusMotor.parentElement.style.display = 'block';
             ui.infoStatusMotor.innerHTML = dadosCarro.ligado
                ? "<i class='fas fa-circle status-on'></i> Ligado"
                : "<i class='fas fa-circle status-off'></i> Desligado";

             // Velocidade e Barra
            ui.barraProgressoContainer.style.display = 'flex';
            ui.velocidadeAtual.textContent = `${Math.round(dadosCarro.velocidade)} km/h`;
            atualizarBarraProgresso(dadosCarro.velocidade, dadosCarro.velocidadeMaxima);

            // Infos e Botões Específicos
            if (veiculo instanceof CarroEsportivo) {
                 ui.infoEspecifica.innerHTML = `<p><i class="fas fa-bolt"></i> Boost Disponível: <span>${!dadosCarro.turboBoostUsado ? 'Sim' : 'Não'}</span></p>`;
                 ui.botaoTurbo.style.display = 'inline-flex';
                 ui.botaoTurbo.disabled = dadosCarro.turboBoostUsado || !dadosCarro.ligado;
            } else if (veiculo instanceof Caminhao) {
                 ui.infoEspecifica.innerHTML = `<p><i class="fas fa-weight-hanging"></i> Carga: <span>${dadosCarro.cargaAtual} / ${dadosCarro.capacidadeCarga} kg</span></p>`;
                 ui.botaoCarregar.style.display = 'inline-flex';
                 ui.botaoDescarregar.style.display = 'inline-flex';
                 ui.botaoCarregar.disabled = dadosCarro.ligado || dadosCarro.cargaAtual >= dadosCarro.capacidadeCarga;
                 ui.botaoDescarregar.disabled = dadosCarro.ligado || dadosCarro.cargaAtual === 0;
            }

             // Habilita/desabilita botões comuns
             ui.botoesAcoes.querySelector('[onclick*="ligar"]').disabled = dadosCarro.ligado;
             ui.botoesAcoes.querySelector('[onclick*="desligar"]').disabled = !dadosCarro.ligado;
             ui.botoesAcoes.querySelector('[onclick*="acelerar"]').disabled = !dadosCarro.ligado || dadosCarro.velocidade >= dadosCarro.velocidadeMaxima;
             ui.botoesAcoes.querySelector('[onclick*="frear"]').disabled = !dadosCarro.ligado || dadosCarro.velocidade === 0;

        } else {
            // Caso não seja um Carro (ex: Veiculo base, se existir)
             ui.infoEspecifica.innerHTML = '<p><i>Este veículo não possui ações interativas de condução.</i></p>';
        }

        // --- Aba Manutenção ---
        renderizarListaManutencao(ui.historicoUl, veiculo.getHistoricoPassadoFormatado(), "Histórico");
        renderizarListaManutencao(ui.agendamentosUl, veiculo.getAgendamentosFuturosFormatados(), "Agendamentos");

    } else {
        // Nenhum veículo selecionado
        ui.painelVeiculoSelecionado.style.display = 'none';
        ui.mensagemSelecione.style.display = 'block';
    }
}

function atualizarBarraProgresso(velocidade, velocidadeMaxima) {
    const bolinhas = ui.barraProgresso.querySelectorAll('.bolinha');
    if (!bolinhas || bolinhas.length === 0) return;

    const maxVel = velocidadeMaxima > 0 ? velocidadeMaxima : 1;
    const porcentagem = Math.max(0, Math.min(1, velocidade / maxVel));
    // Arredonda para o inteiro mais próximo de bolinhas ativas
    const numBolinhasAtivas = Math.round(porcentagem * bolinhas.length);

    bolinhas.forEach((bolinha, index) => {
        bolinha.classList.toggle('ativa', index < numBolinhasAtivas);
    });
}

function renderizarListaManutencao(ulElement, itens, tipoLista) {
     if (!ulElement) {
          console.error(`Elemento UL para lista de ${tipoLista} não encontrado`); return;
     }
     ulElement.innerHTML = '';

     if (itens.length === 0) {
          ulElement.innerHTML = `<li style="font-style: italic; color: #888; text-align: center; padding: 15px;">Nenhum registro de ${tipoLista.toLowerCase()} encontrado.</li>`;
          return;
     }

     itens.forEach(item => {
         const li = document.createElement('li');
         const textoSpan = document.createElement('span');
         textoSpan.textContent = item.texto;
         li.appendChild(textoSpan);

         const removeButton = document.createElement('button');
         removeButton.className = 'botao-remover-item';
         removeButton.title = 'Remover este item';
         removeButton.innerHTML = '<i class="fas fa-times"></i>';
         removeButton.onclick = () => removerManutencaoItem(item.id);

         li.appendChild(removeButton);
         ulElement.appendChild(li);
     });
}

function atualizarInterfaceCompleta() {
    // console.log("Atualizando interface completa..."); // Log opcional
    atualizarListaVeiculosSidebar();
    atualizarPainelVeiculoSelecionado();
}

// --- INICIALIZAÇÃO e Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Carregado. Iniciando Garagem...");
    minhaGaragem.carregarDoLocalStorage();

    // --- Configura Listeners ---
    if (ui.btnAbrirModalAdicionar && ui.modalAdicionar) {
        ui.btnAbrirModalAdicionar.addEventListener('click', () => {
            ui.formNovoVeiculo.reset();
            ui.divCapacidadeCaminhao.style.display = 'none';
            ui.modalAdicionar.showModal();
        });
    }
    if (ui.btnFecharModalAdicionar && ui.modalAdicionar) {
        ui.btnFecharModalAdicionar.addEventListener('click', () => ui.modalAdicionar.close());
    }
    if (ui.modalAdicionar) {
        ui.modalAdicionar.addEventListener('click', (event) => {
            if (event.target === ui.modalAdicionar) ui.modalAdicionar.close();
        });
    }
    if (ui.formNovoVeiculo) {
        ui.formNovoVeiculo.addEventListener('submit', (event) => {
            event.preventDefault(); adicionarNovoVeiculo();
        });
    }
    if (ui.novoVeiculoTipo) {
        ui.novoVeiculoTipo.addEventListener('change', (event) => {
            ui.divCapacidadeCaminhao.style.display = (event.target.value === 'Caminhao') ? 'block' : 'none';
        });
    }
    ui.tabLinks.forEach(button => {
        button.addEventListener('click', () => ativarTab(button.dataset.tab));
    });
    if (ui.formManutencao) {
         ui.formManutencao.addEventListener('submit', agendarOuRegistrarManutencao);
    }
    if (ui.notificationCloseBtn) {
        ui.notificationCloseBtn.addEventListener('click', hideNotification);
    }

    // -- Inicializa a Interface --
    ativarTab('tab-visao-geral'); // Garante aba inicial
    atualizarInterfaceCompleta(); // Desenha estado inicial

    // Verifica agendamentos (com delay)
    setTimeout(() => {
        if(minhaGaragem.veiculos.length > 0) minhaGaragem.verificarAgendamentosProximos();
    }, 2000);

    console.log("Garagem inicializada e interface pronta.");
});