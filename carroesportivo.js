// js/models/carroEsportivo.js <-- ALTERADO: Nome do arquivo sugerido
'use strict';

import Carro from './carro.js';
// <-- ALTERADO: Removido import de showNotification

/**
 * Representa um Carro Esportivo, uma especialização de Carro.
 * @class CarroEsportivo
 * @extends Carro
 */
export default class CarroEsportivo extends Carro {
    /**
     * Cria uma instância de CarroEsportivo.
     * @param {string} modelo - O modelo.
     * @param {string} cor - A cor.
     * @param {string|null} [id=null] - O ID.
     * @param {boolean} [ligado=false] - Motor ligado/desligado.
     * @param {number} [velocidade=0] - Velocidade inicial.
     * @param {boolean} [turboBoostUsado=false] - Indica se o turbo já foi utilizado.
     */
    constructor(modelo, cor, id = null, ligado = false, velocidade = 0, turboBoostUsado = false) {
        super(modelo, cor, id, ligado, velocidade);
        this.velocidadeMaxima = 360; // <-- VELOCIDADE MÁXIMA CORRIGIDA (antes era 200?)
        this.turboBoostUsado = Boolean(turboBoostUsado);
    }

    /**
     * Ativa o Turbo Boost.
     * @returns {{success: boolean, message: string}} Objeto indicando sucesso e mensagem.
     * @public
     */
    ativarTurbo() { // <-- ALTERADO: Retorna objeto, remove showNotification
        if (!this.ligado) {
            return { success: false, message: 'Ligue o carro antes de usar o turbo boost!' };
        }
        if (this.turboBoostUsado) {
            return { success: false, message: 'O Turbo Boost já foi utilizado neste veículo!' };
        }
        if (this.velocidade <= 0) {
             return { success: false, message: 'Acelere um pouco antes de usar o turbo!' };
        }

        const boost = 50;
        const velocidadeAntiga = this.velocidade;
        this.velocidade = Math.min(this.velocidade + boost, this.velocidadeMaxima);
        this.turboBoostUsado = true;
        console.log(`TURBO BOOST ATIVADO! ${this.modelo} foi de ${velocidadeAntiga} para ${this.velocidade} km/h.`);
        return { success: true, message: 'Turbo Boost Ativado!' };
    }

    /**
     * Acelera o carro esportivo.
     * @returns {{success: boolean, message?: string}} Objeto indicando sucesso e mensagem.
     * @override
     * @public
     */
    acelerar() { // <-- ALTERADO: Retorna objeto
        if (!this.ligado) {
            console.warn(`${this.modelo} está desligado.`);
             return { success: false, message: 'Ligue o veículo primeiro!' }; // <-- ALTERADO
        }
         if (this.velocidade < this.velocidadeMaxima) {
            const incremento = 25;
            this.velocidade = Math.min(this.velocidade + incremento, this.velocidadeMaxima);
            console.log(`${this.modelo} (Esportivo) acelerou para: ${this.velocidade} km/h`);
            return { success: true }; // <-- ALTERADO
         } else {
             console.log(`${this.modelo} já está na velocidade máxima (${this.velocidadeMaxima} km/h)!`);
             return { success: false, message: `${this.modelo} já está na velocidade máxima!` }; // <-- ALTERADO
         }
    }

    /**
     * Retorna dados específicos do Carro Esportivo.
     * @returns {{ligado: boolean, velocidade: number, velocidadeMaxima: number, turboBoostUsado: boolean}} Objeto com o estado.
     * @override
     * @public
     */
    getDadosEspecificos() {
        const dadosPai = super.getDadosEspecificos();
        return {
            ...dadosPai,
            velocidadeMaxima: this.velocidadeMaxima,
            turboBoostUsado: this.turboBoostUsado
        };
    }

    /**
     * Retorna uma representação JSON do CarroEsportivo.
     * @returns {object} Objeto serializável.
     * @override
     * @public
     */
    toJSON() {
        const baseJSON = super.toJSON();
        return {
            ...baseJSON,
            _tipoClasse: 'CarroEsportivo',
            turboBoostUsado: this.turboBoostUsado
        };
    }
}