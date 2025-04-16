// js/models/Garagem.js
import Veiculo from './Veiculo.js';
import Carro from './Carro.js';
import CarroEsportivo from './CarroEsportivo.js';
import Caminhao from './Caminhao.js';
import Manutencao from './Manutencao.js';
// Garagem não deve chamar UI diretamente. Notificações devem ser responsabilidade de quem usa a Garagem (main.js)
// import { showNotification } from '../utils/notifications.js';

/**
 * Gerencia a coleção de veículos e o veículo atualmente selecionado.
 * Lida com adição, remoção, seleção e persistência dos veículos no LocalStorage.
 * @class Garagem
 */
export default class Garagem {
    /**
     * Cria uma instância de Garagem, inicializando a lista de veículos vazia
     * e sem veículo selecionado. O carregamento do LocalStorage é feito externamente.
     */
    constructor() {
        /**
         * A lista de veículos presentes na garagem.
         * @type {Array<Veiculo>}
         * @public
         */
        this.veiculos = [];

        /**
         * O ID do veículo atualmente selecionado pelo usuário, ou null se nenhum.
         * @type {string|null}
         * @public
         */
        this.veiculoSelecionadoId = null;
    }

    /**
     * Adiciona um veículo à garagem, se for uma instância válida de Veiculo
     * e não tiver um ID duplicado. Mantém a lista ordenada por modelo.
     * @param {Veiculo} veiculo - A instância do veículo a ser adicionada.
     * @returns {boolean} True se o veículo foi adicionado com sucesso, false caso contrário.
     * @public
     */
    adicionarVeiculo(veiculo) {
        if (!(veiculo instanceof Veiculo)) {
            console.error("Tentativa de adicionar objeto inválido à garagem. Objeto:", veiculo);
            // showNotification("Erro interno: Tipo de objeto inválido para adicionar.", 'error', 4000, window.ui);
            return false;
        }
        // Verifica ID duplicado
        if (this.veiculos.some(v => v.id === veiculo.id)) {
             console.warn(`Veículo com ID ${veiculo.id} (${veiculo.modelo}) já existe na garagem.`);
             return false; // Não adiciona duplicata
        }
        this.veiculos.push(veiculo);
        console.log(`Veículo ${veiculo.modelo} (ID: ${veiculo.id}, Tipo: ${veiculo.constructor.name}) adicionado.`);
        // Ordena a lista de veículos por modelo após adicionar
        this.veiculos.sort((a, b) => a.modelo.localeCompare(b.modelo));
        return true; // Sucesso
    }

    /**
     * Remove um veículo da garagem pelo seu ID.
     * Se o veículo removido era o selecionado, a seleção é limpa.
     * @param {string} idVeiculo - O ID do veículo a remover.
     * @returns {boolean} True se o veículo foi encontrado e removido, false caso contrário.
     * @public
     */
    removerVeiculo(idVeiculo) {
        const index = this.veiculos.findIndex(v => v.id === idVeiculo);
        if (index > -1) {
            const removido = this.veiculos.splice(index, 1)[0];
            console.log(`Veículo ${removido.modelo} (ID: ${idVeiculo}) removido.`);
            // Limpa a seleção se o veículo removido era o selecionado
            if (this.veiculoSelecionadoId === idVeiculo) {
                this.veiculoSelecionadoId = null;
                 localStorage.removeItem('garagemVeiculoSelecionadoId'); // Limpa do LS também
                 console.log("Seleção limpa pois o veículo selecionado foi removido.");
            }
            // A responsabilidade de salvar no LS e atualizar UI é de quem chama este método.
            return true; // Indica sucesso na remoção
        }
        console.warn(`Veículo com ID ${idVeiculo} não encontrado para remoção.`);
        // showNotification("Veículo não encontrado para remoção.", 'error', 4000, window.ui);
        return false; // Falha ao encontrar
    }

    /**
     * Encontra e retorna um veículo na garagem pelo seu ID.
     * @param {string} idVeiculo - O ID do veículo a ser encontrado.
     * @returns {Veiculo|undefined} A instância do veículo encontrado, ou undefined se não encontrado.
     * @public
     */
    encontrarVeiculo(idVeiculo) {
        return this.veiculos.find(v => v.id === idVeiculo);
    }

    /**
     * Define o veículo selecionado pelo seu ID.
     * Atualiza o ID armazenado no LocalStorage.
     * @param {string|null} idVeiculo - O ID do veículo a selecionar, ou null para limpar a seleção.
     * @returns {boolean} True se a seleção foi alterada ou confirmada, false se o ID era inválido ou já estava selecionado/nulo.
     * @public
     */
    selecionarVeiculo(idVeiculo) {
         // Limpar seleção
         if (idVeiculo === null) {
             if (this.veiculoSelecionadoId !== null) {
                 this.veiculoSelecionadoId = null;
                 console.log("Seleção de veículo limpa.");
                 localStorage.removeItem('garagemVeiculoSelecionadoId');
                 return true; // Seleção foi alterada (para nulo)
             }
             return false; // Já estava nulo, sem alteração
         }

         // Tentar selecionar um ID
         const veiculoEncontrado = this.encontrarVeiculo(idVeiculo);
         if (veiculoEncontrado) {
             if (this.veiculoSelecionadoId !== idVeiculo) {
                 this.veiculoSelecionadoId = idVeiculo;
                 console.log(`Veículo selecionado: ${veiculoEncontrado.modelo} (ID: ${idVeiculo})`);
                 localStorage.setItem('garagemVeiculoSelecionadoId', idVeiculo);
                 return true; // Seleção alterada
             }
             return true; // ID válido, mas já estava selecionado (confirmação)
         } else {
             console.warn(`Tentativa de selecionar veículo com ID inválido: ${idVeiculo}`);
             return false; // ID inválido
         }
    }

    /**
     * Retorna a instância do veículo atualmente selecionado.
     * @returns {Veiculo|null} O veículo selecionado, ou null se nenhum estiver selecionado.
     * @public
     */
    getVeiculoSelecionado() {
        // Usa o encontrarVeiculo para garantir que o ID ainda é válido na lista atual
        return this.encontrarVeiculo(this.veiculoSelecionadoId);
    }

    /**
     * Salva o estado atual da lista de veículos no LocalStorage.
     * Serializa cada veículo usando seu método toJSON().
     * @returns {void}
     * @public
     */
    salvarNoLocalStorage() {
        try {
            // Mapeia cada veículo para sua representação JSON
            const garagemParaSalvar = this.veiculos.map(v => v.toJSON());
            // Converte o array de objetos JSON em uma string JSON
            const garagemJSON = JSON.stringify(garagemParaSalvar);
            // Salva a string no LocalStorage
            localStorage.setItem('minhaGaragemVirtual', garagemJSON);
            // console.log(`Garagem salva no LocalStorage com ${this.veiculos.length} veículo(s).`);
        } catch (error) {
            console.error("Erro CRÍTICO ao salvar garagem no LocalStorage:", error);
            // showNotification("Erro crítico ao salvar dados da garagem! Verifique o console.", 'error', 10000, window.ui);
        }
    }

    /**
     * Carrega os dados dos veículos do LocalStorage e recria as instâncias das classes corretas.
     * Este é um método estático, pois é chamado antes de uma instância Garagem ser completamente populada.
     * Lida com erros de parsing ou de recriação de veículos individuais.
     * @returns {Array<Veiculo>} Uma lista contendo as instâncias de Veiculo recriadas a partir dos dados salvos. Retorna lista vazia se não houver dados ou em caso de erro grave.
     * @static
     * @public
     */
    static carregarDoLocalStorage() {
        const garagemJSON = localStorage.getItem('minhaGaragemVirtual');
        const veiculosCarregados = []; // Lista para guardar os veículos recriados

        if (!garagemJSON) {
             console.log("Nenhum dado de garagem encontrado no LocalStorage para carregar.");
             return veiculosCarregados; // Retorna lista vazia
        }

        try {
            const veiculosSalvos = JSON.parse(garagemJSON); // Parseia a string JSON

            // Itera sobre cada objeto de veículo salvo
            veiculosSalvos.forEach(obj => {
                // Bloco try/catch para cada veículo, para que um erro não impeça o carregamento dos outros
                try {
                    if (!obj || !obj._tipoClasse) {
                        console.warn("Objeto de veículo inválido ou sem _tipoClasse encontrado no LS:", obj);
                        return; // Pula este objeto inválido
                    }

                    let veiculo = null;
                    let historicoRecriado = [];

                    // Recria o histórico de manutenção primeiro
                    if (obj.historicoManutencao && Array.isArray(obj.historicoManutencao)) {
                       historicoRecriado = obj.historicoManutencao
                        .map(mObj => {
                            if (mObj && mObj._tipoClasse === 'Manutencao') {
                                try {
                                    const manut = new Manutencao(mObj.dataISO, mObj.tipo, mObj.custo, mObj.descricao);
                                    if(mObj.id) manut.id = mObj.id; // Restaura ID
                                    return manut.isValidDate() ? manut : null; // Só adiciona se a data for válida após recriar
                                } catch(manutError) {
                                    console.error("Erro ao recriar Manutencao:", mObj, manutError);
                                    return null;
                                }
                            }
                            return null; // Ignora itens inválidos no histórico
                        })
                        .filter(m => m !== null); // Remove os nulos

                       // Ordena o histórico recriado (redundante se adicionarManutencao sempre ordena, mas seguro)
                       historicoRecriado.sort((a, b) => b.data.getTime() - a.data.getTime());
                    }

                    // Recria a instância da classe de Veiculo correta
                    switch (obj._tipoClasse) {
                        case 'Carro':
                            veiculo = new Carro(obj.modelo, obj.cor, obj.id, obj.ligado, obj.velocidade);
                            break;
                        case 'CarroEsportivo':
                            veiculo = new CarroEsportivo(obj.modelo, obj.cor, obj.id, obj.ligado, obj.velocidade, obj.turboBoostUsado || false);
                            break;
                        case 'Caminhao':
                            // A validação da capacidade está no construtor de Caminhao
                            veiculo = new Caminhao(obj.modelo, obj.cor, obj.capacidadeCarga, obj.id, obj.ligado, obj.velocidade, obj.cargaAtual);
                            break;
                        // Caso não seja nenhum dos tipos conhecidos, não recria
                        default:
                            console.warn(`Tipo de veículo desconhecido ('${obj._tipoClasse}') encontrado no LS. Objeto:`, obj);
                    }

                    // Se o veículo foi recriado com sucesso
                    if (veiculo) {
                        veiculo.historicoManutencao = historicoRecriado; // Atribui o histórico recriado
                        // Adiciona à lista, verificando duplicação de ID (improvável, mas seguro)
                        if (!veiculosCarregados.some(v => v.id === veiculo.id)) {
                            veiculosCarregados.push(veiculo);
                        } else {
                            console.warn(`Veículo duplicado (ID: ${veiculo.id}) detectado durante carregamento do LS.`);
                        }
                    }
                 } catch (veiculoError) {
                      // Captura erros específicos da recriação DESTE veículo (ex: erro no construtor)
                      console.error(`Erro ao carregar/recriar veículo individual (ID: ${obj?.id}, Tipo: ${obj?._tipoClasse}):`, veiculoError, "Objeto original:", obj);
                      // showNotification(`Erro ao carregar dados de um veículo (${obj?.modelo || 'desconhecido'}). Verifique o console.`, 'error', 5000, window.ui);
                 }
            }); // Fim do forEach

             // Ordena a lista final por modelo
             veiculosCarregados.sort((a, b) => a.modelo.localeCompare(b.modelo));
             console.log(`${veiculosCarregados.length} veículo(s) carregado(s) e recriado(s) do LocalStorage.`);
             return veiculosCarregados; // Retorna a lista populada

        } catch (error) {
            // Captura erro GERAL ao parsear o JSON principal da garagem
            console.error("Erro CRÍTICO ao carregar/parsear dados da garagem do LocalStorage:", error);
            // showNotification("Erro grave ao carregar dados salvos! Resetando garagem. Verifique o console.", 'error', 10000, window.ui);
            localStorage.removeItem('minhaGaragemVirtual'); // Limpa dados corrompidos
            localStorage.removeItem('garagemVeiculoSelecionadoId');
            return []; // Retorna lista vazia em caso de erro grave
        }
    }

    /**
     * Verifica e dispara notificações para agendamentos de manutenção próximos (nos próximos 2 dias).
     * As notificações são mostradas usando a função showNotification (idealmente chamada pelo main.js).
     * @returns {void}
     * @public
     */
    verificarAgendamentosProximos() {
        const agora = new Date();
        const doisDiasEmMillis = 2 * 24 * 60 * 60 * 1000;
        const limite = new Date(agora.getTime() + doisDiasEmMillis); // Data/hora daqui a 2 dias
        let notificacoesParaMostrar = [];

        this.veiculos.forEach(veiculo => {
            veiculo.historicoManutencao.forEach(manutencao => {
                // Verifica se é uma data válida, futura e dentro do limite de 2 dias
                if (manutencao.isValidDate() && manutencao.data >= agora && manutencao.data <= limite) {
                    const diffMillis = manutencao.data.getTime() - agora.getTime();
                    const diffHoras = Math.round(diffMillis / (1000 * 60 * 60));
                    const diffDias = Math.floor(diffMillis / (1000 * 60 * 60 * 24));

                    let tempoRestanteStr = "";
                    if (diffMillis < 30 * 60 * 1000) tempoRestanteStr = "em menos de 30 min";
                    else if (diffMillis < 60 * 60 * 1000) tempoRestanteStr = "em menos de 1h";
                    else if (diffDias === 0) tempoRestanteStr = `hoje (~${diffHoras}h)`;
                    else if (diffDias === 1) tempoRestanteStr = `amanhã (~${diffHoras}h)`;
                    else tempoRestanteStr = `em ${diffDias} dias (~${diffHoras}h)`; // Caso raro, mas cobre o limite exato

                    const dataFormatada = manutencao.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                                         + ' às '
                                         + manutencao.data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                    notificacoesParaMostrar.push({
                        data: manutencao.data, // Guarda a data para ordenação
                        msg: `Lembrete: ${manutencao.tipo} p/ ${veiculo.modelo} ${tempoRestanteStr} (${dataFormatada}).`
                    });
                }
            });
        });

        // Ordena as notificações pela data do agendamento (mais próximo primeiro)
        notificacoesParaMostrar.sort((a, b) => a.data.getTime() - b.data.getTime());

        if (notificacoesParaMostrar.length > 0) {
            console.log(`Agendamentos próximos encontrados: ${notificacoesParaMostrar.length}`);
             // Dispara as notificações com um pequeno intervalo entre elas
             // A chamada real a showNotification deve ocorrer no main.js após a inicialização
             notificacoesParaMostrar.forEach((notif, index) => {
                 // O setTimeout aqui dentro da classe não é ideal. A classe deve apenas retornar a lista.
                 console.log(`Agendamento Próximo [${index}]: ${notif.msg}`);
                 // Exemplo de como seria no main.js:
                 // setTimeout(() => showNotification(notif.msg, 'info', 8000 + index * 500, ui), 1500 + index * 700);
             });
             // Retornar a lista para o main.js lidar com as notificações seria melhor:
             // return notificacoesParaMostrar.map(n => n.msg);
        } else {
            console.log("Nenhum agendamento próximo encontrado.");
        }
    }
}