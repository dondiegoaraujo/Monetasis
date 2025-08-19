const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Dados básicos de autenticação
  name: { 
    type: String, 
    required: [true, 'Nome é obrigatório'],
    trim: true,
    maxlength: [50, 'Nome deve ter no máximo 50 caracteres']
  },
  email: { 
    type: String, 
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  password: { 
    type: String, 
    required: [true, 'Senha é obrigatória'],
    minlength: [6, 'Senha deve ter no mínimo 6 caracteres']
  },
  
  // Dados financeiros
  monthlyIncome: { 
    type: Number, 
    default: 0,
    min: [0, 'Renda não pode ser negativa']
  },
  monthlyExpenses: { 
    type: Number, 
    default: 0,
    min: [0, 'Gastos não podem ser negativos']
  },
  savingsGoal: { 
    type: Number, 
    default: 0,
    min: [0, 'Meta de economia não pode ser negativa']
  },
  
  // Configurações do usuário
  notifications: { 
    type: Boolean, 
    default: true 
  },
  theme: { 
    type: String, 
    enum: ['light', 'dark'],
    default: 'light' 
  },
  
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastLogin: { 
    type: Date 
  },
  
  // Status da conta
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

// Índices para performance
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

// Método para não retornar senha em consultas
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
