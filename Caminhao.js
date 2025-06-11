// js/models/Manutencao.js
'use strict';

/**
 * Representa um registro de manutenção ou agendamento para um veículo.
 * Contém informações sobre data, tipo, custo e descrição do serviço.
 * @class Manutencao
 */
export default class Manutencao {
    /**
     * Cria uma instância de Manutencao.
     * @param {string|Date} dataISO - A data e hora da manutenção. Idealmente uma string ISO 8601 (ex: "YYYY-MM-DDTHH:mm") ou um objeto Date.
     * @param {string} tipo - O tipo de serviço realizado ou agendado (ex: "Troca de óleo").
     * @param {number|string|null|undefined} custo - O custo do serviço. Se string, tentará converter para número (',' vira '.'). Zero ou nulo/undefined é tratado como 0.
     * @param {string} [descricao=''] - Uma descrição opcional do serviço.
     * @property {string} id - ID único para a manutenção.
     * @property {Date} data - Objeto Date da manutenção. Pode ser inválido se dataISO for inválida.
     * @property {string} tipo - Tipo de serviço.
     * @property {number} custo - Custo do serviço.
     * @property {string} descricao - Descrição do serviço.
     */
    constructor(dataISO, tipo, custo, descricao = '') {
        if (dataISO instanceof Date && !isNaN(dataISO)) {
            this.data = dataISO;
        } else if (typeof dataISO === 'string' && dataISO.trim() !== '') {
             try {
                // Tenta interpretar a string de data. new Date() pode ser inconsistente com formatos não-ISO.
                // Se a string vier de um <input type="datetime-local">, ela geralmente é no formato "YYYY-MM-DDTHH:mm".
                this.data = new Date(dataISO);
                if (isNaN(this.data.getTime())) { // Checa explicitamente se a data é válida
                    console.warn(`String de data resultou em data inválida: "${dataISO}"`);
                    this.data = new Date(NaN); // Garante que seja um Date inválido
                }
             } catch (e) {
                 console.error("Erro ao criar data para Manutencao a partir da string:", dataISO, e);
                 this.data = new Date(NaN); // Define como data inválida em caso de erro
             }
        } else {
             console.warn("Tipo de data inválido ou string vazia recebida para Manutencao:", dataISO);
             this.data = new Date(NaN); // Define como data inválida
        }

        this.tipo = tipo ? String(tipo).trim() : '';

        let custoNumerico = 0;
        if (custo !== null && custo !== undefined && String(custo).trim() !== '') {
            if (typeof custo === 'string') {
                // Remove caracteres não numéricos exceto ponto e vírgula (que será trocada por ponto)
                // e sinal negativo no início. Isso torna a conversão mais robusta.
                custo = custo.replace(',', '.').replace(/[^\d.-]/g, '');
            }
            custoNumerico = parseFloat(custo);
        }
        // Considera NaN ou valores negativos como 0 para custo.
        this.custo = isNaN(custoNumerico) || custoNumerico < 0 ? 0 : custoNumerico;

        this.descricao = descricao ? String(descricao).trim() : '';

        // ID único para cada instância de manutenção
        this.id = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    }

    /**
     * Retorna uma string formatada representando a manutenção, incluindo tipo, data, hora, custo e descrição.
     * Ex: "Troca de óleo em 25/12/2023 às 10:30 - R$ 150,50 (Filtro incluído)"
     * @param {boolean} [incluirHorario=true] - Se true, inclui a hora na formatação da data.
     * @returns {string} A representação textual da manutenção.
     * @public
     */
    retornarFormatada(incluirHorario = true) {
        if (!this.isValidDate()) {
            return `${this.tipo || 'Tipo Indefinido'} - Data Inválida - ${this.formatarCusto()}${this.descricao ? ` (${this.descricao})` : ''}`;
        }
        const opcoesData = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const opcoesHora = { hour: '2-digit', minute: '2-digit', hour12: false };

        let dataStr = this.data.toLocaleDateString('pt-BR', opcoesData);
        if (incluirHorario) {
             // Adiciona ' às HH:MM'
             dataStr += ' às ' + this.data.toLocaleTimeString('pt-BR', opcoesHora);
        }

        return `${this.tipo} em ${dataStr} - ${this.formatarCusto()}${this.descricao ? ` (${this.descricao})` : ''}`;
    }

    /**
     * Formata o custo como moeda brasileira (BRL). Se o custo for zero,
     * diferencia entre "Agendado" (para datas futuras) e "Grátis" (para datas passadas ou atuais).
     * @returns {string} O custo formatado ou status.
     * @public
     */
    formatarCusto() {
        if (this.custo === 0) {
            // Se a data da manutenção for no futuro e o custo for zero, considera-se "Agendado".
            // Caso contrário (data no passado ou hoje com custo zero), considera-se "Grátis".
            if (this.isValidDate() && this.data > new Date()) {
                return "Agendado";
            }
            return "Grátis";
        }
        // Formata o custo para o padrão monetário brasileiro.
        return this.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    /**
     * Verifica se a data associada a esta manutenção é um objeto Date válido.
     * @returns {boolean} True se a data for um objeto Date válido (não NaN), false caso contrário.
     * @public
     */
    isValidDate() {
      return this.data instanceof Date && !isNaN(this.data.getTime());
    }

    /**
     * Valida os dados essenciais da manutenção (data e tipo).
     * O custo e a descrição são opcionais.
     * @returns {{valido: boolean, mensagemErro?: string}} Objeto indicando validade e, opcionalmente, uma mensagem de erro.
     * @public
     */
    validarDados() {
        if (!this.isValidDate()) {
            console.error("Erro de validação Manutencao: Data inválida.", this.data);
            return { valido: false, mensagemErro: "Data da manutenção inválida ou não informada." };
        }
        if (typeof this.tipo !== 'string' || this.tipo.trim() === '') {
            console.error("Erro de validação Manutencao: Tipo de serviço não pode ser vazio.", this.tipo);
            return { valido: false, mensagemErro: "O tipo de serviço da manutenção não pode ser vazio." };
        }
        return { valido: true };
    }

    /**
     * Retorna uma representação JSON simplificada do objeto Manutencao,
     * adequada para serialização e armazenamento (ex: no LocalStorage).
     * @returns {object} Objeto com os dados da manutenção.
     * @public
     */
    toJSON() {
        return {
            _tipoClasse: 'Manutencao', // Identificador para recriação da instância
            dataISO: this.isValidDate() ? this.data.toISOString() : null, // Armazena em formato ISO para consistência
            tipo: this.tipo,
            custo: this.custo,
            descricao: this.descricao,
            id: this.id
        };
    }
}