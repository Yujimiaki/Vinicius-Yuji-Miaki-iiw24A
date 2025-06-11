// js/models/Veiculo.js
'use strict';

import Manutencao from './Manutencao.js'; // Corrigido para Manutencao.js

/**
 * Representa a classe base para qualquer veículo na garagem.
 * Define propriedades e métodos comuns a todos os veículos.
 * @class Veiculo
 * @property {string} modelo - O modelo do veículo.
 * @property {string} cor - A cor do veículo.
 * @property {string} id - O ID único do veículo.
 * @property {Array<Manutencao>} historicoManutencao - Lista de manutenções do veículo.
 */
export default class Veiculo {
    /**
     * Cria uma instância de Veiculo.
     * @param {string} modelo - O modelo do veículo. Deve ser uma string não vazia.
     * @param {string} cor - A cor do veículo. Deve ser uma string não vazia.
     * @param {string|null} [id=null] - O ID único do veículo. Se nulo, um novo ID será gerado.
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
        /** @type {Array<Manutencao>} */
        this.historicoManutencao = []; // Array para armazenar instâncias de Manutencao
        this.id = id || (Date.now().toString(36) + Math.random().toString(36).substring(2, 7));
    }

    /**
     * Adiciona um registro de manutenção (ou agendamento) ao histórico do veículo.
     * A manutenção é validada antes de ser adicionada.
     * O histórico é mantido ordenado pela data da manutenção (mais recentes primeiro).
     *
     * @param {Manutencao} manutencao - A instância de Manutencao a ser adicionada.
     * @returns {{success: boolean, message?: string}} Objeto indicando sucesso da operação e uma mensagem opcional.
     * @public
     */
    adicionarManutencao(manutencao) {
        if (!(manutencao instanceof Manutencao)) {
             console.error("Tentativa de adicionar tipo inválido à lista de manutenções:", manutencao);
             return { success: false, message: "Erro interno: Tipo de manutenção inválido fornecido." };
        }

        const validacao = manutencao.validarDados();
        if (!validacao.valido) {
             console.warn(`Dados inválidos para a manutenção a ser adicionada ao veículo ${this.modelo}. Motivo: ${validacao.mensagemErro}`);
             return { success: false, message: validacao.mensagemErro || "Dados da manutenção são inválidos." };
        }

        // Verifica se uma manutenção com o mesmo ID já existe (pouco provável, mas para segurança)
        if (this.historicoManutencao.some(m => m.id === manutencao.id)) {
            console.warn(`Manutenção com ID ${manutencao.id} já existe para o veículo ${this.modelo}. Não será adicionada novamente.`);
            return { success: false, message: "Esta manutenção específica (mesmo ID) já foi registrada." };
        }

        this.historicoManutencao.push(manutencao);
        // Mantém a lista de manutenções ordenada por data, as mais recentes primeiro.
        // Isso é útil para exibir o histórico e os agendamentos de forma lógica.
        this.historicoManutencao.sort((a, b) => {
            // Trata casos onde as datas podem ser inválidas
            if (!a.isValidDate() && !b.isValidDate()) return 0; // Se ambas inválidas, não muda a ordem relativa
            if (!a.isValidDate()) return 1;  // Datas inválidas são colocadas no final
            if (!b.isValidDate()) return -1; // Datas inválidas são colocadas no final
            return b.data.getTime() - a.data.getTime(); // Ordena decrescente (mais recentes primeiro)
        });
        console.log(`Manutenção/Agendamento do tipo "${manutencao.tipo}" adicionado para ${this.modelo}: ${manutencao.retornarFormatada(true)}`);
        return { success: true };
    }

    /**
     * Remove um registro de manutenção do histórico do veículo pelo seu ID.
     * @param {string} idManutencao - O ID da manutenção a ser removida.
     * @returns {boolean} Retorna true se a manutenção foi encontrada e removida, false caso contrário.
     * @public
     */
    removerManutencao(idManutencao) {
        const index = this.historicoManutencao.findIndex(m => m.id === idManutencao);
        if (index > -1) {
            const removida = this.historicoManutencao.splice(index, 1)[0]; // Remove o item e o retorna
            console.log(`Manutenção ID ${idManutencao} (Tipo: "${removida.tipo}") removida do veículo ${this.modelo}.`);
            return true;
        }
        console.warn(`Manutenção com ID ${idManutencao} não encontrada no veículo ${this.modelo}. Nada foi removido.`);
        return false;
    }

    /**
     * Retorna um array com as manutenções passadas (data anterior à atual) formatadas como objetos {id, texto}.
     * A lista já está ordenada pela data (mais recentes primeiro), conforme mantido por `adicionarManutencao`.
     * @returns {Array<{id: string, texto: string}>} Lista de objetos com id e texto formatado da manutenção.
     * @public
     */
    getHistoricoPassadoFormatado() {
        const agora = new Date();
        return this.historicoManutencao
            .filter(item => item.isValidDate() && item.data < agora) // Filtra apenas manutenções passadas
            .map(manutencao => ({
                id: manutencao.id,
                texto: manutencao.retornarFormatada(true) // Inclui horário para histórico
            }));
        // A ordenação já é garantida pela ordenação da lista `this.historicoManutencao`.
    }

    /**
     * Retorna um array com os agendamentos futuros (data igual ou posterior à atual)
     * formatados como objetos {id, texto}.
     * A lista é filtrada e depois re-ordenada para agendamentos (mais próximos primeiro).
     * @returns {Array<{id: string, texto: string}>} Lista de objetos com id e texto formatado do agendamento.
     * @public
     */
    getAgendamentosFuturosFormatados() {
         const agora = new Date();
         return this.historicoManutencao
             .filter(item => item.isValidDate() && item.data >= agora) // Filtra apenas agendamentos futuros ou de hoje
             .sort((a, b) => a.data.getTime() - b.data.getTime()) // Re-ordena: agendamentos mais próximos primeiro
             .map(manutencao => ({
                 id: manutencao.id,
                 texto: manutencao.retornarFormatada(true) // Inclui horário para agendamentos
             }));
    }

    /**
     * Retorna um objeto com as informações básicas e identificadoras do veículo (ID, modelo, cor).
     * Este método é geralmente usado para exibição na UI ou para informações sumárias.
     * @returns {{id: string, modelo: string, cor: string}} Objeto contendo informações base do veículo.
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
     * Este método é crucial para a persistência de dados (ex: salvar no LocalStorage).
     * Ele inclui um campo `_tipoClasse` para ajudar na recriação da instância correta ao carregar os dados.
     * @returns {object} Objeto serializável representando o veículo e suas manutenções.
     * @public
     */
    toJSON() {
        return {
            _tipoClasse: this.constructor.name, // Dinamicamente pega o nome da classe (Veiculo, Carro, etc.)
            modelo: this.modelo,
            cor: this.cor,
            id: this.id,
            // Serializa cada item de manutenção chamando seu próprio método toJSON()
            historicoManutencao: this.historicoManutencao.map(m => m.toJSON())
        };
    }
}