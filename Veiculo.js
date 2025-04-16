// js/models/Veiculo.js
import Manutencao from './Manutencao.js';
// A classe Veiculo em si não deveria chamar showNotification. Quem a usa (Garagem, main.js) deve fazer isso.
// import { showNotification } from '../utils/notifications.js';

/**
 * Representa a classe base para qualquer veículo na garagem.
 * Define propriedades e métodos comuns a todos os veículos,
 * como modelo, cor, ID e gerenciamento do histórico de manutenções.
 * @class Veiculo
 */
export default class Veiculo {
    /**
     * Cria uma instância de Veiculo.
     * @param {string} modelo - O modelo do veículo (ex: "Fusca"). Obrigatório.
     * @param {string} cor - A cor do veículo (ex: "Azul"). Obrigatório.
     * @param {string|null} [id=null] - O ID único do veículo. Se null, um novo ID será gerado.
     * @throws {Error} Se o modelo ou a cor não forem strings válidas e não vazias.
     */
    constructor(modelo, cor, id = null) {
        if (!modelo || typeof modelo !== 'string' || modelo.trim() === '') {
            throw new Error("Modelo do veículo é obrigatório e deve ser uma string não vazia.");
        }
        if (!cor || typeof cor !== 'string' || cor.trim() === '') {
            throw new Error("Cor do veículo é obrigatória e deve ser uma string não vazia.");
        }

        /** @type {string} O modelo do veículo. */
        this.modelo = modelo.trim();
        /** @type {string} A cor do veículo. */
        this.cor = cor.trim();
        /** @type {Array<Manutencao>} Lista de manutenções, ordenada da mais recente para a mais antiga. */
        this.historicoManutencao = [];
        /** @type {string} Identificador único do veículo. */
        this.id = id || Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    /**
     * Adiciona um registro de manutenção ao histórico do veículo.
     * Valida o objeto Manutencao e verifica duplicatas antes de adicionar.
     * Mantém a lista ordenada por data (mais recentes primeiro).
     * @param {Manutencao} manutencao - A instância de Manutencao a ser adicionada.
     * @returns {boolean} Retorna true se adicionado com sucesso, false caso contrário.
     * @public
     */
    adicionarManutencao(manutencao) {
        if (!(manutencao instanceof Manutencao)) {
             console.error("Tipo inválido passado para adicionarManutencao:", manutencao);
             // A notificação deve ser mostrada por quem chamou este método.
             return false;
        }
        // Usa o método de validação da própria instância de Manutencao
        if (!manutencao.validarDados()) {
             console.warn(`Dados inválidos para a manutenção a ser adicionada: ${manutencao.tipo}`);
             // A notificação de erro específica deve vir de quem chamou ou da validação.
             return false;
        }
        // Verifica ID duplicado
        if (this.historicoManutencao.some(m => m.id === manutencao.id)) {
            console.warn(`Manutenção com ID ${manutencao.id} já existe para ${this.modelo}.`);
            // Notificação de aviso deve ser mostrada por quem chamou.
            return false;
        }

        this.historicoManutencao.push(manutencao);
        // Reordena após adicionar
        this.historicoManutencao.sort((a, b) => {
            if (!a.isValidDate() && !b.isValidDate()) return 0;
            if (!a.isValidDate()) return 1; // inválidos no fim
            if (!b.isValidDate()) return -1;// inválidos no fim
            return b.data.getTime() - a.data.getTime(); // Mais recentes primeiro
        });
        console.log(`Manutenção/Agendamento adicionado para ${this.modelo}: ${manutencao.retornarFormatada(true)}`);
        return true;
    }

    /**
     * Remove um registro de manutenção do histórico pelo seu ID.
     * @param {string} idManutencao - O ID da manutenção a ser removida.
     * @returns {boolean} Retorna true se a manutenção foi encontrada e removida, false caso contrário.
     * @public
     */
    removerManutencao(idManutencao) {
        const index = this.historicoManutencao.findIndex(m => m.id === idManutencao);
        if (index > -1) {
            const removida = this.historicoManutencao.splice(index, 1)[0];
            console.log(`Manutenção ${idManutencao} (${removida.tipo}) removida de ${this.modelo}.`);
            return true;
        }
        console.warn(`Manutenção ${idManutencao} não encontrada em ${this.modelo}.`);
        // Notificação de erro deve ser mostrada por quem chamou.
        return false;
    }

    /**
     * Retorna um array com as manutenções passadas formatadas como strings.
     * Ordenado das mais recentes para as mais antigas.
     * @returns {Array<{id: string, texto: string}>} Lista de objetos com id e texto formatado das manutenções passadas.
     * @public
     */
    getHistoricoPassadoFormatado() {
        const agora = new Date();
        // Filtra por datas passadas e válidas, ordena decrescente (padrão _getManutencoesFormatadas)
        return this._getManutencoesFormatadas(item => item.isValidDate() && item.data < agora, false);
    }

    /**
     * Retorna um array com os agendamentos futuros formatados como strings.
     * Ordenado dos mais próximos para os mais distantes.
     * @returns {Array<{id: string, texto: string}>} Lista de objetos com id e texto formatado dos agendamentos futuros.
     * @public
     */
    getAgendamentosFuturosFormatados() {
         const agora = new Date();
         // Filtra por datas futuras (ou hoje) e válidas, ordena crescente
         return this._getManutencoesFormatadas(item => item.isValidDate() && item.data >= agora, true);
    }

    /**
     * Método auxiliar para filtrar e formatar manutenções.
     * @param {function(Manutencao): boolean} filtro - Função para filtrar as manutenções desejadas.
     * @param {boolean} [ordenarAscendente=false] - Se true, ordena por data crescente (mais antigo primeiro), senão decrescente.
     * @returns {Array<{id: string, texto: string}>} Lista de objetos formatados.
     * @protected
     */
    _getManutencoesFormatadas(filtro, ordenarAscendente = false) {
        let resultado = this.historicoManutencao
            .filter(filtro) // Aplica o filtro passado
            .map(manutencao => ({ // Formata cada item
                id: manutencao.id,
                texto: manutencao.retornarFormatada(true) // Inclui horário na formatação
            }));

        // Reordena o resultado final com base na data original das manutenções correspondentes
        resultado.sort((a, b) => {
             // Encontra as instâncias originais para comparar as datas
             const mA = this.historicoManutencao.find(m => m.id === a.id);
             const mB = this.historicoManutencao.find(m => m.id === b.id);
             // Se algo der errado ou datas forem inválidas, não reordena
             if (!mA || !mB || !mA.isValidDate() || !mB.isValidDate()) return 0;

             // Calcula a diferença; inverte se não for ascendente
             const diff = mA.data.getTime() - mB.data.getTime();
             return ordenarAscendente ? diff : -diff; // Se ordenarAscendente=true, a-b, senão b-a
         });
        return resultado;
    }


    /**
     * Retorna um objeto com as informações básicas do veículo (ID, modelo, cor).
     * @returns {{id: string, modelo: string, cor: string}} Objeto com informações base.
     * @public
     */
    exibirInformacoesBase() {
         return {
             id: this.id,
             modelo: this.modelo,
             cor: this.cor
         };
    }

    /**
     * Retorna uma representação JSON do Veiculo e seu histórico de manutenção.
     * Inclui o tipo da classe para permitir a recriação correta ao carregar.
     * @returns {object} Objeto serializável representando o veículo.
     * @public
     */
    toJSON() {
        return {
            _tipoClasse: this.constructor.name, // Guarda o nome da classe concreta (Carro, Caminhao, etc.)
            modelo: this.modelo,
            cor: this.cor,
            id: this.id,
            // Chama toJSON() para cada manutenção no histórico
            historicoManutencao: this.historicoManutencao.map(m => m.toJSON())
        };
    }
}