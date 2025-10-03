// server.js
import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import Veiculo from './models/Veiculo.js';
import Manutencao from './models/Manutencao.js';
import User from './models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authMiddleware from './middleware/auth.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
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

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'A senha deve ter no mínimo 6 caracteres.' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Este e-mail já está em uso.' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'Usuário registrado com sucesso! Agora você pode fazer login.' });
    } catch (error) {
        console.error("[ERRO NO REGISTRO]", error);
        res.status(500).json({ message: 'Erro no servidor ao tentar registrar.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'E-mail ou senha inválidos.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'E-mail ou senha inválidos.' });
        }
        const payload = { userId: user._id };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'SEU_SEGREDO_SUPER_SECRETO', { expiresIn: '1h' });
        res.status(200).json({ message: 'Login bem-sucedido!', token });
    } catch (error) {
        console.error("[ERRO NO LOGIN]", error);
        res.status(500).json({ message: 'Erro no servidor ao tentar fazer login.' });
    }
});


// --- ROTAS DE VEÍCULOS (CRUD) ---
app.get('/api/veiculos', authMiddleware, async (req, res) => {
    try {
        const todosOsVeiculos = await Veiculo.find({ owner: req.userId }).sort({ createdAt: -1 });
        res.status(200).json(todosOsVeiculos);
    } catch (error) {
        console.error("[ERRO NO GET /api/veiculos]", error);
        res.status(500).json({ message: 'Ocorreu um erro interno ao buscar os veículos.' });
    }
});

app.post('/api/veiculos', authMiddleware, async (req, res) => {
    try {
        const novoVeiculoData = { ...req.body, owner: req.userId };
        const veiculoCriado = await Veiculo.create(novoVeiculoData);
        res.status(201).json(veiculoCriado);
    } catch (error) {
        console.error("[ERRO NO POST /api/veiculos]", error);

        if (error.name === 'ValidationError') {
            const mensagens = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: mensagens.join(' ') });
        }
        if (error.code === 11000) {
            return res.status(409).json({ message: `Você já possui um veículo com a placa '${req.body.placa}'.` });
        }
        
        res.status(500).json({ message: 'Ocorreu um erro inesperado no servidor ao criar o veículo.'});
    }
});

app.get('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) { return res.status(400).json({ message: 'ID do veículo inválido.' }); }
        const veiculo = await Veiculo.findById(id);
        if (!veiculo) { return res.status(404).json({ message: 'Veículo não encontrado.' }); }
        if (veiculo.owner.toString() !== req.userId) { return res.status(403).json({ message: 'Acesso negado.' }); }
        res.status(200).json(veiculo);
    } catch (error) {
        console.error(`[ERRO NO GET /api/veiculos/${req.params.id}]`, error);
        res.status(500).json({ message: 'Erro interno ao buscar o veículo.' });
    }
});

app.put('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) { return res.status(400).json({ message: 'ID do veículo inválido.' }); }
        const veiculo = await Veiculo.findById(id);
        if (!veiculo) { return res.status(404).json({ message: 'Veículo não encontrado.' }); }
        if (veiculo.owner.toString() !== req.userId) { return res.status(403).json({ message: 'Acesso negado.' }); }
        const veiculoAtualizado = await Veiculo.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        res.status(200).json(veiculoAtualizado);
    } catch (error) {
        console.error(`[ERRO NO PUT /api/veiculos/${req.params.id}]`, error);
        res.status(500).json({ message: 'Erro interno ao atualizar o veículo.' });
    }
});

app.delete('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) { return res.status(400).json({ message: 'ID do veículo inválido.' }); }
        const veiculo = await Veiculo.findById(id);
        if (!veiculo) { return res.status(404).json({ message: 'Veículo não encontrado.' }); }
        if (veiculo.owner.toString() !== req.userId) { return res.status(403).json({ message: 'Acesso negado.' }); }
        const resultadoManutencoes = await Manutencao.deleteMany({ veiculo: id });
        const veiculoDeletado = await Veiculo.findByIdAndDelete(id);
        res.status(200).json({ 
            message: `Veículo '${veiculoDeletado.modelo}' e suas ${resultadoManutencoes.deletedCount} manutenções foram deletados.` 
        });
    } catch (error) {
        console.error(`[ERRO NO DELETE /api/veiculos/${req.params.id}]`, error);
        res.status(500).json({ message: 'Erro interno ao deletar o veículo.' });
    }
});

// --- ROTAS DE AÇÃO E MANUTENÇÃO ---
const handleAction = async (req, res, action) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) { return res.status(400).json({ message: 'ID do veículo inválido.' });}
        const veiculo = await Veiculo.findById(id);
        if (!veiculo) { return res.status(404).json({ message: 'Veículo não encontrado.' }); }
        if (veiculo.owner.toString() !== req.userId) { return res.status(403).json({ message: 'Acesso negado.' }); }
        const result = action(veiculo);
        await veiculo.save();
        return res.status(200).json({ message: result.message, veiculo });
    } catch (error) {
        console.error(`[ERRO NA AÇÃO /api/veiculos/${req.params.id}]`, error);
        res.status(500).json({ message: 'Erro interno no servidor ao processar a ação.' });
    }
};

app.post('/api/veiculos/:id/ligar', authMiddleware, (req, res) => handleAction(req, res, (v) => v.ligado ? {message:`${v.modelo} já está ligado.`} : (v.ligado=true, {message:`Vrum! ${v.modelo} ligado.`})));
app.post('/api/veiculos/:id/desligar', authMiddleware, (req, res) => handleAction(req, res, (v) => !v.ligado ? {message:`${v.modelo} já está desligado.`} : (v.ligado=false,v.velocidade=0,{message:`${v.modelo} desligado.`})));
app.post('/api/veiculos/:id/acelerar', authMiddleware, (req, res) => handleAction(req, res, (v) => !v.ligado ? {message:'Carro desligado!'} : (v.velocidade>=220 ? {message:'Velocidade máxima atingida!'} : (v.velocidade=Math.min(v.velocidade+15,220),{message:'Acelerando...'}))));
app.post('/api/veiculos/:id/frear', authMiddleware, (req, res) => handleAction(req, res, (v) => v.velocidade===0 ? {message:'O carro já está parado.'} : (v.velocidade=Math.max(0,v.velocidade-20),{message:'Freando...'})));

app.post('/api/veiculos/:veiculoId/manutencoes', authMiddleware, async (req, res) => {
    try {
        const { veiculoId } = req.params;
        const veiculoExiste = await Veiculo.findOne({ _id: veiculoId, owner: req.userId });
        if (!veiculoExiste) { return res.status(404).json({ message: 'Veículo não encontrado ou não pertence a você.' }); }
        const novaManutencao = await Manutencao.create({ ...req.body, veiculo: veiculoId });
        res.status(201).json(novaManutencao);
    } catch (error) {
        console.error(`[ERRO NO POST /api/veiculos/${req.params.veiculoId}/manutencoes]`, error);
        res.status(500).json({ message: 'Erro ao adicionar manutenção.' });
    }
});

app.get('/api/veiculos/:veiculoId/manutencoes', authMiddleware, async (req, res) => {
    try {
        const { veiculoId } = req.params;
        const veiculoExiste = await Veiculo.findOne({ _id: veiculoId, owner: req.userId });
        if (!veiculoExiste) { return res.status(404).json({ message: 'Veículo não encontrado ou não pertence a você.' }); }
        const manutencoes = await Manutencao.find({ veiculo: veiculoId }).sort({ data: -1 });
        res.status(200).json(manutencoes);
    } catch (error) {
        console.error(`[ERRO NO GET /api/veiculos/${req.params.veiculoId}/manutencoes]`, error);
        res.status(500).json({ message: 'Erro ao buscar manutenções.' });
    }
});