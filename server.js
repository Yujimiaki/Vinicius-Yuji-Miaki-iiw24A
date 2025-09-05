// server.js
import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import Veiculo from './models/Veiculo.js';
import Manutencao from './models/Manutencao.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

// --- ROTAS DE VEÍCULOS (CRUD) ---

app.post('/api/veiculos', async (req, res) => {
    try {
        const novoVeiculoData = req.body;
        const veiculoCriado = await Veiculo.create(novoVeiculoData);
        res.status(201).json(veiculoCriado);
    } catch (error) {
        console.error("[ERRO NO POST /api/veiculos]", error);
        if (error.code === 11000) {
            return res.status(409).json({ message: `Veículo com a placa '${error.keyValue.placa}' já existe.` });
        }
        if (error.name === 'ValidationError') {
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ message: `Dados inválidos: ${messages.join(' ')}` });
        }
        res.status(500).json({ message: 'Ocorreu um erro inesperado no servidor ao criar o veículo.', error: error.message });
    }
});

app.get('/api/veiculos', async (req, res) => {
    try {
        const todosOsVeiculos = await Veiculo.find().sort({ createdAt: -1 });
        res.status(200).json(todosOsVeiculos);
    } catch (error) {
        console.error("[ERRO NO GET /api/veiculos]", error);
        res.status(500).json({ message: 'Ocorreu um erro interno ao buscar os veículos.' });
    }
});

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

app.put('/api/veiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de veículo inválido fornecido.' });
        }
        const dadosParaAtualizar = {
            placa: req.body.placa,
            marca: req.body.marca,
            modelo: req.body.modelo,
            ano: req.body.ano,
            cor: req.body.cor,
        };
        const veiculoAtualizado = await Veiculo.findByIdAndUpdate(id, dadosParaAtualizar, { new: true, runValidators: true });
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

// --- ROTAS DE AÇÃO DO VEÍCULO ---

const handleAction = async (req, res, action) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de veículo inválido.' });
        }
        const veiculo = await Veiculo.findById(id);
        if (!veiculo) {
            return res.status(404).json({ message: 'Veículo não encontrado.' });
        }
        const result = action(veiculo);
        if (result.success) {
            await veiculo.save();
            return res.status(200).json({ message: result.message, veiculo });
        } else {
            return res.status(400).json({ message: result.message, veiculo });
        }
    } catch (error) {
        console.error(`[ERRO NA AÇÃO /api/veiculos/${req.params.id}]`, error);
        res.status(500).json({ message: 'Erro interno no servidor ao processar a ação.' });
    }
};

app.post('/api/veiculos/:id/ligar', (req, res) => handleAction(req, res, (veiculo) => {
    if (veiculo.ligado) return { success: false, message: `${veiculo.modelo} já está ligado.` };
    veiculo.ligado = true;
    return { success: true, message: `Vrum vrum! ${veiculo.modelo} ligado.` };
}));

app.post('/api/veiculos/:id/desligar', (req, res) => handleAction(req, res, (veiculo) => {
    if (!veiculo.ligado) return { success: false, message: `${veiculo.modelo} já está desligado.` };
    veiculo.ligado = false;
    veiculo.velocidade = 0;
    return { success: true, message: `${veiculo.modelo} desligado. O silêncio é dourado.` };
}));

app.post('/api/veiculos/:id/acelerar', (req, res) => handleAction(req, res, (veiculo) => {
    const VELOCIDADE_MAXIMA = 220;
    const INCREMENTO = 15;
    if (!veiculo.ligado) return { success: false, message: 'Não dá pra acelerar um carro desligado!' };
    if (veiculo.velocidade >= VELOCIDADE_MAXIMA) return { success: false, message: 'Velocidade máxima atingida!' };
    veiculo.velocidade = Math.min(veiculo.velocidade + INCREMENTO, VELOCIDADE_MAXIMA);
    return { success: true, message: 'Acelerando...' };
}));

app.post('/api/veiculos/:id/frear', (req, res) => handleAction(req, res, (veiculo) => {
    const DECREMENTO = 20;
    if (veiculo.velocidade === 0) return { success: false, message: 'O carro já está parado.' };
    veiculo.velocidade = Math.max(0, veiculo.velocidade - DECREMENTO);
    return { success: true, message: 'Freando...' };
}));


// --- ROTAS PARA O SUB-RECURSO MANUTENÇÃO ---

app.post('/api/veiculos/:veiculoId/manutencoes', async (req, res) => {
    try {
        const { veiculoId } = req.params;
        const veiculoExiste = await Veiculo.findById(veiculoId);
        if (!veiculoExiste) {
            return res.status(404).json({ message: 'Veículo não encontrado. Não é possível adicionar manutenção.' });
        }
        const novaManutencao = await Manutencao.create({ ...req.body, veiculo: veiculoId });
        res.status(201).json(novaManutencao);
    } catch (error) {
        console.error("[ERRO NO POST /manutencoes]", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: `Dados inválidos: ${messages.join(' ')}` });
        }
        res.status(500).json({ message: 'Ocorreu um erro inesperado no servidor ao criar a manutenção.' });
    }
});

app.get('/api/veiculos/:veiculoId/manutencoes', async (req, res) => {
    try {
        const { veiculoId } = req.params;
        const veiculoExiste = await Veiculo.findById(veiculoId);
        if (!veiculoExiste) {
            return res.status(404).json({ message: 'Veículo não encontrado.' });
        }
        const manutencoes = await Manutencao.find({ veiculo: veiculoId }).sort({ data: -1 });
        res.status(200).json(manutencoes);
    } catch (error) {
        console.error("[ERRO NO GET /manutencoes]", error);
        res.status(500).json({ message: 'Ocorreu um erro interno ao buscar as manutenções.' });
    }
});