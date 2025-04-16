// js/models/CarroEsportivo.js
import Carro from './Carro.js';
// Importar showNotification aqui viola um pouco o encapsulamento,
// idealmente as notificações sobre o turbo deveriam ser geradas no main.js
import { showNotification } from '../utils/notifications.js';

/**
 * Representa um Carro Esportivo, uma especialização de Carro.
 * Possui maior velocidade máxima, aceleração mais rápida e a funcionalidade de Turbo Boost.
 * @class CarroEsportivo
 * @extends Carro
 */
export default class CarroEsportivo extends Carro {
    /**
     * Cria uma instância de CarroEsportivo.
     * @param {string} modelo - O modelo do carro esportivo.
     * @param {string} cor - A cor do carro esportivo.
     * @param {string|null} [id=null] - O ID único do veículo.
     * @param {boolean} [ligado=false] - O estado inicial do motor.
     * @param {number} [velocidade=0] - A velocidade inicial.
     * @param {boolean} [turboBoostUsado=false] - Indica se o turbo já foi utilizado.
     */
    constructor(modelo, cor, id = null, ligado = false, velocidade = 0, turboBoostUsado = false) {
        super(modelo, cor, id, ligado, velocidade); // Chama o construtor de Carro

        /**
         * Velocidade máxima específica para carros esportivos.
         * @type {number}
         * @override
         * @public
         */
        this.velocidadeMaxima = 360; // Sobrescreve a velocidade máxima

        /**
         * Flag que indica se o turbo boost já foi ativado neste carro.
         * @type {boolean}
         * @public
         */
        this.turboBoostUsado = Boolean(turboBoostUsado);
    }

    /**
     * Ativa o Turbo Boost, aumentando significativamente a velocidade (uso único).
     * Requer que o carro esteja ligado, em movimento e que o turbo não tenha sido usado.
     * @returns {boolean} True se o turbo foi ativado com sucesso, false caso contrário.
     * @public
     */
    ativarTurbo() {
        // Reutiliza a referência 'ui' que esperamos estar global via main.js
        const uiRef = window.ui; // Ou passe 'ui' como argumento se preferir não usar global

        if (!this.ligado) {
            showNotification('Ligue o carro antes de usar o turbo boost!', 'warning', 3000, uiRef);
            return false;
        }
        if (this.turboBoostUsado) {
            showNotification('O Turbo Boost já foi utilizado neste veículo!', 'warning', 3000, uiRef);
            return false;
        }
        if (this.velocidade <= 0) { // Precisa estar em movimento
             showNotification('Acelere um pouco antes de usar o turbo!', 'info', 3000, uiRef);
             return false;
        }

        const boost = 50; // Incremento de velocidade do turbo
        const velocidadeAntiga = this.velocidade;
        this.velocidade = Math.min(this.velocidade + boost, this.velocidadeMaxima);
        this.turboBoostUsado = true; // Marca como usado
        console.log(`TURBO BOOST ATIVADO! ${this.modelo} foi de ${velocidadeAntiga} para ${this.velocidade} km/h.`);
        showNotification('Turbo Boost Ativado!', 'success', 3000, uiRef);
        return true;
    }

    /**
     * Acelera o carro esportivo (incremento maior que o carro normal).
     * Sobrescreve o método acelerar da classe Carro.
     * @returns {boolean} True se acelerou, false caso contrário.
     * @override
     * @public
     */
    acelerar() {
        if (!this.ligado) {
            console.warn(`${this.modelo} está desligado.`);
             // Notificação gerenciada por quem chama (main.js)
             // showNotification('Ligue o veículo primeiro!', 'warning', 3000, window.ui);
            return false;
        }
         if (this.velocidade < this.velocidadeMaxima) {
            const incremento = 25; // Incremento maior para esportivo
            this.velocidade = Math.min(this.velocidade + incremento, this.velocidadeMaxima);
            console.log(`${this.modelo} (Esportivo) acelerou para: ${this.velocidade} km/h`);
            return true;
         } else {
             console.log(`${this.modelo} já está na velocidade máxima (${this.velocidadeMaxima} km/h)!`);
             return false;
         }
    }

    /**
     * Retorna dados específicos do Carro Esportivo, incluindo o estado do turbo.
     * @returns {{ligado: boolean, velocidade: number, velocidadeMaxima: number, turboBoostUsado: boolean}} Objeto com o estado.
     * @override
     * @public
     */
    getDadosEspecificos() {
        // Pega dados do pai (Carro)
        const dadosPai = super.getDadosEspecificos();
        return {
            ...dadosPai,
            velocidadeMaxima: this.velocidadeMaxima, // Usa a velocidade máxima do esportivo
            turboBoostUsado: this.turboBoostUsado // Adiciona o estado do turbo
        };
    }

    /**
     * Retorna uma representação JSON do CarroEsportivo.
     * @returns {object} Objeto serializável representando o carro esportivo.
     * @override
     * @public
     */
    toJSON() {
        const baseJSON = super.toJSON(); // Pega JSON de Carro (que já inclui de Veiculo)
        return {
            ...baseJSON,
            _tipoClasse: 'CarroEsportivo', // Tipo correto
            turboBoostUsado: this.turboBoostUsado // Salva o estado do turbo
            // velocidadeMaxima não precisa salvar, é inerente à classe
        };
    }
}