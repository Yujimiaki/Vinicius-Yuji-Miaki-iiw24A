// js/models/Veiculo.js
'use strict';

import Manutencao from './manutenção.js'; // <-- ALTERADO: Nome do arquivo corrigido

/**
 * Representa a classe base para qualquer veículo na garagem.
 * @class Veiculo
 */
export default class Veiculo {
    /**
     * Cria uma instância de Veiculo.
     * @param {string} modelo - O modelo do veículo.
     * @param {string} cor - A cor do veículo.
     * @param {string|null} [id=null] - O ID único do veículo.
     * @throws {Error} Se o modelo ou a cor não forem strings válidas e não vazias.
     */
    constructor(modelo, cor, id = null) {
        if (!modelo || typeof modelo !== 'string' || modelo.trim() === '') {
            throw new Error("Modelo do veículo é obrigatório e deve ser uma string não vazia.");
        }
        if (!cor || typeof cor !== 'string' || cor.trim() === '') {
            throw new Error("Cor do veículo é obrigatória e deve ser uma string não vazia.");
        }

        this.modelo = modelo.trim();
        this.cor = cor.trim();
        this.historicoManutencao = [];
        this.id = id || Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    /**
     * Adiciona um registro de manutenção ao histórico do veículo.
     * @param {Manutencao} manutencao - A instância de Manutencao a ser adicionada.
     * @returns {{success: boolean, message?: string}} Objeto indicando sucesso e mensagem opcional.
     * @public
     */
    adicionarManutencao(manutencao) { // <-- ALTERADO: Retorna objeto
        if (!(manutencao instanceof Manutencao)) {
             console.error("Tipo inválido passado para adicionarManutencao:", manutencao);
             return { success: false, message: "Erro interno: Tipo de manutenção inválido." };
        }

        const validacao = manutencao.validarDados(); // <-- ALTERADO: Usa retorno da validação
        if (!validacao.valido) {
             console.warn(`Dados inválidos para a manutenção a ser adicionada: ${manutencao.tipo}. Motivo: ${validacao.mensagemErro}`);
             return { success: false, message: validacao.mensagemErro || "Dados da manutenção inválidos." };
        }

        if (this.historicoManutencao.some(m => m.id === manutencao.id)) {
            console.warn(`Manutenção com ID ${manutencao.id} já existe para ${this.modelo}.`);
            return { success: false, message: "Esta manutenção já foi registrada." };
        }

        this.historicoManutencao.push(manutencao);
        this.historicoManutencao.sort((a, b) => {
            if (!a.isValidDate() && !b.isValidDate()) return 0;
            if (!a.isValidDate()) return 1;
            if (!b.isValidDate()) return -1;
            return b.data.getTime() - a.data.getTime();
        });
        console.log(`Manutenção/Agendamento adicionado para ${this.modelo}: ${manutencao.retornarFormatada(true)}`);
        return { success: true }; // <-- ALTERADO
    }

    /**
     * Remove um registro de manutenção do histórico pelo seu ID.
     * @param {string} idManutencao - O ID da manutenção a ser removida.
     * @returns {boolean} Retorna true se a manutenção foi encontrada e removida, false caso contrário.
     * @public
     */
    removerManutencao(idManutencao) { // <-- ALTERADO: Simplificado, retorna apenas boolean
        const index = this.historicoManutencao.findIndex(m => m.id === idManutencao);
        if (index > -1) {
            const removida = this.historicoManutencao.splice(index, 1)[0];
            console.log(`Manutenção ${idManutencao} (${removida.tipo}) removida de ${this.modelo}.`);
            return true;
        }
        console.warn(`Manutenção ${idManutencao} não encontrada em ${this.modelo}.`);
        return false;
    }

    /**
     * Retorna um array com as manutenções passadas formatadas como strings.
     * @returns {Array<{id: string, texto: string}>} Lista de objetos com id e texto formatado.
     * @public
     */
    getHistoricoPassadoFormatado() {
        const agora = new Date();
        return this._getManutencoesFormatadas(item => item.isValidDate() && item.data < agora, false);
    }

    /**
     * Retorna um array com os agendamentos futuros formatados como strings.
     * @returns {Array<{id: string, texto: string}>} Lista de objetos com id e texto formatado.
     * @public
     */
    getAgendamentosFuturosFormatados() {
         const agora = new Date();
         return this._getManutencoesFormatadas(item => item.isValidDate() && item.data >= agora, true);
    }

    /**
     * Método auxiliar para filtrar e formatar manutenções.
     * @param {function(Manutencao): boolean} filtro - Função para filtrar.
     * @param {boolean} [ordenarAscendente=false] - Se true, ordena por data crescente.
     * @returns {Array<{id: string, texto: string}>} Lista de objetos formatados.
     * @protected
     */
    _getManutencoesFormatadas(filtro, ordenarAscendente = false) {
        let resultado = this.historicoManutencao
            .filter(filtro)
            .map(manutencao => ({
                id: manutencao.id,
                texto: manutencao.retornarFormatada(true)
            }));

        resultado.sort((a, b) => {
             const mA = this.historicoManutencao.find(m => m.id === a.id);
             const mB = this.historicoManutencao.find(m => m.id === b.id);
             if (!mA || !mB || !mA.isValidDate() || !mB.isValidDate()) return 0;
             const diff = mA.data.getTime() - mB.data.getTime();
             return ordenarAscendente ? diff : -diff;
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
     * @returns {object} Objeto serializável representando o veículo.
     * @public
     */
    toJSON() {
        return {
            _tipoClasse: this.constructor.name,
            modelo: this.modelo,
            cor: this.cor,
            id: this.id,
            historicoManutencao: this.historicoManutencao.map(m => m.toJSON())
        };
    }
}