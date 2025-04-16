// js/models/Caminhao.js
import Carro from './Carro.js';
// Idealmente, notificações sobre carga/descarga seriam gerenciadas no main.js
import { showNotification } from '../utils/notifications.js';

/**
 * Representa um Caminhão, uma especialização de Carro.
 * Possui capacidade de carga, métodos para carregar/descarregar,
 * e sua aceleração/frenagem são afetadas pela carga atual.
 * @class Caminhao
 * @extends Carro
 */
export default class Caminhao extends Carro {
    /**
     * Cria uma instância de Caminhao.
     * @param {string} modelo - O modelo do caminhão.
     * @param {string} cor - A cor do caminhão.
     * @param {number|string} capacidadeCarga - A capacidade máxima de carga em KG (deve ser um número positivo).
     * @param {string|null} [id=null] - O ID único do veículo.
     * @param {boolean} [ligado=false] - O estado inicial do motor.
     * @param {number} [velocidade=0] - A velocidade inicial.
     * @param {number|string} [cargaAtual=0] - A carga inicial em KG (não pode exceder a capacidade).
     * @throws {Error} Se a capacidade de carga for inválida (não numérica ou não positiva).
     */
    constructor(modelo, cor, capacidadeCarga, id = null, ligado = false, velocidade = 0, cargaAtual = 0) {
        // Valida a capacidade ANTES de chamar super() se necessário, ou deixa Carro validar modelo/cor primeiro.
        const capNum = Number(capacidadeCarga);
        if (isNaN(capNum) || capNum <= 0) {
            throw new Error("Capacidade de carga do caminhão deve ser um número positivo.");
        }

        super(modelo, cor, id, ligado, velocidade); // Chama o construtor de Carro

        /**
         * A capacidade máxima de carga do caminhão em KG.
         * @type {number}
         * @public
         */
        this.capacidadeCarga = capNum;

        /**
         * A quantidade atual de carga no caminhão em KG.
         * Limitada entre 0 e capacidadeCarga.
         * @type {number}
         * @public
         */
        this.cargaAtual = Math.max(0, Math.min(Number(cargaAtual) || 0, this.capacidadeCarga));

        /**
         * Velocidade máxima específica para caminhões.
         * @type {number}
         * @override
         * @public
         */
        this.velocidadeMaxima = 120; // Sobrescreve a velocidade máxima
    }

    /**
     * Adiciona carga ao caminhão, respeitando a capacidade máxima.
     * Requer que o caminhão esteja desligado.
     * @param {number} [quantidade=1000] - A quantidade de carga (KG) a adicionar.
     * @returns {boolean} True se alguma carga foi adicionada, false caso contrário.
     * @public
     */
    carregar(quantidade = 1000) {
        const uiRef = window.ui; // Dependência global temporária para notificação

        if (this.ligado) {
             showNotification("Desligue o caminhão para carregar/descarregar com segurança.", 'warning', 3000, uiRef);
             return false;
        }
        const quantNum = Number(quantidade);
        if (isNaN(quantNum) || quantNum <= 0) {
            showNotification("Quantidade inválida para carregar.", 'warning', 3000, uiRef);
             return false;
        }

        const espacoDisponivel = this.capacidadeCarga - this.cargaAtual;
        if (espacoDisponivel <= 0) {
             showNotification('Caminhão já está na capacidade máxima!', 'warning', 3000, uiRef);
             return false;
        }

        const cargaAdicionada = Math.min(quantNum, espacoDisponivel);
        this.cargaAtual += cargaAdicionada;
        console.log(`Carga adicionada: ${cargaAdicionada}kg. Carga atual: ${this.cargaAtual}kg / ${this.capacidadeCarga}kg.`);

        if (cargaAdicionada < quantNum) {
            showNotification(`Carga máxima atingida. ${cargaAdicionada}kg carregados. Carga atual: ${this.cargaAtual}kg`, 'warning', 3500, uiRef);
        } else {
            showNotification(`${cargaAdicionada}kg carregados. Carga atual: ${this.cargaAtual}kg`, 'success', 2500, uiRef);
        }
        return true; // Alguma carga foi adicionada
    }

    /**
     * Remove carga do caminhão.
     * Requer que o caminhão esteja desligado.
     * @param {number} [quantidade=500] - A quantidade de carga (KG) a remover.
     * @returns {boolean} True se alguma carga foi removida, false caso contrário.
     * @public
     */
    descarregar(quantidade = 500) {
        const uiRef = window.ui; // Dependência global temporária

        if (this.ligado) {
             showNotification("Desligue o caminhão para carregar/descarregar com segurança.", 'warning', 3000, uiRef);
             return false;
        }
        const quantNum = Number(quantidade);
         if (isNaN(quantNum) || quantNum <= 0) {
            showNotification("Quantidade inválida para descarregar.", 'warning', 3000, uiRef);
             return false;
        }

        if (this.cargaAtual <= 0) {
            showNotification('Caminhão já está vazio.', 'info', 3000, uiRef);
            return false;
        }

        const cargaRemovida = Math.min(quantNum, this.cargaAtual);
        this.cargaAtual -= cargaRemovida;
        console.log(`Carga removida: ${cargaRemovida}kg. Carga atual: ${this.cargaAtual}kg.`);
        showNotification(`${cargaRemovida}kg descarregados. Carga atual: ${this.cargaAtual}kg`, 'success', 2500, uiRef);
        return true; // Alguma carga foi removida
    }

     /**
      * Acelera o caminhão, considerando o peso da carga atual.
      * Caminhões mais pesados aceleram mais devagar.
      * @returns {boolean} True se acelerou, false caso contrário.
      * @override
      * @public
      */
     acelerar() {
        if (!this.ligado) {
             // Notificação gerenciada por quem chama (main.js)
            // showNotification('Ligue o caminhão primeiro!', 'warning', 3000, window.ui);
            return false;
        }
        if (this.velocidade < this.velocidadeMaxima) {
            // Fator de carga: 1.0 (vazio) a ~0.3 (cheio). Afeta o incremento.
            const fatorCarga = Math.max(0.3, 1 - (this.cargaAtual / (this.capacidadeCarga * 1.5)));
            const incrementoBase = 7; // Incremento base para caminhão
            const incremento = Math.max(1, Math.round(incrementoBase * fatorCarga)); // Mínimo de 1km/h

            this.velocidade = Math.min(this.velocidade + incremento, this.velocidadeMaxima);
            console.log(`${this.modelo} (Caminhão) acelerou para: ${this.velocidade} km/h (fator carga: ${fatorCarga.toFixed(2)})`);
            return true;
        } else {
            console.log(`${this.modelo} já está na velocidade máxima (${this.velocidadeMaxima} km/h)!`);
            return false;
        }
    }

    /**
     * Freia o caminhão, considerando o peso da carga atual.
     * Caminhões mais pesados freiam um pouco mais devagar (menor decremento).
     * @returns {boolean} True se freou, false se já estava parado.
     * @override
     * @public
     */
    frear() {
        if (this.velocidade > 0) {
             // Fator de carga para frenagem (um pouco menos sensível que aceleração)
             const fatorCarga = Math.max(0.4, 1 - (this.cargaAtual / (this.capacidadeCarga * 2.0)));
             const decrementoBase = 8;
             const decremento = Math.max(2, Math.round(decrementoBase * fatorCarga)); // Mínimo de 2km/h

            this.velocidade = Math.max(0, this.velocidade - decremento);
            console.log(`${this.modelo} (Caminhão) freou para: ${this.velocidade} km/h`);
            return true;
        }
         return false;
    }

    /**
     * Retorna dados específicos do Caminhão, incluindo informações de carga.
     * @returns {{ligado: boolean, velocidade: number, velocidadeMaxima: number, cargaAtual: number, capacidadeCarga: number}} Objeto com o estado.
     * @override
     * @public
     */
    getDadosEspecificos() {
        const dadosPai = super.getDadosEspecificos();
        return {
            ...dadosPai,
            velocidadeMaxima: this.velocidadeMaxima, // Vel max do caminhão
            cargaAtual: this.cargaAtual,
            capacidadeCarga: this.capacidadeCarga
        };
    }

    /**
     * Retorna uma representação JSON do Caminhao.
     * @returns {object} Objeto serializável representando o caminhão.
     * @override
     * @public
     */
    toJSON() {
        const baseJSON = super.toJSON();
        return {
            ...baseJSON,
            _tipoClasse: 'Caminhao', // Tipo correto
            capacidadeCarga: this.capacidadeCarga, // Salva capacidade
            cargaAtual: this.cargaAtual // Salva carga atual
        };
    }
}