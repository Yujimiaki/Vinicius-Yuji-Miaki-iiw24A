// server.js
import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import Veiculo from './models/Veiculo.js';
import Manutencao from './models/Manutencao.js';
import User from './models/user.js';             // <-- ADICIONADO
import bcrypt from 'bcryptjs';                   // <-- ADICIONADO
import jwt from 'jsonwebtoken';                  // <-- ADICIONADO
import authMiddleware from './middleware/auth.js'; // <-- ADICIONADO

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ... (Conexão com o MongoDB existente) ...
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

// --- ROTAS DE AUTENTICAÇÃO --- (NOVO BLOCO)

// POST /api/auth/register (Endpoint de Registro)
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

// POST /api/auth/login (Endpoint de Login)
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


// --- ROTAS DE VEÍCULOS (CRUD) --- (BLOCO MODIFICADO)

// GET /api/veiculos (PROTEGIDO E FILTRADO)
app.get('/api/veiculos', authMiddleware, async (req, res) => {
    try {
        const todosOsVeiculos = await Veiculo.find({ owner: req.userId }).sort({ createdAt: -1 });
        res.status(200).json(todosOsVeiculos);
    } catch (error) {
        console.error("[ERRO NO GET /api/veiculos]", error);
        res.status(500).json({ message: 'Ocorreu um erro interno ao buscar os veículos.' });
    }
});

// POST /api/veiculos (PROTEGIDO E COM DONO)
app.post('/api/veiculos', authMiddleware, async (req, res) => {
    try {
        const novoVeiculoData = { ...req.body, owner: req.userId }; // Adiciona o dono
        const veiculoCriado = await Veiculo.create(novoVeiculoData);
        res.status(201).json(veiculoCriado);
    } catch (error) {
        console.error("[ERRO NO POST /api/veiculos]", error);
        if (error.code === 11000) {
            return res.status(409).json({ message: `Você já possui um veículo com a placa '${req.body.placa}'.` });
        }
        // ... (resto do tratamento de erro)
        res.status(500).json({ message: 'Ocorreu um erro inesperado no servidor ao criar o veículo.'});
    }
});


// GET /api/veiculos/:id (PROTEGIDO E COM VERIFICAÇÃO DE DONO)
app.get('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) { /* ... */ }
        const veiculo = await Veiculo.findById(id);
        if (!veiculo) {
            return res.status(404).json({ message: 'Veículo não encontrado.' });
        }
        // VERIFICAÇÃO DE DONO
        if (veiculo.owner.toString() !== req.userId) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        res.status(200).json(veiculo);
    } catch (error) {
        // ... (tratamento de erro)
    }
});

// PUT /api/veiculos/:id (PROTEGIDO E COM VERIFICAÇÃO DE DONO)
app.put('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        // ... (validações)
        const veiculo = await Veiculo.findById(id);
        if (!veiculo) { return res.status(404).json({ message: 'Veículo não encontrado.' }); }
        if (veiculo.owner.toString() !== req.userId) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const veiculoAtualizado = await Veiculo.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        res.status(200).json(veiculoAtualizado);
    } catch (error) {
        // ... (tratamento de erro)
    }
});


// DELETE /api/veiculos/:id (PROTEGIDO E COM VERIFICAÇÃO DE DONO)
app.delete('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) { /* ... */ }
        
        const veiculo = await Veiculo.findById(id);
        if (!veiculo) {
            return res.status(404).json({ message: 'Veículo não encontrado.' });
        }
        // VERIFICAÇÃO DE DONO
        if (veiculo.owner.toString() !== req.userId) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const resultadoManutencoes = await Manutencao.deleteMany({ veiculo: id });
        const veiculoDeletado = await Veiculo.findByIdAndDelete(id);
        
        res.status(200).json({ 
            message: `Veículo '${veiculoDeletado.modelo}' e suas ${resultadoManutencoes.deletedCount} manutenções foram deletados.` 
        });
    } catch (error) {
        // ... (tratamento de erro)
    }
});


// --- ROTAS DE AÇÃO DO VEÍCULO --- (TODAS PROTEGIDAS E COM VERIFICAÇÃO)

const handleAction = async (req, res, action) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) { /* ... */ }
        
        const veiculo = await Veiculo.findById(id);
        if (!veiculo) { return res.status(404).json({ message: 'Veículo não encontrado.' }); }
        
        // VERIFICAÇÃO DE DONO
        if (veiculo.owner.toString() !== req.userId) {
            return res.status(403).json({ message: 'Acesso negado.' });
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

// Adiciona o authMiddleware a todas as rotas de ação
app.post('/api/veiculos/:id/ligar', authMiddleware, (req, res) => handleAction(req, res, (v) => v.ligar ? {s:0,m:`${v.modelo} já ligado.`} : (v.ligado=true, {s:1,m:`Vrum! ${v.modelo} ligado.`})));
app.post('/api/veiculos/:id/desligar', authMiddleware, (req, res) => handleAction(req, res, (v) => !v.ligado ? {s:0,m:`${v.modelo} já desligado.`} : (v.ligado=false,v.velocidade=0,{s:1,m:`${v.modelo} desligado.`})));
app.post('/api/veiculos/:id/acelerar', authMiddleware, (req, res) => handleAction(req, res, (v) => !v.ligado ? {s:0,m:'Carro desligado!'} : (v.velocidade>=220 ? {s:0,m:'Vel. máx!'} : (v.velocidade=Math.min(v.velocidade+15,220),{s:1,m:'Acelerando...'}))));
app.post('/api/veiculos/:id/frear', authMiddleware, (req, res) => handleAction(req, res, (v) => v.velocidade===0 ? {s:0,m:'Carro parado.'} : (v.velocidade=Math.max(0,v.velocidade-20),{s:1,m:'Freando...'})));


// --- ROTAS DE MANUTENÇÃO --- (TODAS PROTEGIDAS E COM VERIFICAÇÃO)

app.post('/api/veiculos/:veiculoId/manutencoes', authMiddleware, async (req, res) => {
    try {
        const { veiculoId } = req.params;
        const veiculoExiste = await Veiculo.findById(veiculoId);
        if (!veiculoExiste) { return res.status(404).json({ message: 'Veículo não encontrado.' }); }
        
        // VERIFICAÇÃO DE DONO
        if (veiculoExiste.owner.toString() !== req.userId) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const novaManutencao = await Manutencao.create({ ...req.body, veiculo: veiculoId });
        res.status(201).json(novaManutencao);
    } catch (error) {
        // ... (tratamento de erro)
    }
});

app.get('/api/veiculos/:veiculoId/manutencoes', authMiddleware, async (req, res) => {
    try {
        const { veiculoId } = req.params;
        const veiculoExiste = await Veiculo.findById(veiculoId);
        if (!veiculoExiste) { return res.status(404).json({ message: 'Veículo não encontrado.' }); }

        // VERIFICAÇÃO DE DONO
        if (veiculoExiste.owner.toString() !== req.userId) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const manutencoes = await Manutencao.find({ veiculo: veiculoId }).sort({ data: -1 });
        res.status(200).json(manutencoes);
    } catch (error) {
        // ... (tratamento de erro)
    }
});