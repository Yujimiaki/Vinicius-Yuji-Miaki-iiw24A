class Carro {
  constructor(modelo, cor) {
      this.modelo = modelo;
      this.cor = cor;
      this.velocidade = 0; // Novo atributo
      this.ligado = false;
      // Criação dos objetos de áudio
      this.somLigar = new Audio('som/LIGANDO UMA LAMBORGHINI.mp3');
      this.somDesligar = new Audio('som/Turn off Ferrari.mp3');
  }

  ligar() {
      this.ligado = true;
      this.atualizarStatus();
      this.somLigar.play(); // Toca o som de ligar
  }

  desligar() {
      this.ligado = false;
      this.velocidade = 0; // Reseta a velocidade ao desligar
      this.atualizarStatus();
      this.atualizarVelocidade(); // Garante que a velocidade seja exibida como 0
      this.somDesligar.play(); // Toca o som de desligar
  }

  acelerar() {
      if (this.ligado) {
          this.velocidade += 10; // Aumenta a velocidade em 10
          this.atualizarVelocidade();
      }
  }

  desacelerar() {
      if (this.ligado && this.velocidade > 0) {
          this.velocidade -= 10; // Diminui a velocidade em 10
          if (this.velocidade < 0) {
              this.velocidade = 0; // Impede que a velocidade fique negativa
          }
          this.atualizarVelocidade();
      }
  }

  atualizarStatus() {
      const statusElement = document.getElementById('status');
      statusElement.textContent = this.ligado ? 'Ligado' : 'Desligado';
  }

  atualizarVelocidade() {
      const velocidadeElement = document.getElementById('velocidade');
      velocidadeElement.textContent = this.velocidade;
  }
}

// 2. Criação do Objeto Carro
const meuCarro = new Carro('Suv', 'Verde');

// 3. Atualização Inicial das Informações na Página
document.getElementById('modelo').textContent = meuCarro.modelo;
document.getElementById('cor').textContent = meuCarro.cor;
meuCarro.atualizarVelocidade();
meuCarro.atualizarStatus();

// 4. Manipulação dos Botões
const botaoLigarDesligar = document.getElementById('ligarDesligar');
const botaoAcelerar = document.getElementById('acelerar');
const botaoDesacelerar = document.getElementById('desacelerar'); // Novo Botão

botaoLigarDesligar.addEventListener('click', function() {
  if (meuCarro.ligado) {
      meuCarro.desligar();
      botaoLigarDesligar.textContent = 'Ligar';
  } else {
      meuCarro.ligar();
      botaoLigarDesligar.textContent = 'Desligar';
  }
});

botaoAcelerar.addEventListener('click', function() {
  meuCarro.acelerar();
});

botaoDesacelerar.addEventListener('click', function() { // Listener do Novo Botão
  meuCarro.desacelerar();
});