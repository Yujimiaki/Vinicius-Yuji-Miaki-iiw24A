// Classes
class Carro {
  constructor(modelo, cor) {
      this.modelo = modelo;
      this.cor = cor;
      this.ligado = false;
      this.velocidade = 0;
      this.velocidadeMaxima = 150; // km/h
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
          this.velocidade = Math.min(this.velocidade + 10, this.velocidadeMaxima);
          console.log(`${this.modelo} acelerando. Velocidade: ${this.velocidade} km/h`);
          atualizarBarraProgresso(this.velocidade, this.velocidadeMaxima);
      } else {
          console.log('Ligue o carro primeiro!');
      }
  }

  frear() {
      this.velocidade = Math.max(0, this.velocidade - 10);
      console.log(`${this.modelo} freando. Velocidade: ${this.velocidade} km/h`);
      atualizarBarraProgresso(this.velocidade, this.velocidadeMaxima);
  }

  exibirInformacoes() {
      return `Modelo: ${this.modelo}, Cor: ${this.cor}, Ligado: ${this.ligado ? 'Sim' : 'Não'}, Velocidade: ${this.velocidade} km/h`;
  }
}

class CarroEsportivo extends Carro {
  constructor(modelo, cor) {
      super(modelo, cor);
      this.velocidadeMaxima = 360; // km/h
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
          this.velocidade = Math.min(this.velocidade + 20, this.velocidadeMaxima);
          console.log(`${this.modelo} acelerando com turbo. Velocidade: ${this.velocidade} km/h`);
          atualizarBarraProgresso(this.velocidade, this.velocidadeMaxima);
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
      this.velocidadeMaxima = 120; // km/h
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

  acelerar() {
      if (this.ligado) {
          this.velocidade = Math.min(this.velocidade + 5, this.velocidadeMaxima);
          console.log(`${this.modelo} acelerando. Velocidade: ${this.velocidade} km/h`);
          atualizarBarraProgresso(this.velocidade, this.velocidadeMaxima);
      } else {
          console.log('Ligue o carro primeiro!');
      }
  }

  frear() {
      this.velocidade = Math.max(0, this.velocidade - 5);
      console.log(`${this.modelo} freando. Velocidade: ${this.velocidade} km/h`);
      atualizarBarraProgresso(this.velocidade, this.velocidadeMaxima);
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

// Funções de interação
function selecionarVeiculo(tipoVeiculo) {
  let imagemSrc = "";

  switch (tipoVeiculo) {
      case 'meuCarro':
          veiculoSelecionado = meuCarro;
          imagemSrc = "imagens/carro_normal.png";
          break;
      case 'meuCarroEsportivo':
          veiculoSelecionado = meuCarroEsportivo;
          imagemSrc = "imagens/carro_esportivo.png";
          break;
      case 'meuCaminhao':
          veiculoSelecionado = meuCaminhao;
          imagemSrc = "imagens/caminhao.png";
          break;
      default:
          console.log("Veículo não reconhecido.");
          veiculoSelecionado = null;
  }

  console.log(`Veículo selecionado: ${tipoVeiculo}`);
  atualizarVisibilidadeBotoes();
  exibirInformacoes();

  // Inicializar a barra de progresso com a velocidade máxima do veículo
  if (veiculoSelecionado) {
      atualizarBarraProgresso(0, veiculoSelecionado.velocidadeMaxima);
  }

  // Atualizar a imagem do veículo
  const imagemVeiculo = document.getElementById("imagemVeiculo");
  imagemVeiculo.src = imagemSrc;
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
  atualizarBarraProgresso(veiculoSelecionado.velocidade, veiculoSelecionado.velocidadeMaxima);
}

function exibirInformacoes() {
  const informacoesDiv = document.getElementById("informacoesVeiculo");
  let iconeStatus = veiculoSelecionado && veiculoSelecionado.ligado ? '🟢' : '🔴'; // Emoji de bola verde/vermelha

  if (veiculoSelecionado) {
      informacoesDiv.innerHTML = `${veiculoSelecionado.exibirInformacoes()} - Status: ${iconeStatus}`;
  } else {
      informacoesDiv.textContent = `Nenhum veículo selecionado. Status: ${iconeStatus}`; // Exibe o status mesmo sem veículo selecionado
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

function atualizarBarraProgresso(velocidade, velocidadeMaxima) {
  const bolinhas = document.querySelectorAll('#barraProgresso .bolinha');
  const velocidadeAtualElement = document.getElementById('velocidadeAtual');

  // Calcular qual bolinha deve estar ativa
  const numBolinhasAtivas = Math.round((velocidade / velocidadeMaxima) * bolinhas.length);

  // Atualizar as bolinhas
  bolinhas.forEach((bolinha, index) => {
      if (index < numBolinhasAtivas) {
          bolinha.classList.add('ativa'); // Adiciona a classe 'ativa'
      } else {
          bolinha.classList.remove('ativa'); // Remove a classe 'ativa'
      }
  });

  // Atualizar a velocidade exibida
  velocidadeAtualElement.textContent = `${velocidade} km/h`;
}

// Inicialização: esconde os botões no carregamento da página
atualizarVisibilidadeBotoes();