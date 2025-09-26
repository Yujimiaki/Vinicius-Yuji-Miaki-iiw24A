// models/Veiculo.js
import mongoose from 'mongoose';

const veiculoSchema = new mongoose.Schema({
    placa: {
        type: String,
        required: [true, 'A placa do veículo é obrigatória.'],
        unique: false, // <-- ALTERAÇÃO: Placas podem se repetir entre diferentes usuários
        uppercase: true,
        trim: true,
        match: [/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, 'Formato de placa inválido.']
    },
    marca: {
        type: String,
        required: [true, 'A marca do veículo é obrigatória.'],
        trim: true,
    },
    modelo: {
        type: String,
        required: [true, 'O modelo do veículo é obrigatório.'],
        trim: true,
    },
    ano: {
        type: Number,
        required: [true, 'O ano de fabricação é obrigatório.'],
        min: [1900, 'O ano de fabricação deve ser, no mínimo, 1900.'],
        max: [new Date().getFullYear() + 1, 'O ano de fabricação não pode ser um ano futuro.'],
    },
    cor: {
        type: String,
        trim: true,
        required: [true, 'A cor do veículo é obrigatória.'],
    },
    ligado: {
        type: Boolean,
        default: false,
    },
    velocidade: {
        type: Number,
        default: 0,
        min: 0,
    },
    // --- ADIÇÃO IMPORTANTE ABAIXO ---
    owner: {
      type: mongoose.Schema.Types.ObjectId, // Armazena o ID único de um usuário.
      ref: 'User', // Cria uma referência direta ao modelo 'User'.
      required: true // Todo veículo DEVE ter um dono.
    }
}, {
    timestamps: true
});

// Garante que a combinação de placa e dono seja única.
veiculoSchema.index({ placa: 1, owner: 1 }, { unique: true });


const Veiculo = mongoose.model('Veiculo', veiculoSchema);

export default Veiculo;