class Carro {
    constructor(modelo, cor) {
        this.modelo = modelo;
        this.cor = cor;
        this.ligado = false;
        this.velocidade = 0;
    }

    ligar() {
        this.ligado = true;
        console.log(`${this.modelo} ligado.`);
    }

    desligar() {
        this.ligado = false;
        this.velocidade = 0;
        console.log(`${this.modelo} desligado.`);
    }

    acelerar() {
        if (this.ligado) {
            this.velocidade += 10;
            console.log(`${this.modelo} acelerando. Velocidade: ${this.velocidade} km/h`);
        } else {
            console.log('Ligue o carro primeiro!');
        }
    }

    frear() {
        this.velocidade = Math.max(0, this.velocidade - 10); // Impede velocidade negativa
        console.log(`${this.modelo} freando. Velocidade: ${this.velocidade} km/h`);
    }

    exibirInformacoes() {
        return `Modelo: ${this.modelo}, Cor: ${this.cor}, Ligado: ${this.ligado ? 'Sim' : 'Não'}, Velocidade: ${this.velocidade} km/h`;
    }
}

class CarroEsportivo extends Carro {
    constructor(modelo, cor) {
        super(modelo, cor);
        this.turboAtivado = false;
    }

    ativarTurbo() {
        if (this.ligado) {
            this.turboAtivado = true;
            this.acelerar();
            this.acelerar();
            console.log('Turbo ativado!');
        } else {
            console.log('Ligue o carro antes de ativar o turbo!');
        }
    }

    desativarTurbo() {
        this.turboAtivado = false;
        console.log('Turbo desativado!');
    }

    acelerar() {
        if (this.ligado) {
            this.velocidade += 20;
            console.log(`${this.modelo} acelerando com turbo. Velocidade: ${this.velocidade} km/h`);
        } else {
            console.log('Ligue o carro primeiro!');
        }
    }

    exibirInformacoes() {
        return `${super.exibirInformacoes()}, Turbo: ${this.turboAtivado ? 'Ativado' : 'Desativado'}`;
    }
}

class Caminhao extends Carro {
    constructor(modelo, cor, capacidadeCarga) {
        super(modelo, cor);
        this.capacidadeCarga = capacidadeCarga;
        this.cargaAtual = 0;
    }

    carregar() {
        const carga = 1000;
        if (this.cargaAtual + carga <= this.capacidadeCarga) {
            this.cargaAtual += carga;
            console.log(`Caminhão carregado. Carga atual: ${this.cargaAtual} kg`);
        } else {
            console.log('Carga excede a capacidade do caminhão!');
        }
    }

    descarregar() {
        const descarga = 500;
        if (this.cargaAtual - descarga >= 0) {
            this.cargaAtual -= descarga;
            console.log(`Caminhão descarregado. Carga atual: ${this.cargaAtual} kg`);
        } else {
            console.log('Não há carga suficiente para descarregar!');
        }
    }

    exibirInformacoes() {
        return `${super.exibirInformacoes()}, Carga: ${this.cargaAtual}/${this.capacidadeCarga} kg`;
    }
}

// Instâncias dos veículos
const meuCarro = new Carro("Sedan", "Prata");
const meuCarroEsportivo = new CarroEsportivo("Ferrari", "Vermelho");
const meuCaminhao = new Caminhao("Scania", "Azul", 10000);

let veiculoSelecionado = null;

function selecionarVeiculo(tipoVeiculo) {
    switch (tipoVeiculo) {
        case 'meuCarro':
            veiculoSelecionado = meuCarro;
            break;
        case 'meuCarroEsportivo':
            veiculoSelecionado = meuCarroEsportivo;
            break;
        case 'meuCaminhao':
            veiculoSelecionado = meuCaminhao;
            break;
        default:
            console.log("Veículo não reconhecido.");
            veiculoSelecionado = null;
    }
    console.log(`Veículo selecionado: ${tipoVeiculo}`);
    atualizarVisibilidadeBotoes();
    exibirInformacoes();
}

function interagir(acao) {
    if (!veiculoSelecionado) {
        alert("Selecione um veículo primeiro!");
        return;
    }

    switch (acao) {
        case 'ligar':
            veiculoSelecionado.ligar();
            break;
        case 'desligar':
            veiculoSelecionado.desligar();
            break;
        case 'acelerar':
            veiculoSelecionado.acelerar();
            break;
        case 'frear':
            veiculoSelecionado.frear();
            break;
        case 'ativarTurbo':
            if (veiculoSelecionado instanceof CarroEsportivo) {
                veiculoSelecionado.ativarTurbo();
            } else {
                alert("Esta ação não é aplicável a este veículo.");
            }
            break;
        case 'desativarTurbo':
            if (veiculoSelecionado instanceof CarroEsportivo) {
                veiculoSelecionado.desativarTurbo();
            } else {
                alert("Esta ação não é aplicável a este veículo.");
            }
            break;
        case 'carregar':
            if (veiculoSelecionado instanceof Caminhao) {
                veiculoSelecionado.carregar();
            } else {
                alert("Esta ação não é aplicável a este veículo.");
            }
            break;
        case 'descarregar':
            if (veiculoSelecionado instanceof Caminhao) {
                veiculoSelecionado.descarregar();
            } else {
                alert("Esta ação não é aplicável a este veículo.");
            }
            break;
        default:
            console.log("Ação não reconhecida.");
    }
    exibirInformacoes();
}

function exibirInformacoes() {
    const informacoesDiv = document.getElementById("informacoesVeiculo");
    if (veiculoSelecionado) {
        informacoesDiv.textContent = veiculoSelecionado.exibirInformacoes();
    } else {
        informacoesDiv.textContent = "Nenhum veículo selecionado.";
    }
}

function atualizarVisibilidadeBotoes() {
    document.getElementById('botaoTurbo').style.display = 'none';
    document.getElementById('botaoDesativarTurbo').style.display = 'none';
    document.getElementById('botaoCarregar').style.display = 'none';
    document.getElementById('botaoDescarregar').style.display = 'none';

    if (veiculoSelecionado instanceof CarroEsportivo) {
        document.getElementById('botaoTurbo').style.display = 'inline-block';
        document.getElementById('botaoDesativarTurbo').style.display = 'inline-block';
    } else if (veiculoSelecionado instanceof Caminhao) {
        document.getElementById('botaoCarregar').style.display = 'inline-block';
        document.getElementById('botaoDescarregar').style.display = 'inline-block';
    }
}

// Inicialização: esconde os botões no carregamento da página
atualizarVisibilidadeBotoes();