const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Nome da categoria é obrigatório'
      },
      len: {
        args: [1, 100],
        msg: 'Nome deve ter entre 1 e 100 caracteres'
      }
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
  
  color: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#6366F1',
    validate: {
      is: {
        args: /^#[0-9A-F]{6}$/i,
        msg: 'Cor deve ser um código hexadecimal válido (#RRGGBB)'
      }
    }
  },
  
  icon: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: '📊',
    validate: {
      len: {
        args: [1, 50],
        msg: 'Ícone deve ter entre 1 e 50 caracteres'
      }
    }
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 500],
        msg: 'Descrição não pode exceder 500 caracteres'
      }
    }
  },
  
  // Relacionamentos
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  
  // Configurações
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // Ordem para exibição
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // Configurações de orçamento
  budgetConfig: {
    type: DataTypes.JSONB,
    defaultValue: {
      hasLimit: false,
      monthlyLimit: null,
      alertPercentage: 80
    },
    validate: {
      isValidBudgetConfig(value) {
        if (value && typeof value === 'object') {
          if (value.hasLimit && !value.monthlyLimit) {
            throw new Error('Limite mensal é obrigatório quando hasLimit é true');
          }
          
          if (value.monthlyLimit && value.monthlyLimit <= 0) {
            throw new Error('Limite mensal deve ser maior que zero');
          }
          
          if (value.alertPercentage && (value.alertPercentage <= 0 || value.alertPercentage > 100)) {
            throw new Error('Porcentagem de alerta deve estar entre 1 e 100');
          }
        }
      }
    }
  },
  
  // Metadados
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
  
}, {
  tableName: 'categories',
  timestamps: true,
  
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['userId', 'type']
    },
    {
      fields: ['userId', 'name'],
      unique: true,
      where: {
        isActive: true
      }
    },
    {
      fields: ['parentId']
    },
    {
      fields: ['sortOrder']
    }
  ],
  
  scopes: {
    // Categorias ativas
    active: {
      where: {
        isActive: true
      }
    },
    
    // Apenas receitas
    income: {
      where: {
        type: 'income',
        isActive: true
      }
    },
    
    // Apenas despesas
    expense: {
      where: {
        type: 'expense',
        isActive: true
      }
    },
    
    // Categorias principais (sem parent)
    main: {
      where: {
        parentId: null,
        isActive: true
      }
    },
    
    // Subcategorias
    sub: {
      where: {
        parentId: {
          [sequelize.Sequelize.Op.ne]: null
        },
        isActive: true
      }
    },
    
    // Ordenadas
    ordered: {
      order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    }
  },
  
  hooks: {
    beforeValidate: (category) => {
      // Trimmar strings
      if (category.name) {
        category.name = category.name.trim();
      }
      if (category.description) {
        category.description = category.description.trim();
      }
      
      // Garantir que cor sempre tenha #
      if (category.color && !category.color.startsWith('#')) {
        category.color = '#' + category.color;
      }
    },
    
    beforeCreate: async (category) => {
      // Verificar se já existe categoria com mesmo nome para o usuário
      const existingCategory = await Category.findOne({
        where: {
          name: category.name,
          userId: category.userId,
          type: category.type,
          isActive: true
        }
      });
      
      if (existingCategory) {
        throw new Error(`Já existe uma categoria "${category.name}" do tipo "${category.type}"`);
      }
      
      // Definir sortOrder se não definido
      if (category.sortOrder === undefined || category.sortOrder === null) {
        const maxOrder = await Category.max('sortOrder', {
          where: {
            userId: category.userId,
            type: category.type
          }
        });
        category.sortOrder = (maxOrder || 0) + 1;
      }
    },
    
    beforeUpdate: async (category) => {
      // Se nome mudou, verificar duplicatas
      if (category.changed('name')) {
        const existingCategory = await Category.findOne({
          where: {
            name: category.name,
            userId: category.userId,
            type: category.type,
            isActive: true,
            id: {
              [sequelize.Sequelize.Op.ne]: category.id
            }
          }
        });
        
        if (existingCategory) {
          throw new Error(`Já existe uma categoria "${category.name}" do tipo "${category.type}"`);
        }
      }
    }
  }
});

// Métodos de instância
Category.prototype.hasTransactions = async function() {
  const Transaction = require('./Transaction');
  const count = await Transaction.count({
    where: {
      categoryId: this.id
    }
  });
  return count > 0;
};

Category.prototype.getTransactionCount = async function() {
  const Transaction = require('./Transaction');
  return await Transaction.count({
    where: {
      categoryId: this.id
    }
  });
};

Category.prototype.getTotalAmount = async function(startDate = null, endDate = null) {
  const Transaction = require('./Transaction');
  const where = {
    categoryId: this.id
  };
  
  if (startDate && endDate) {
    where.date = {
      [sequelize.Sequelize.Op.between]: [startDate, endDate]
    };
  }
  
  const sum = await Transaction.sum('amount', { where });
  return sum || 0;
};

Category.prototype.softDelete = async function() {
  // Verificar se tem transações
  const hasTransactions = await this.hasTransactions();
  
  if (hasTransactions) {
    throw new Error('Não é possível deletar categoria que possui transações');
  }
  
  this.isActive = false;
  await this.save();
};

Category.prototype.getSubcategories = async function() {
  return await Category.findAll({
    where: {
      parentId: this.id,
      isActive: true
    },
    order: [['sortOrder', 'ASC'], ['name', 'ASC']]
  });
};

Category.prototype.moveTo = async function(newPosition) {
  // Implementar reordenação de categorias
  const categories = await Category.findAll({
    where: {
      userId: this.userId,
      type: this.type,
      isActive: true
    },
    order: [['sortOrder', 'ASC']]
  });
  
  // Reordenar
  for (let i = 0; i < categories.length; i++) {
    if (categories[i].id === this.id) continue;
    
    let newOrder = i + 1;
    if (i >= newPosition) {
      newOrder = i + 2;
    }
    
    await categories[i].update({ sortOrder: newOrder });
  }
  
  this.sortOrder = newPosition + 1;
  await this.save();
};

// Métodos estáticos
Category.getDefaultCategories = function(type) {
  const incomeCategories = [
    { name: 'Salário', icon: '💼', color: '#22C55E' },
    { name: 'Freelance', icon: '💻', color: '#10B981' },
    { name: 'Investimentos', icon: '📈', color: '#059669' },
    { name: 'Vendas', icon: '🛒', color: '#047857' },
    { name: 'Presente', icon: '🎁', color: '#065F46' },
    { name: 'Outros', icon: '💰', color: '#064E3B' }
  ];

  const expenseCategories = [
    { name: 'Alimentação', icon: '🍽️', color: '#EF4444' },
    { name: 'Transporte', icon: '🚗', color: '#DC2626' },
    { name: 'Moradia', icon: '🏠', color: '#B91C1C' },
    { name: 'Saúde', icon: '🏥', color: '#991B1B' },
    { name: 'Educação', icon: '📚', color: '#7F1D1D' },
    { name: 'Lazer', icon: '🎮', color: '#F97316' },
    { name: 'Compras', icon: '🛍️', color: '#EA580C' },
    { name: 'Contas', icon: '🧾', color: '#C2410C' },
    { name: 'Beleza', icon: '💄', color: '#9A3412' },
    { name: 'Pets', icon: '🐕', color: '#7C2D12' },
    { name: 'Viagem', icon: '✈️', color: '#8B5CF6' },
    { name: 'Outros', icon: '💸', color: '#6B21A8' }
  ];

  return type === 'income' ? incomeCategories : expenseCategories;
};

Category.createDefaultCategories = async function(userId) {
  const incomeCategories = this.getDefaultCategories('income');
  const expenseCategories = this.getDefaultCategories('expense');
  
  const allCategories = [
    ...incomeCategories.map((cat, index) => ({
      ...cat,
      type: 'income',
      userId,
      isDefault: true,
      sortOrder: index + 1
    })),
    ...expenseCategories.map((cat, index) => ({
      ...cat,
      type: 'expense',
      userId,
      isDefault: true,
      sortOrder: index + 1
    }))
  ];
  
  return await this.bulkCreate(allCategories);
};

Category.findByUserAndType = async function(userId, type = null) {
  const where = { userId, isActive: true };
  if (type) where.type = type;
  
  return await this.findAll({
    where,
    order: [['type', 'ASC'], ['sortOrder', 'ASC'], ['name', 'ASC']]
  });
};

module.exports = Category;
