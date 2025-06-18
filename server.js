// server.js

import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();
const app = express();
const port = process.env.PORT || 3001;
const apiKey = process.env.OPENWEATHER_API_KEY;

// --- NOVO: NOSSO "ARSENAL DE DADOS" (Arrays Simulando um Banco de Dados) ---

const veiculosDestaque = [
    { 
        id: "vd01", 
        modelo: "Mustang Mach-E", 
        ano: 2024, 
        destaque: "Performance Elétrica e Design Icônico.", 
        imagemUrl: "https://www.ford.com/is/image/content/dam/vdm_ford/live/en_us/ford/nameplate/mustangmache/2023/collections/dm/23_mmc_gt_p_e1.tif?croppathe=1_3x2&wid=720" 
    },
    { 
        id: "vd02", 
        modelo: "Rivian R1T", 
        ano: 2023, 
        destaque: "A Picape Aventureira do Futuro.", 
        imagemUrl: "https://s3-prod.autonews.com/s3fs-public/styles/1200x630/public/RIVIAN-MAIN.jpg"
    },
    { 
        id: "vd03", 
        modelo: "Porsche Taycan Turbo S", 
        ano: 2024, 
        destaque: "Luxo, Velocidade e Sustentabilidade.", 
        imagemUrl: "https://files.porsche.com/filestore/image/multimedia/none/992-c4-gts-modelimage-sideshot/model/cfbb8ed3-1a15-11ed-80f5-005056bbdc38/porsche-model.png"
    }
];

const servicosGaragem = [
    { 
        id: "svc001", 
        nome: "Diagnóstico Eletrônico Completo", 
        descricao: "Verificação de todos os sistemas eletrônicos do veículo com scanners de última geração.", 
        precoEstimado: "R$ 250,00" 
    },
    { 
        id: "svc002", 
        nome: "Alinhamento e Balanceamento 3D", 
        descricao: "Para uma direção perfeita e maior durabilidade dos pneus.", 
        precoEstimado: "R$ 180,00" 
    },
    { 
        id: "svc003", 
        nome: "Polimento Técnico e Vitrificação", 
        descricao: "Proteção e brilho para a pintura do seu carro por até 3 anos.", 
        precoEstimado: "A partir de R$ 900,00" 
    },
    {
        id: "svc004",
        nome: "Revisão de Freios ABS",
        descricao: "Inspeção e troca de pastilhas, discos e fluído de freio.",
        precoEstimado: "R$ 450,00"
    }
];

// --- FIM DO ARSENAL DE DADOS ---


// CORS Middleware (essencial para a comunicação frontend-backend)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Rota raiz para teste
app.get('/', (req, res) => {
    res.send('🚀 Backend da Garagem Inteligente V3 está no ar com seu novo Arsenal de Dados!');
});


// --- NOVO: NOSSOS NOVOS ENDPOINTS GET ---

// Endpoint para retornar a lista completa de veículos em destaque
app.get('/api/garagem/veiculos-destaque', (req, res) => {
    console.log(`[Servidor] Requisição recebida para /api/garagem/veiculos-destaque`);
    res.json(veiculosDestaque);
});

// Endpoint para retornar a lista completa de serviços oferecidos
app.get('/api/garagem/servicos-oferecidos', (req, res) => {
    console.log(`[Servidor] Requisição recebida para /api/garagem/servicos-oferecidos`);
    res.json(servicosGaragem);
});

// Endpoint para buscar um serviço específico pelo seu ID
app.get('/api/garagem/servicos-oferecidos/:idServico', (req, res) => {
    const { idServico } = req.params; // Captura o ID da URL
    console.log(`[Servidor] Requisição para buscar serviço específico com ID: ${idServico}`);
    
    const servico = servicosGaragem.find(s => s.id === idServico);

    if (servico) {
        res.json(servico); // Se encontrou, retorna o serviço
    } else {
        // Se não encontrou, retorna um erro 404 (Not Found) com uma mensagem JSON
        res.status(404).json({ error: `Serviço com ID ${idServico} não encontrado.` });
    }
});

// --- FIM DOS NOVOS ENDPOINTS ---


// Endpoint já existente para a Previsão do Tempo
app.get('/api/previsao/:cidade', async (req, res) => {
    const { cidade } = req.params;
    console.log(`[Servidor Backend] Recebida requisição para /api/previsao/${cidade}`); 

    if (!apiKey) {
        console.error("[Servidor Backend] Erro: A chave da API OpenWeatherMap (OPENWEATHER_API_KEY) não está configurada no servidor.");
        return res.status(500).json({ error: 'Erro de configuração no servidor: chave da API de previsão do tempo ausente.' });
    }
    
    const weatherAPIUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidade)}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        console.log(`[Servidor Backend] Buscando previsão para: ${cidade}`);
        const apiResponse = await axios.get(weatherAPIUrl);
        console.log(`[Servidor Backend] Dados recebidos da OpenWeatherMap para ${cidade}. Status: ${apiResponse.status}`);
        res.json(apiResponse.data);
    } catch (error) {
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


// Inicia o servidor
app.listen(port, () => {
    console.log(`🚗 Servidor da Garagem Inteligente rodando na porta ${port}`);
    console.log(`🔗 Endpoints disponíveis:`);
    console.log(`   - GET /`);
    console.log(`   - GET /api/garagem/veiculos-destaque`);
    console.log(`   - GET /api/garagem/servicos-oferecidos`);
    console.log(`   - GET /api/garagem/servicos-oferecidos/:idServico`);
    console.log(`   - GET /api/previsao/:cidade`);
});