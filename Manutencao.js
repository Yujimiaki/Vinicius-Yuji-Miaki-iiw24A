// js/models/Manutencao.js
// A linha abaixo assume que 'ui' está acessível globalmente ou será passada.
// Se não, remova a dependência direta daqui.
// import { showNotification } from '../utils/notifications.js'; // Idealmente, a classe não deveria chamar diretamente a UI.

/**
 * Representa um registro de manutenção ou agendamento para um veículo.
 * Contém informações sobre data, tipo, custo e descrição do serviço.
 * @class Manutencao
 */
export default class Manutencao {
    /**
     * Cria uma instância de Manutencao.
     * @param {string|Date} dataISO - A data e hora da manutenção. Pode ser uma string ISO 8601 ou um objeto Date.
     * @param {string} tipo - O tipo de serviço realizado ou agendado (ex: "Troca de óleo").
     * @param {number|string} custo - O custo do serviço. Se string, tentará converter para número (',' vira '.'). Zero ou negativo é tratado como 0.
     * @param {string} [descricao=''] - Uma descrição opcional do serviço.
     */
    constructor(dataISO, tipo, custo, descricao = '') {
        // Validação e conversão da data
        if (dataISO instanceof Date && !isNaN(dataISO)) {
            this.data = dataISO;
        } else if (typeof dataISO === 'string') {
             try {
                this.data = new Date(dataISO);
                if (isNaN(this.data)) throw new Error("String de data inválida recebida.");
             } catch (e) {
                 console.error("Erro ao criar data para Manutencao a partir da string:", dataISO, e);
                 this.data = new Date(NaN); // Data inválida
             }
        } else {
             console.warn("Tipo de data inválido recebido para Manutencao:", dataISO);
             this.data = new Date(NaN); // Data inválida
        }

        /**
         * O tipo de serviço.
         * @type {string}
         * @public
         */
        this.tipo = tipo ? String(tipo).trim() : '';

        // Validação e conversão do custo
        let custoNumerico = 0;
        if (typeof custo === 'string') {
            custo = custo.replace(',', '.').trim(); // Trata vírgula e espaços
        }
        if (custo !== null && custo !== undefined && custo !== '') {
             custoNumerico = parseFloat(custo);
        }
        /**
         * O custo do serviço em valor numérico. Será 0 se inválido ou não fornecido.
         * @type {number}
         * @public
         */
         this.custo = isNaN(custoNumerico) || custoNumerico < 0 ? 0 : custoNumerico;

        /**
         * Descrição adicional do serviço.
         * @type {string}
         * @public
         */
        this.descricao = descricao ? String(descricao).trim() : '';

        /**
         * Identificador único para este registro de manutenção.
         * @type {string}
         * @public
         */
        this.id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    /**
     * Retorna uma string formatada representando a manutenção.
     * Ex: "Troca de óleo em 25/12/2023 às 10:30 - R$ 150,50 (Filtro incluído)"
     * @param {boolean} [incluirHorario=false] - Se true, inclui a hora na formatação da data (se a hora for diferente de 00:00).
     * @returns {string} A representação textual da manutenção.
     * @public
     */
    retornarFormatada(incluirHorario = false) {
        if (!this.isValidDate()) {
            return `${this.tipo || 'Tipo Indefinido'} - Data Inválida - ${this.formatarCusto()}${this.descricao ? ` (${this.descricao})` : ''}`;
        }
        const opcoesData = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const opcoesHora = { hour: '2-digit', minute: '2-digit' };

        let dataStr = this.data.toLocaleDateString('pt-BR', opcoesData);
        // Inclui horário apenas se solicitado e se a hora/minuto/segundo não forem todos zero
        if (incluirHorario && (this.data.getHours() !== 0 || this.data.getMinutes() !== 0 || this.data.getSeconds() !== 0)) {
             dataStr += ' às ' + this.data.toLocaleTimeString('pt-BR', opcoesHora);
        }

        return `${this.tipo} em ${dataStr} - ${this.formatarCusto()}${this.descricao ? ` (${this.descricao})` : ''}`;
    }

    /**
     * Formata o custo como moeda brasileira (BRL) ou retorna "Grátis/Agendado" se custo for zero.
     * @returns {string} O custo formatado.
     * @public
     */
    formatarCusto() {
        return this.custo > 0 ? this.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "Grátis/Agendado";
    }

    /**
     * Verifica se a data associada a esta manutenção é válida.
     * @returns {boolean} True se a data for um objeto Date válido, false caso contrário.
     * @public
     */
    isValidDate() {
      // Verifica se é um objeto Date e se o tempo não é NaN
      return this.data instanceof Date && !isNaN(this.data.getTime());
    }

    /**
     * Valida os dados essenciais da manutenção (data e tipo).
     * O custo já é tratado no construtor.
     * @returns {boolean} True se os dados essenciais são válidos, false caso contrário.
     * @public
     */
    validarDados() {
        let valido = true;
        if (!this.isValidDate()) {
            console.error("Erro de validação Manutencao: Data inválida.", this.data);
            // Idealmente, não mostraria UI daqui. Retorna false e quem chamou decide.
            // showNotification("Erro: Data da manutenção inválida ou não informada.", 'error', 4000, window.ui);
            valido = false;
        }
        if (typeof this.tipo !== 'string' || this.tipo === '') {
            console.error("Erro de validação Manutencao: Tipo de serviço não pode ser vazio.", this.tipo);
            // showNotification("Erro: Tipo de serviço não pode ser vazio.", 'error', 4000, window.ui);
            valido = false;
        }
        // Custo é validado no construtor para sempre ser um número >= 0
        return valido;
    }

    /**
     * Retorna uma representação JSON simplificada do objeto Manutencao,
     * útil para salvar no LocalStorage.
     * @returns {object} Objeto com os dados da manutenção.
     * @public
     */
    toJSON() {
        return {
            _tipoClasse: 'Manutencao', // Identificador para recriar a classe depois
            dataISO: this.isValidDate() ? this.data.toISOString() : null, // Salva como ISO string
            tipo: this.tipo,
            custo: this.custo,
            descricao: this.descricao,
            id: this.id // Mantém o ID original
        };
    }
}