// js/models/CarroEsportivo.js
'use strict';

import Carro from './Carro.js'; // Assume que o arquivo se chama Carro.js

/**
 * Representa um Carro Esportivo, uma máquina veloz com um segredinho: o Nitro Boost!
 * Herda de Carro, mas com mais potência e estilo.
 * @class CarroEsportivo
 * @extends Carro
 */
export default class CarroEsportivo extends Carro {
    /**
     * Cria uma instância de CarroEsportivo.
     * @param {string} modelo - O modelo do bólido.
     * @param {string} cor - A cor vibrante da fera.
     * @param {string|null} [id=null] - O ID único na garagem.
     * @param {boolean} [ligado=false] - Motor roncando ou em silêncio?
     * @param {number} [velocidade=0] - Velocidade inicial (geralmente 0).
     * @param {boolean} [turboBoostUsado=false] - O Nitro já foi para o espaço?
     */
    constructor(modelo, cor, id = null, ligado = false, velocidade = 0, turboBoostUsado = false) {
        super(modelo, cor, id, ligado, velocidade);
        this.velocidadeMaxima = Math.max(280, Math.floor(Math.random() * (360 - 280 + 1)) + 280); // Velocidade máxima entre 280 e 360 km/h
        this.turboBoostUsado = Boolean(turboBoostUsado); // Garante que é booleano
    }

    /**
     * ATIVAR NITRO BOOST! 🚀 Libera uma dose extra de velocidade. Só pode ser usado uma vez!
     * @returns {{success: boolean, message: string}} Objeto indicando o resultado da ignição.
     * @public
     */
    ativarTurbo() {
        if (!this.ligado) {
            return { success: false, message: 'Motor desligado não tem Nitro! Ligue o carro primeiro. 🔑' };
        }
        if (this.turboBoostUsado) {
            return { success: false, message: '💨 Nitro já foi pro beleléu! Uma vez por corrida, lembra?' };
        }
        if (this.velocidade <= 0) {
             return { success: false, message: 'Pise um pouco no acelerador antes de soltar o Nitro! 🚦' };
        }

        // Boost proporcional à velocidade máxima, mas com um mínimo
        const boostAmount = Math.max(50, Math.floor(this.velocidadeMaxima * 0.25)); // 25% da VelMax ou 50km/h
        const velocidadeAntiga = this.velocidade;
        this.velocidade = Math.min(this.velocidade + boostAmount, this.velocidadeMaxima); // Não ultrapassa a máxima
        this.turboBoostUsado = true;
        console.log(`🚀💥 NITRO ATIVADO! ${this.modelo} saltou de ${velocidadeAntiga} para ${this.velocidade} km/h num piscar de olhos!`);
        return { success: true, message: `🚀 NITROOO! ${this.modelo} ganhou um super empurrão!` };
    }

    /**
     * Acelera o carro esportivo. Aceleração mais agressiva que um carro normal.
     * @returns {{success: boolean, message?: string}} Objeto indicando o resultado.
     * @override
     * @public
     */
    acelerar() {
        if (!this.ligado) {
            // console.warn(`${this.modelo} está desligado. Não pode acelerar.`);
             return { success: false, message: 'Ligue a máquina primeiro! 🏁' };
        }
         if (this.velocidade < this.velocidadeMaxima) {
            // Incremento de velocidade maior para carros esportivos
            const incremento = Math.max(20, Math.floor(this.velocidadeMaxima * 0.1)); // 10% da VelMax ou 20km/h
            this.velocidade = Math.min(this.velocidade + incremento, this.velocidadeMaxima);
            // console.log(`${this.modelo} (Esportivo) acelerou para: ${this.velocidade} km/h`);
            return { success: true }; // UI pode não precisar de msg para cada aceleração
         } else {
             // console.log(`${this.modelo} já está no limite da velocidade máxima (${this.velocidadeMaxima} km/h)!`);
             return { success: false, message: `${this.modelo} está no máximo! Não dá pra ir mais rápido! 🌪️` };
         }
    }

    /**
     * Retorna dados específicos do Carro Esportivo, incluindo o estado do Nitro.
     * @returns {{ligado: boolean, velocidade: number, velocidadeMaxima: number, turboBoostUsado: boolean}} Objeto com o estado completo.
     * @override
     * @public
     */
    getDadosEspecificos() {
        const dadosPai = super.getDadosEspecificos(); // Pega dados de Carro (ligado, velocidade)
        return {
            ...dadosPai,
            velocidadeMaxima: this.velocidadeMaxima, // Sobrescreve com a velMax do esportivo
            turboBoostUsado: this.turboBoostUsado
        };
    }

    /**
     * Retorna uma representação JSON do CarroEsportivo, incluindo o estado do Nitro.
     * @returns {object} Objeto serializável para persistência.
     * @override
     * @public
     */
    toJSON() {
        const baseJSON = super.toJSON(); // Pega dados de Carro (e Veiculo)
        return {
            ...baseJSON,
            _tipoClasse: 'CarroEsportivo', // Fundamental para recriar a instância correta
            velocidadeMaxima: this.velocidadeMaxima, // Salva a velocidade máxima customizada
            turboBoostUsado: this.turboBoostUsado
        };
    }
}