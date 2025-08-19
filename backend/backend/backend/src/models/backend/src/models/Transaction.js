const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'ID do usuário é obrigatório']
  },
  
  type: { 
    type: String, 
    enum: {
      values: ['income', 'expense'],
      message: 'Tipo deve ser income ou expense'
    },
    required: [true, 'Tipo da transação é obrigatório']
  },
  
  category: { 
    type: String, 
    required: [true, 'Categoria é obrigatória'],
    trim: true,
    maxlength: [30, 'Categoria deve ter no máximo 30 caracteres']
  },
  
  description: { 
    type: String, 
    required: [true, 'Descrição é obrigatória'],
    trim: true,
    maxlength: [100, 'Descrição deve ter no máximo 100 caracteres']
  },
  
  amount: { 
    type: Number, 
    required: [true, 'Valor é obrigatório'],
    min: [0.01, 'Valor deve ser maior que zero']
  },
  
  date: { 
    type: Date, 
    default: Date.now 
  },
  
  cashback: { 
    type: Number, 
    default: 0,
    min: [0, 'Cashback não pode ser negativo']
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag deve ter no máximo 20 caracteres']
  }],
  
  // Campos adicionais úteis
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'other'],
    default: 'other'
  },
  
  recurring: {
    type: Boolean,
    default: false
  },
  
  notes: {
    type: String,
    maxlength: [200, 'Observações devem ter no máximo 200 caracteres']
  }
}, {
  timestamps: true
});

// Índices para performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });

// Middleware para atualizar data de modificação
transactionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
