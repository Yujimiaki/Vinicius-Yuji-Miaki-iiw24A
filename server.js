// server.js

// ===================================================================================
// ARQUIVO COMPLETO E CORRIGIDO - Garagem Inteligente V3 (server.js)
// ===================================================================================

// server.js

import dotenv from 'dotenv';
dotenv.config(); // <--- ESTA LINHA PRECISA ESTAR AQUI, LOGO DEPOIS DO IMPORT!

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer'; // APENAS UMA VEZ
import Veiculo from './models/Veiculo.js';
import Manutencao from './models/Manutencao.js';
import User from './models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authMiddleware from './middleware/auth.js';


// ==============================================================
// ---- COLE ESTE BLOCO DE CÓDIGO EXATAMENTE AQUI ----
// Configuração do Multer para criar a variável 'upload'
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });
// ==============================================================





// O resto do seu código começa aqui...
const app = express();
// ...etc
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI )
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
        if (!email || !password || password.length < 6) {
            return res.status(400).json({ message: 'E-mail e senha (mínimo 6 caracteres) são obrigatórios.' });
        }
        if (await User.findOne({ email })) {
            return res.status(400).json({ message: 'Este e-mail já está em uso.' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'Usuário registrado com sucesso! Agora você pode fazer login.' });
    } catch (error) {
        console.error("[ERRO REGISTRO]", error);
        res.status(500).json({ message: 'Erro no servidor ao tentar registrar.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'E-mail ou senha inválidos.' });
        }
        const payload = { userId: user._id, email: user.email };
       const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login bem-sucedido!', token });
    } catch (error) {
        console.error("[ERRO LOGIN]", error);
        res.status(500).json({ message: 'Erro no servidor ao tentar fazer login.' });
    }
});

// --- ROTAS DE VEÍCULOS (CRUD E COMPARTILHAMENTO) ---

// ROTA ATUALIZADA para listar veículos próprios E compartilhados
app.get('/api/veiculos', authMiddleware, async (req, res) => {
    try {
        const veiculos = await Veiculo.find({
            $or: [{ owner: req.userId }, { sharedWith: req.userId }]
        }).populate('owner', 'email').sort({ createdAt: -1 });
        res.status(200).json(veiculos);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar os veículos.' });
    }
});

// DENTRO DO SEU server.js

// Rota de criação de Veículo ATUALIZADA
app.post('/api/veiculos', authMiddleware, upload.single('imagem'), async (req, res) => {
    try {
        // Agora, os dados de texto vêm em `req.body` e o arquivo de imagem em `req.file`
        const novoVeiculoData = {
            ...req.body, // Pega tipo, placa, marca, modelo, etc.
            owner: req.userId,
            imageUrl: req.file ? req.file.path : null // Se um arquivo foi enviado, salva o caminho dele
        };
        
        const veiculoCriado = await Veiculo.create(novoVeiculoData);
        res.status(201).json(veiculoCriado);

    } catch (error) {
        // Lógica de tratamento de erro que você já tem
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: Object.values(error.errors).map(val => val.message).join(' ') });
        }
        res.status(500).json({ message: 'Erro inesperado ao criar o veículo.'});
    }
});

// #### ROTA DE COMPARTILHAMENTO - AQUI ESTAVA O PROBLEMA ####
app.post('/api/veiculos/:veiculoId/share', authMiddleware, async (req, res) => {
    try {
        const { veiculoId } = req.params;
        const { email } = req.body;

        const veiculo = await Veiculo.findById(veiculoId);
        if (!veiculo) return res.status(404).json({ message: 'Veículo não encontrado.' });
        
        // Apenas o proprietário pode compartilhar
        if (veiculo.owner.toString() !== req.userId) {
            return res.status(403).json({ message: 'Acesso negado. Apenas o proprietário pode compartilhar.' });
        }

        const userToShareWith = await User.findOne({ email });
        if (!userToShareWith) return res.status(404).json({ message: `Usuário com e-mail '${email}' não encontrado.` });
        if (userToShareWith._id.toString() === req.userId) return res.status(400).json({ message: 'Você não pode compartilhar um veículo com você mesmo.' });

        if (veiculo.sharedWith.includes(userToShareWith._id)) {
            return res.status(409).json({ message: `Veículo já compartilhado com ${email}.` });
        }

        veiculo.sharedWith.push(userToShareWith._id);
        await veiculo.save();

        res.status(200).json({ message: `Veículo '${veiculo.modelo}' compartilhado com ${email}.` });

    } catch (error) {
        console.error('[ERRO COMPARTILHAR]', error);
        res.status(500).json({ message: 'Erro interno ao tentar compartilhar o veículo.' });
    }
});

app.get('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const veiculo = await Veiculo.findById(id).populate('owner', 'email');
        if (!veiculo) return res.status(404).json({ message: 'Veículo não encontrado.' });
        
        const isOwner = veiculo.owner._id.toString() === req.userId;
        const isSharedWith = veiculo.sharedWith.some(id => id.toString() === req.userId);
        
        if (!isOwner && !isSharedWith) return res.status(403).json({ message: 'Acesso negado.' });
        
        res.status(200).json(veiculo);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar o veículo.' });
    }
});

// Resto das rotas (PUT, DELETE, etc.) que não precisam de alteração
// ...