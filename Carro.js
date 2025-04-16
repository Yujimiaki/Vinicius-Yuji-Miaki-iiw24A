// js/models/Carro.js
import Veiculo from './Veiculo.js';
// Esta classe também não deveria chamar showNotification diretamente.
// import { showNotification } from '../utils/notifications.js';

/**
 * Representa um Carro comum, herdando de Veiculo.
 * Adiciona funcionalidades de ligar/desligar motor, acelerar e frear,
 * além de controlar a velocidade atual e máxima.
 * @class Carro
 * @extends Veiculo
 */
export default class Carro extends Veiculo {
    /**
     * Cria uma instância de Carro.
     * @param {string} modelo - O modelo do carro.
     * @param {string} cor - A cor do carro.
     * @param {string|null} [id=null] - O ID único do veículo.
     * @param {boolean} [ligado=false] - O estado inicial do motor (ligado/desligado).
     * @param {number} [velocidade=0] - A velocidade inicial do carro (não negativa).
     */
    constructor(modelo, cor, id = null, ligado = false, velocidade = 0) {
        super(modelo, cor, id); // Chama o construtor da classe pai (Veiculo)

        /**
         * Indica se o motor do carro está ligado.
         * @type {boolean}
         * @public
         */
        this.ligado = Boolean(ligado);

        /**
         * A velocidade atual do carro em km/h. Não pode ser negativa.
         * @type {number}
         * @public
         */
        this.velocidade = Math.max(0, Number(velocidade) || 0);

        /**
         * A velocidade máxima que este tipo de carro pode atingir (km/h).
         * @type {number}
         * @public
         */
        this.velocidadeMaxima = 150; // Velocidade padrão para Carro normal
    }

    /**
     * Liga o motor do carro, se estiver desligado.
     * @returns {boolean} True se o motor foi ligado, false se já estava ligado.
     * @public
     */
    ligar() {
        if (!this.ligado) {
            this.ligado = true;
            console.log(`${this.modelo} ligado.`);
            return true;
        }
        console.log(`${this.modelo} já estava ligado.`);
        return false;
    }

    /**
     * Desliga o motor do carro, se estiver ligado. Zera a velocidade ao desligar.
     * @returns {boolean} True se o motor foi desligado, false se já estava desligado.
     * @public
     */
    desligar() {
        if (this.ligado) {
            this.ligado = false;
            this.velocidade = 0; // Carro para ao desligar
            console.log(`${this.modelo} desligado.`);
            return true;
        }
        console.log(`${this.modelo} já estava desligado.`);
        return false;
    }

    /**
     * Aumenta a velocidade do carro em 10 km/h, respeitando a velocidade máxima.
     * O carro precisa estar ligado para acelerar.
     * @returns {boolean} True se a velocidade foi aumentada, false caso contrário (desligado ou já na máxima).
     * @public
     */
    acelerar() {
        if (!this.ligado) {
            console.warn(`${this.modelo} está desligado, não pode acelerar.`);
            // Notificação de aviso deve ser mostrada por quem chamou (main.js).
            // showNotification('Ligue o veículo primeiro!', 'warning', 3000, window.ui);
            return false;
        }
        if (this.velocidade < this.velocidadeMaxima) {
            this.velocidade = Math.min(this.velocidade + 10, this.velocidadeMaxima);
            console.log(`${this.modelo} acelerou para: ${this.velocidade} km/h`);
            return true;
        } else {
             console.log(`${this.modelo} já está na velocidade máxima (${this.velocidadeMaxima} km/h)!`);
             return false;
        }
    }

    /**
     * Diminui a velocidade do carro em 10 km/h, até o mínimo de 0 km/h.
     * @returns {boolean} True se a velocidade foi diminuída (e era maior que 0), false se já estava parado.
     * @public
     */
    frear() {
        if (this.velocidade > 0) {
            this.velocidade = Math.max(0, this.velocidade - 10);
            console.log(`${this.modelo} freou para: ${this.velocidade} km/h`);
            return true;
        }
        console.log(`${this.modelo} já está parado.`);
        return false;
    }

    /**
     * Retorna um objeto com dados específicos do estado atual do Carro.
     * @returns {{ligado: boolean, velocidade: number, velocidadeMaxima: number}} Objeto com o estado.
     * @public
     */
    getDadosEspecificos() {
        return {
            ligado: this.ligado,
            velocidade: this.velocidade,
            velocidadeMaxima: this.velocidadeMaxima
        };
    }

    /**
     * Retorna uma representação JSON do Carro, incluindo dados da classe pai (Veiculo).
     * @returns {object} Objeto serializável representando o carro.
     * @public
     */
    toJSON() {
        // Pega o JSON da classe pai (Veiculo)
        const baseJSON = super.toJSON();
        // Adiciona/sobrescreve as propriedades específicas de Carro
        return {
            ...baseJSON,
            _tipoClasse: 'Carro', // Garante que o tipo correto é salvo
            ligado: this.ligado,
            velocidade: this.velocidade
            // Não salva velocidadeMaxima, pois é definida pela classe ao recarregar
        };
    }
}