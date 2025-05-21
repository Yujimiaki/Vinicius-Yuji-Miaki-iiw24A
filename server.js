// Importações
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

// Inicializa o aplicativo Express
const app = express();
const port = process.env.PORT || 3001; // Porta para o servidor backend
                                    // Use uma porta diferente do frontend se rodar ambos localmente
const apiKey = process.env.OPENWEATHER_API_KEY;

// Middleware para permitir que o frontend (rodando em outra porta) acesse este backend
// (CORS - Cross-Origin Resource Sharing)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Em produção, restrinja para o seu domínio frontend
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// ----- NOSSO PRIMEIRO ENDPOINT: Previsão do Tempo -----
app.get('/api/previsao/:cidade', async (req, res) => {
    const { cidade } = req.params; // Pega o parâmetro :cidade da URL

    if (!apiKey) {
        console.error('[Servidor] ERRO FATAL: Chave da API OpenWeatherMap não configurada no servidor. Verifique o arquivo .env');
        return res.status(500).json({ error: 'Chave da API OpenWeatherMap não configurada no servidor.' });
    }
    if (!cidade) {
        console.log('[Servidor] Requisição recebida sem nome da cidade.');
        return res.status(400).json({ error: 'Nome da cidade é obrigatório.' });
    }

    const weatherAPIUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidade)}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        console.log(`[Servidor] Buscando previsão para: ${cidade} usando a URL: ${weatherAPIUrl.replace(apiKey, 'CHAVE_OCULTADA')}`); // Oculta a chave no log
        const apiResponse = await axios.get(weatherAPIUrl);
        console.log(`[Servidor] Dados recebidos da OpenWeatherMap para ${cidade}. Status: ${apiResponse.status}`);
        
        // Enviamos a resposta da API OpenWeatherMap diretamente para o nosso frontend
        res.json(apiResponse.data);

    } catch (error) {
        // Log detalhado do erro no servidor
        if (error.response) {
            // A requisição foi feita e o servidor respondeu com um status code que não é 2xx
            console.error(`[Servidor] Erro da API OpenWeatherMap para ${cidade}: Status ${error.response.status}`, error.response.data);
            res.status(error.response.status).json({ error: error.response.data.message || 'Erro ao buscar dados da OpenWeatherMap.' });
        } else if (error.request) {
            // A requisição foi feita mas nenhuma resposta foi recebida
            console.error(`[Servidor] Nenhuma resposta da OpenWeatherMap para ${cidade}:`, error.request);
            res.status(503).json({ error: 'Serviço da OpenWeatherMap indisponível ou sem resposta.' });
        } else {
            // Algo aconteceu ao configurar a requisição que acionou um erro
            console.error(`[Servidor] Erro ao configurar requisição para OpenWeatherMap (${cidade}):`, error.message);
            res.status(500).json({ error: 'Erro interno no servidor ao tentar buscar previsão.' });
        }
    }
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor backend rodando em http://localhost:${port}`);
    if (!apiKey) {
        console.warn('[Servidor] ATENÇÃO: A variável de ambiente OPENWEATHER_API_KEY não foi carregada. A API de previsão do tempo não funcionará.');
    } else {
        console.log('[Servidor] Chave da API OpenWeatherMap carregada com sucesso.');
    }
});