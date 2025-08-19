const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true
  },
  type: { 
    type: String, 
    enum: ['income', 'expense'],
    required: true
  },
  category: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 30
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0.01
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  cashback: { 
    type: Number, 
    default: 0,
    min: 0
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 20
  }],
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
    maxlength: 200
  }
}, {
  timestamps: true
});

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
