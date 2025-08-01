// server.js
import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
// CORREÇÃO COMUM: Adicionar import 'cors'
import cors from 'cors';

// VERIFIQUE: O caminho para o modelo está correto?
// Ele deve sair da raiz do projeto e entrar na pasta 'models'.
import Veiculo from './models/Veiculo.js';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// --- Middlewares Essenciais ---
// Habilita o CORS para permitir requisições do seu frontend (http://127.0.0.1:5500, etc.)
app.use(cors());
// Habilita o express a "entender" o corpo de requisições enviado em formato JSON. Essencial para o POST.
app.use(express.json());

// --- Conexão com o MongoDB Atlas ---
const mongoUri = process.env.MONGO_URI;

// VERIFICAÇÃO DE SEGURANÇA: Checa se a URI do banco de dados foi definida no .env
if (!mongoUri) {
    console.error("FATAL: A variável de ambiente MONGO_URI não está definida no arquivo .env");
    process.exit(1); // Encerra o servidor se a string de conexão não existir.
}

// Tenta se conectar ao banco de dados.
mongoose.connect(mongoUri)
    .then(() => {
        console.log("✅ Conectado ao MongoDB Atlas com sucesso!");

        // Só inicia o servidor Express DEPOIS que a conexão com o banco for bem-sucedida.
        app.listen(port, () => {
            console.log(`🚗 Servidor da Garagem Inteligente rodando em http://localhost:${port}`);
            console.log(`🔗 Endpoints CRUD de veículos disponíveis em /api/veiculos`);
        });

    })
    .catch(err => {
        // Se a conexão inicial falhar, exibe o erro e encerra o processo.
        console.error("❌ Erro fatal ao conectar com o MongoDB Atlas:", err);
        process.exit(1);
    });

// --- Rotas da API (Endpoints) ---

// Rota raiz para teste
app.get('/', (req, res) => {
    res.status(200).send('<h1>🚀 API da Garagem Inteligente V3 com MongoDB está no ar!</h1>');
});

/**
 * @route   POST /api/veiculos
 * @desc    Cria um novo veículo no banco de dados.
 */
app.post('/api/veiculos', async (req, res) => {
    // Usamos um bloco try...catch para capturar qualquer erro que aconteça
    // durante a interação com o banco de dados.
    try {
        const novoVeiculoData = req.body;
        console.log('[Servidor] Recebido para criar:', novoVeiculoData);

        const veiculoCriado = await Veiculo.create(novoVeiculoData);
        
        console.log('[Servidor] Veículo persistido no DB:', veiculoCriado);
        res.status(201).json(veiculoCriado); // Retorna 201 (Created)

    } catch (error) {
        console.error("[Servidor] Erro ao criar veículo:", error);
        
        if (error.code === 11000) {
            return res.status(409).json({ message: `Veículo com a placa '${error.keyValue.placa}' já existe.` });
        }
        if (error.name === 'ValidationError') {
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ message: `Dados inválidos: ${messages.join(' ')}` });
        }

        res.status(500).json({ message: 'Ocorreu um erro interno ao criar o veículo.' });
    }
});

/**
 * @route   GET /api/veiculos
 * @desc    Busca e retorna todos os veículos do banco de dados.
 */
app.get('/api/veiculos', async (req, res) => {
    try {
        const todosOsVeiculos = await Veiculo.find().sort({ createdAt: -1 });
        
        console.log(`[Servidor] ${todosOsVeiculos.length} veículos encontrados e enviados.`);
        res.status(200).json(todosOsVeiculos);

    } catch (error) {
        console.error("[Servidor] Erro ao buscar veículos:", error);
        res.status(500).json({ message: 'Ocorreu um erro interno ao buscar os veículos.' });
    }
});

// Nota: os endpoints da API de clima e outros mocks que você tinha foram removidos
// para focar na tarefa atual. Você pode adicioná-los de volta se precisar.

// **NÃO COLOCAMOS app.listen AQUI NOVAMENTE**
// Ele agora está dentro do .then() da conexão do Mongoose.