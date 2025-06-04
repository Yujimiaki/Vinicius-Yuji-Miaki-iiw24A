// server.js
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();
const app = express();
const port = process.env.PORT || 3001; // Render vai definir process.env.PORT
const apiKey = process.env.OPENWEATHER_API_KEY;

// CORS Middleware - ISSO DEVE VIR ANTES DAS SUAS ROTAS!
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Permite qualquer origem
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    // Se seu frontend envia outros cabeçalhos customizados ou usa métodos como PUT/DELETE,
    // você pode precisar adicionar 'Access-Control-Allow-Methods' também.
    // Ex: res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    if (req.method === 'OPTIONS') { // Pre-flight request
        return res.sendStatus(200); // Responde OK para requisições OPTIONS
    }
    next();
});

// Rota raiz para teste
app.get('/', (req, res) => {
    console.log('[Servidor Backend] Rota raiz / acessada!'); // Log para o Render
    res.send('🚀 Backend da Garagem Inteligente está no ar e pronto para decolar com previsões do tempo!');
});

// Endpoint da API
app.get('/api/previsao/:cidade', async (req, res) => {
    const { cidade } = req.params;
    console.log(`[Servidor Backend] Recebida requisição para /api/previsao/${cidade}`); // Log

    if (!apiKey) {
        console.error('[Servidor Backend] ERRO: OPENWEATHER_API_KEY não configurada no ambiente.');
        return res.status(500).json({ error: 'Configuração do servidor incompleta.' });
    }
    // ... (resto da sua lógica da API)
    // Seu código de busca da previsão já está bom.
    const weatherAPIUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidade)}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        console.log(`[Servidor Backend] Buscando previsão para: ${cidade}`);
        const apiResponse = await axios.get(weatherAPIUrl);
        console.log(`[Servidor Backend] Dados recebidos da OpenWeatherMap para ${cidade}. Status: ${apiResponse.status}`);
        res.json(apiResponse.data);
    } catch (error) {
        // ... (seu tratamento de erro para o axios call)
        if (error.response) {
            console.error(`[Servidor Backend] Erro da API OpenWeatherMap para ${cidade}: Status ${error.response.status}`, error.response.data?.message || error.response.data);
            return res.status(error.response.status).json({ error: error.response.data?.message || 'Erro ao buscar dados da OpenWeatherMap.' });
        } else if (error.request) {
            console.error(`[Servidor Backend] Nenhuma resposta da OpenWeatherMap para ${cidade}:`, error.message);
            return res.status(503).json({ error: 'Serviço da OpenWeatherMap indisponível ou sem resposta no momento.' });
        } else {
            console.error(`[Servidor Backend] Erro interno ao processar requisição para OpenWeatherMap (${cidade}):`, error.message);
            return res.status(500).json({ error: 'Erro interno no servidor ao tentar buscar previsão.' });
        }
    }
});

app.listen(port, () => {
    console.log(`🎉 Servidor backend da Garagem Inteligente rodando na porta ${port}`);
    if (apiKey) {
        console.log('🔑 Chave da API OpenWeatherMap (OPENWEATHER_API_KEY) carregada.');
    } else {
        console.warn('🤫 ATENÇÃO: OPENWEATHER_API_KEY não carregada. API de previsão não funcionará.');
    }
});