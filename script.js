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
  
    acelerar(incremento) {
      if (this.ligado) {
        this.velocidade += incremento;
        console.log(`${this.modelo} acelerando. Velocidade: ${this.velocidade} km/h`);
      } else {
        console.log('Ligue o carro primeiro!');
      }
    }
  
    frear(decremento) {
      this.velocidade = Math.max(0, this.velocidade - decremento); // Impede velocidade negativa
      console.log(`${this.modelo} freando. Velocidade: ${this.velocidade} km/h`);
    }
  }
  
  class CarroEsportivo extends Carro {
    constructor(modelo, cor) {
      super(modelo, cor); // Chama o construtor da classe Carro
      this.turboAtivado = false;
    }
  
    ativarTurbo() {
      if (this.ligado) {
        this.turboAtivado = true;
        this.acelerar(50); // Acelera mais rápido com o turbo
        console.log('Turbo ativado!');
      } else {
        console.log('Ligue o carro antes de ativar o turbo!');
      }
    }
  
    desativarTurbo() {
      this.turboAtivado = false;
      console.log('Turbo desativado!');
    }
  
    acelerar(incremento) {
      super.acelerar(incremento * 1.5); // Aceleração ainda maior com o turbo
    }
  }
  
  class Caminhao extends Carro {
    constructor(modelo, cor, capacidadeCarga) {
      super(modelo, cor);
      this.capacidadeCarga = capacidadeCarga;
      this.cargaAtual = 0;
    }
  
    carregar(quantidade) {
      if (this.cargaAtual + quantidade <= this.capacidadeCarga) {
        this.cargaAtual += quantidade;
        console.log(`Caminhão carregado. Carga atual: ${this.cargaAtual} kg`);
      } else {
        console.log('Carga excede a capacidade do caminhão!');
      }
    }
  
    descarregar(quantidade) {
      if (this.cargaAtual - quantidade >= 0) {
        this.cargaAtual -= quantidade;
        console.log(`Caminhão descarregado. Carga atual: ${this.cargaAtual} kg`);
      } else {
        console.log('Não há carga suficiente para descarregar!');
      }
    }
  
    exibirCapacidade() {
      console.log(`Capacidade máxima de carga: ${this.capacidadeCarga} kg`);
    }
  }
  
  // *** NOVO: Variáveis e Funções para o Carro Normal ***
  let carroNormal;
  
  function criarCarroNormal() {
    const modelo = document.getElementById('modeloNormal').value;
    const cor = document.getElementById('corNormal').value;
    carroNormal = new Carro(modelo, cor);
    exibirInfoNormal();
  }
  
  function ligarNormal() {
    if (carroNormal) {
      carroNormal.ligar();
      exibirInfoNormal();
    } else {
      alert('Crie o carro normal primeiro!');
    }
  }
  
  function desligarNormal() {
    if (carroNormal) {
      carroNormal.desligar();
      exibirInfoNormal();
    } else {
      alert('Crie o carro normal primeiro!');
    }
  }
  
  function acelerarNormal() {
    if (carroNormal) {
      carroNormal.acelerar(10);
      exibirInfoNormal();
    } else {
      alert('Crie o carro normal primeiro!');
    }
  }
  
  function frearNormal() {
    if (carroNormal) {
      carroNormal.frear(10);
      exibirInfoNormal();
    } else {
      alert('Crie o carro normal primeiro!');
    }
  }
  
  
  function exibirInfoNormal() {
    if (carroNormal) {
      const info = `Modelo: ${carroNormal.modelo}, Cor: ${carroNormal.cor}, Ligado: ${carroNormal.ligado}, Velocidade: ${carroNormal.velocidade} km/h`;
      document.getElementById('infoNormal').textContent = info;
    }
  }
  
  
  // Variáveis globais para os objetos
  let carroEsportivo;
  let caminhao;
  
  // Funções para o Carro Esportivo
  function criarCarroEsportivo() {
    const modelo = document.getElementById('modeloEsportivo').value;
    const cor = document.getElementById('corEsportivo').value;
    carroEsportivo = new CarroEsportivo(modelo, cor);
    exibirInfoEsportivo();
  }
  
  function ligarEsportivo() {
    if (carroEsportivo) {
      carroEsportivo.ligar();
      exibirInfoEsportivo();
    } else {
      alert('Crie o carro esportivo primeiro!');
    }
  }
  
  function desligarEsportivo() {
    if (carroEsportivo) {
      carroEsportivo.desligar();
      exibirInfoEsportivo();
    } else {
      alert('Crie o carro esportivo primeiro!');
    }
  }
  
  function acelerarEsportivo() {
    if (carroEsportivo) {
      carroEsportivo.acelerar(10);
      exibirInfoEsportivo();
    } else {
      alert('Crie o carro esportivo primeiro!');
  
  
    }
  }
  
  
  function ativarTurbo() {
    if (carroEsportivo) {
      carroEsportivo.ativarTurbo();
      exibirInfoEsportivo();
    } else {
      alert('Crie o carro esportivo primeiro!');
    }
  }
  
  function desativarTurbo() {
    if (carroEsportivo) {
      carroEsportivo.desativarTurbo();
      exibirInfoEsportivo();
    } else {
      alert('Crie o carro esportivo primeiro!');
    }
  }
  
  
  function exibirInfoEsportivo() {
    if (carroEsportivo) {
      const info = `Modelo: ${carroEsportivo.modelo}, Cor: ${carroEsportivo.cor}, Ligado: ${carroEsportivo.ligado}, Velocidade: ${carroEsportivo.velocidade}, Turbo: ${carroEsportivo.turboAtivado}`;
      document.getElementById('infoEsportivo').textContent = info;
    }
  }
  
  // Funções para o Caminhão
  function criarCaminhao() {
    const modelo = document.getElementById('modeloCaminhao').value;
    const cor = document.getElementById('corCaminhao').value;
    const capacidade = parseInt(document.getElementById('capacidadeCaminhao').value);
    caminhao = new Caminhao(modelo, cor, capacidade);
    exibirInfoCaminhao();
  }
  
  function carregarCaminhao() {
    if (caminhao) {
      const quantidade = parseInt(document.getElementById('carga').value);
      caminhao.carregar(quantidade);
      exibirInfoCaminhao();
    } else {
      alert('Crie o caminhão primeiro!');
    }
  }
  
  function descarregarCaminhao() {
    if (caminhao) {
      const quantidade = parseInt(document.getElementById('carga').value);
      caminhao.descarregar(quantidade);
      exibirInfoCaminhao();
    } else {
      alert('Crie o caminhão primeiro!');
    }
  }
  
  function ligarCaminhao() {
    if (caminhao) {
      caminhao.ligar();
      exibirInfoCaminhao();
    } else {
      alert('Crie o caminhão primeiro!');
    }
  }
  
  function desligarCaminhao() {
    if (caminhao) {
      caminhao.desligar();
      exibirInfoCaminhao();
    } else {
      alert('Crie o caminhão primeiro!');
    }
  }
  
  function acelerarCaminhao() {
    if (caminhao) {
      caminhao.acelerar(5);
      exibirInfoCaminhao();
    } else {
      alert('Crie o caminhão primeiro!');
    }
  }
  
  function exibirCapacidade() {
    if (caminhao) {
      caminhao.exibirCapacidade();
    } else {
      alert('Crie o caminhão primeiro!');
    }
  }
  
  function exibirInfoCaminhao() {
    if (caminhao) {
      const info = `Modelo: ${caminhao.modelo}, Cor: ${caminhao.cor}, Ligado: ${caminhao.ligado}, Velocidade: ${caminhao.velocidade}, Carga: ${caminhao.cargaAtual}/${caminhao.capacidadeCarga} kg`;
      document.getElementById('infoCaminhao').textContent = info;
    }
  }