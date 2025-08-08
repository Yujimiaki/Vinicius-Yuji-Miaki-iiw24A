// server.js
import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import Veiculo from './models/Veiculo.js';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// --- Middlewares Essenciais ---
app.use(cors());
app.use(express.json());

// --- Conexão com o MongoDB Atlas ---
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
    console.error("FATAL: A variável de ambiente MONGO_URI não está definida no arquivo .env");
    process.exit(1);
}

mongoose.connect(mongoUri)
    .then(() => {
        console.log("✅ Conectado ao MongoDB Atlas com sucesso!");
        app.listen(port, () => {
            console.log(`🚗 Servidor da Garagem Inteligente rodando em http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error("❌ Erro fatal ao conectar com o MongoDB Atlas:", err);
        process.exit(1);
    });

// --- Rotas da API (Endpoints) ---

app.get('/', (req, res) => {
    res.status(200).send('<h1>🚀 API da Garagem Inteligente V3 com MongoDB está no ar!</h1>');
});

/**
 * @route   POST /api/veiculos
 * @desc    Cria um novo veículo.
 */
app.post('/api/veiculos', async (req, res) => {
    try {
        const novoVeiculoData = req.body;
        const veiculoCriado = await Veiculo.create(novoVeiculoData);
        res.status(201).json(veiculoCriado);
    } catch (error) {
        // --- MELHORIA CRÍTICA AQUI ---
        console.error("[ERRO NO POST /api/veiculos]", error); // Loga o erro completo no terminal do backend

        if (error.code === 11000) {
            return res.status(409).json({ message: `Veículo com a placa '${error.keyValue.placa}' já existe.` });
        }
        if (error.name === 'ValidationError') {
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ message: `Dados inválidos: ${messages.join(' ')}` });
        }
        
        // Envia uma mensagem de erro mais específica
        res.status(500).json({ message: 'Ocorreu um erro inesperado no servidor ao criar o veículo.', error: error.message });
    }
});

/**
 * @route   GET /api/veiculos
 * @desc    Busca e retorna todos os veículos.
 */
app.get('/api/veiculos', async (req, res) => {
    try {
        const todosOsVeiculos = await Veiculo.find().sort({ createdAt: -1 });
        res.status(200).json(todosOsVeiculos);
    } catch (error) {
        console.error("[ERRO NO GET /api/veiculos]", error);
        res.status(500).json({ message: 'Ocorreu um erro interno ao buscar os veículos.' });
    }
});

/**
 * @route   GET /api/veiculos/:id
 * @desc    Busca um único veículo pelo seu ID.
 */
app.get('/api/veiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de veículo inválido fornecido.' });
        }
        const veiculo = await Veiculo.findById(id);
        if (!veiculo) {
            return res.status(404).json({ message: 'Veículo não encontrado.' });
        }
        res.status(200).json(veiculo);
    } catch (error) {
        console.error(`[ERRO NO GET /api/veiculos/${req.params.id}]`, error);
        res.status(500).json({ message: 'Ocorreu um erro interno ao buscar o veículo.' });
    }
});

/**
 * @route   PUT /api/veiculos/:id
 * @desc    Atualiza um veículo existente.
 */
app.put('/api/veiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de veículo inválido fornecido.' });
        }
        const veiculoAtualizado = await Veiculo.findByIdAndUpdate(
            id, 
            req.body, 
            { new: true, runValidators: true }
        );
        if (!veiculoAtualizado) {
            return res.status(404).json({ message: 'Veículo não encontrado para atualização.' });
        }
        res.status(200).json(veiculoAtualizado);
    } catch (error) {
        console.error(`[ERRO NO PUT /api/veiculos/${req.params.id}]`, error);
        if (error.name === 'ValidationError') {
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ message: `Dados inválidos: ${messages.join(' ')}` });
        }
        res.status(500).json({ message: 'Ocorreu um erro interno ao atualizar o veículo.', error: error.message });
    }
});

/**
 * @route   DELETE /api/veiculos/:id
 * @desc    Deleta um veículo.
 */
app.delete('/api/veiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;
         if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de veículo inválido fornecido.' });
        }
        const veiculoDeletado = await Veiculo.findByIdAndDelete(id);
        if (!veiculoDeletado) {
            return res.status(404).json({ message: 'Veículo não encontrado para exclusão.' });
        }
        res.status(200).json({ message: `Veículo '${veiculoDeletado.modelo}' (Placa: ${veiculoDeletado.placa}) foi deletado com sucesso.` });
    } catch (error) {
        console.error(`[ERRO NO DELETE /api/veiculos/${req.params.id}]`, error);
        res.status(500).json({ message: 'Ocorreu um erro interno ao deletar o veículo.', error: error.message });
    }
});