const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
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
        msg: 'Nome não pode estar vazio'
      },
      len: {
        args: [2, 100],
        msg: 'Nome deve ter entre 2 e 100 caracteres'
      }
    }
  },
  
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: {
      name: 'unique_email',
      msg: 'Este email já está em uso'
    },
    validate: {
      isEmail: {
        msg: 'Email deve ter um formato válido'
      },
      notEmpty: {
        msg: 'Email é obrigatório'
      }
    }
  },
  
  password: {
    type: DataTypes.STRING(255),
    allowNull: true, // null para usuários OAuth
    validate: {
      len: {
        args: [6, 255],
        msg: 'Senha deve ter pelo menos 6 caracteres'
      }
    }
  },
  
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: {
        args: /^[\d\s\-\+\(\)]*$/,
        msg: 'Telefone deve conter apenas números e caracteres válidos'
      }
    }
  },
  
  profilePicture: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'URL da foto de perfil deve ser válida'
      }
    }
  },
  
  // Campos de autenticação
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  emailVerificationToken: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  passwordResetToken: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // OAuth fields
  googleId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  
  facebookId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  
  // Controle de conta
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  role: {
    type: DataTypes.ENUM('user', 'admin', 'premium'),
    defaultValue: 'user'
  },
  
  // Preferências do usuário
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      currency: 'BRL',
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        budgetAlerts: true,
        goalReminders: true,
        weeklyReports: true
      },
      dashboardWidgets: [
        'balance',
        'monthlySpending',
        'categoryBreakdown',
        'goals',
        'recentTransactions'
      ]
    }
  },
  
  // Configurações de privacidade
  privacySettings: {
    type: DataTypes.JSONB,
    defaultValue: {
      shareAnalytics: false,
      allowDataExport: true,
      marketingEmails: false
    }
  },
  
  // Timestamps de atividade
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  lastActiveAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  
  // Soft delete
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Informações de conta premium (futuro)
  premiumUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  stripeCustomerId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  // Metadados
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
  
}, {
  tableName: 'users',
  timestamps: true,
  paranoid: false, // Não usar soft delete automático do Sequelize
  
  indexes: [
    {
      fields: ['email']
    },
    {
      fields: ['googleId']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['role']
    },
    {
      fields: ['deletedAt']
    },
    {
      fields: ['createdAt']
    }
  ],
  
  scopes: {
    // Scope para usuários ativos
    active: {
      where: {
        isActive: true,
        deletedAt: null
      }
    },
    
    // Scope para dados públicos
    public: {
      attributes: {
        exclude: [
          'password', 
          'refreshToken', 
          'emailVerificationToken', 
          'passwordResetToken',
          'stripeCustomerId'
        ]
      }
    },
    
    // Scope para usuários premium
    premium: {
      where: {
        premiumUntil: {
          [sequelize.Sequelize.Op.gt]: new Date()
        }
      }
    }
  },
  
  hooks: {
    // Antes de criar
    beforeCreate: async (user) => {
      user.email = user.email.toLowerCase().trim();
      user.name = user.name.trim();
      
      // Gerar token de verificação de email
      if (!user.emailVerified) {
        user.emailVerificationToken = require('crypto')
          .randomBytes(32)
          .toString('hex');
      }
      
      // Atualizar lastActiveAt
      user.lastActiveAt = new Date();
    },
    
    // Antes de atualizar
    beforeUpdate: async (user) => {
      if (user.changed('email')) {
        user.email = user.email.toLowerCase().trim();
        // Se email mudou, marcar como não verificado
        if (user.changed('email')) {
          user.emailVerified = false;
          user.emailVerificationToken = require('crypto')
            .randomBytes(32)
            .toString('hex');
        }
      }
      
      if (user.changed('name')) {
        user.name = user.name.trim();
      }
      
      // Atualizar lastActiveAt em qualquer mudança
      user.lastActiveAt = new Date();
    },
    
    // Depois de encontrar
    afterFind: (result) => {
      // Remove campos sensíveis se não especificado
      if (result && !result._includeAllFields) {
        if (Array.isArray(result)) {
          result.forEach(user => {
            if (user.dataValues) {
              delete user.dataValues.password;
              delete user.dataValues.refreshToken;
              delete user.dataValues.emailVerificationToken;
              delete user.dataValues.passwordResetToken;
            }
          });
        } else if (result.dataValues) {
          delete result.dataValues.password;
          delete result.dataValues.refreshToken;
          delete result.dataValues.emailVerificationToken;
          delete result.dataValues.passwordResetToken;
        }
      }
    }
  }
});

// Métodos de instância
User.prototype.toPublicJSON = function() {
  const values = { ...this.dataValues };
  delete values.password;
  delete values.refreshToken;
  delete values.emailVerificationToken;
  delete values.passwordResetToken;
  delete values.passwordResetExpires;
  delete values.stripeCustomerId;
  return values;
};

User.prototype.isPremium = function() {
  return this.role === 'premium' || 
         (this.premiumUntil && new Date(this.premiumUntil) > new Date());
};

User.prototype.isAdmin = function() {
  return this.role === 'admin';
};

User.prototype.canAccessFeature = function(feature) {
  const premiumFeatures = [
    'advanced_analytics',
    'export_data',
    'custom_categories',
    'multiple_budgets',
    'ai_insights_unlimited'
  ];
  
  if (premiumFeatures.includes(feature)) {
    return this.isPremium() || this.isAdmin();
  }
  
  return true; // Features básicas são acessíveis para todos
};

// Métodos estáticos
User.findByEmail = async function(email) {
  return await this.findOne({
    where: {
      email: email.toLowerCase().trim(),
      isActive: true,
      deletedAt: null
    }
  });
};

User.findActiveById = async function(id) {
  return await this.findOne({
    where: {
      id,
      isActive: true,
      deletedAt: null
    }
  });
};

User.prototype.updateLastLogin = async function() {
  this.lastLogin = new Date();
  this.lastActiveAt = new Date();
  await this.save();
};

User.prototype.softDelete = async function() {
  this.deletedAt = new Date();
  this.isActive = false;
  this.email = `deleted_${Date.now()}_${this.email}`;
  this.refreshToken = null;
  await this.save();
};

// Validações customizadas
User.addHook('beforeValidate', (user) => {
  // Validar se pelo menos uma forma de autenticação está presente
  if (!user.password && !user.googleId && !user.facebookId) {
    throw new Error('Usuário deve ter pelo menos um método de autenticação');
  }
});

module.exports = User;
