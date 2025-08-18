const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  description: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Descrição é obrigatória'
      },
      len: {
        args: [1, 255],
        msg: 'Descrição deve ter entre 1 e 255 caracteres'
      }
    }
  },
  
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'Valor deve ser um número decimal válido'
      },
      min: {
        args: [0.01],
        msg: 'Valor deve ser maior que zero'
      }
    },
    get() {
      const value = this.getDataValue('amount');
      return value ? parseFloat(value) : 0;
    }
  },
  
  type: {
    type: DataTypes.ENUM('income', 'expense'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['income', 'expense']],
        msg: 'Tipo deve ser "income" ou "expense"'
      }
    }
  },
  
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  
  // Relacionamentos
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  
  // Campos opcionais
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  tags: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
    defaultValue: 'completed'
  }
  
}, {
  tableName: 'transactions',
  timestamps: true,
  
  indexes: [
    { fields: ['userId'] },
    { fields: ['categoryId'] },
    { fields: ['type'] },
    { fields: ['date'] },
    { fields: ['userId', 'date'] }
  ],
  
  hooks: {
    beforeValidate: (transaction) => {
      if (transaction.description) {
        transaction.description = transaction.description.trim();
      }
      if (transaction.notes) {
        transaction.notes = transaction.notes.trim();
      }
    }
  }
});

module.exports = Transaction;
