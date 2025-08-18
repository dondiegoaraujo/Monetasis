const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { Op } = require('sequelize');
const moment = require('moment');

const router = express.Router();

// Validações
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nome deve ter entre 2 e 50 caracteres'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  
  body('phone')
    .optional()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Telefone inválido')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Senha atual é obrigatória'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nova senha deve conter pelo menos: 1 minúscula, 1 maiúscula e 1 número'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Confirmação de senha não confere');
      }
      return true;
    })
];

// GET /users/profile - Buscar perfil do usuário
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: [
        'id', 'name', 'email', 'phone', 'profilePicture', 
        'emailVerified', 'createdAt', 'lastLogin', 'preferences'
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Estatísticas do usuário
    const stats = await Promise.all([
      Transaction.count({ where: { userId } }),
      Category.count({ where: { userId } }),
      Transaction.sum('amount', { 
        where: { userId, type: 'income' } 
      }),
      Transaction.sum('amount', { 
        where: { userId, type: 'expense' } 
      })
    ]);

    const userStats = {
      totalTransactions: stats[0] || 0,
      totalCategories: stats[1] || 0,
      totalIncome: stats[2] || 0,
      totalExpenses: stats[3] || 0,
      balance: (stats[2] || 0) - (stats[3] || 0),
      memberSince: moment(user.createdAt).fromNow()
    };

    res.json({
      success: true,
      data: {
        user,
        stats: userStats
      }
    });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /users/profile - Atualizar perfil do usuário
router.put('/profile', updateProfileValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { name, email, phone, profilePicture } = req.body;

    // Buscar usuário
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar se email já está em uso (se está sendo alterado)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        where: { 
          email,
          id: { [Op.ne]: userId }
        }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Este email já está em uso'
        });
      }
    }

    // Atualizar usuário
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      updateData.email = email;
      updateData.emailVerified = email === user.email ? user.emailVerified : false;
    }
    if (phone !== undefined) updateData.phone = phone;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    await user.update(updateData);

    // Retornar usuário atualizado
    const updatedUser = await User.findByPk(userId, {
      attributes: [
        'id', 'name', 'email', 'phone', 'profilePicture', 
        'emailVerified', 'createdAt', 'lastLogin'
      ]
    });

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /users/password - Alterar senha
router.put('/password', changePasswordValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Buscar usuário
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }

    // Hash da nova senha
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Atualizar senha
    await user.update({
      password: hashedNewPassword,
      // Invalidar todos os refresh tokens existentes
      refreshToken: null
    });

    res.json({
      success: true,
      message: 'Senha alterada com sucesso. Faça login novamente.'
    });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /users/dashboard-summary - Resumo para dashboard do usuário
router.get('/dashboard-summary', async (req, res) => {
  try {
    const userId = req.user.id;

    // Transações do mês atual
    const currentMonth = moment().startOf('month');
    const nextMonth = moment().add(1, 'month').startOf('month');

    const monthlyTransactions = await Transaction.findAll({
      where: {
        userId,
        date: {
          [Op.gte]: currentMonth.toDate(),
          [Op.lt]: nextMonth.toDate()
        }
      },
      attributes: ['type', 'amount'],
      raw: true
    });

    // Calcular totais do mês
    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const monthlyBalance = monthlyIncome - monthlyExpenses;

    // Comparação com mês anterior
    const lastMonth = moment().subtract(1, 'month').startOf('month');
    const currentMonthStart = moment().startOf('month');

    const lastMonthTransactions = await Transaction.findAll({
      where: {
        userId,
        date: {
          [Op.gte]: lastMonth.toDate(),
          [Op.lt]: currentMonthStart.toDate()
        }
      },
      attributes: ['type', 'amount'],
      raw: true
    });

    const lastMonthExpenses = lastMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Calcular mudança percentual
    const expenseChange = lastMonthExpenses > 0 
      ? ((monthlyExpenses - lastMonthExpenses) / lastMonthExpenses) * 100
      : monthlyExpenses > 0 ? 100 : 0;

    // Última transação
    const lastTransaction = await Transaction.findOne({
      where: { userId },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['name', 'icon', 'color']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Categorias mais usadas este mês
    const topCategories = await Transaction.findAll({
      where: {
        userId,
        date: {
          [Op.gte]: currentMonth.toDate(),
          [Op.lt]: nextMonth.toDate()
        },
        type: 'expense'
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['name', 'icon', 'color']
      }],
      attributes: [
        'categoryId',
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total'],
        [Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('Transaction.id')), 'count']
      ],
      group: ['categoryId', 'category.id'],
      order: [[Transaction.sequelize.literal('total'), 'DESC']],
      limit: 3,
      raw: false
    });

    const formattedTopCategories = topCategories.map(cat => ({
      category: cat.category,
      total: parseFloat(cat.get('total')),
      count: parseInt(cat.get('count'))
    }));

    res.json({
      success: true,
      data: {
        currentMonth: {
          income: monthlyIncome,
          expenses: monthlyExpenses,
          balance: monthlyBalance,
          transactionCount: monthlyTransactions.length
        },
        comparison: {
          expenseChange: expenseChange.toFixed(1),
          trend: expenseChange > 0 ? 'up' : expenseChange < 0 ? 'down' : 'stable'
        },
        lastTransaction,
        topCategories: formattedTopCategories,
        period: {
          month: currentMonth.format('MMMM YYYY'),
          daysInMonth: currentMonth.daysInMonth(),
          daysPassed: moment().date(),
          daysRemaining: currentMonth.daysInMonth() - moment().date()
        }
      }
    });

  } catch (error) {
    console.error('Erro ao gerar resumo do dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /users/preferences - Atualizar preferências do usuário
router.put('/preferences', async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      currency, 
      language, 
      timezone, 
      notifications, 
      theme,
      dashboardWidgets 
    } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Preparar objeto de preferências
    const currentPreferences = user.preferences || {};
    const newPreferences = {
      ...currentPreferences,
      ...(currency && { currency }),
      ...(language && { language }),
      ...(timezone && { timezone }),
      ...(notifications && { notifications }),
      ...(theme && { theme }),
      ...(dashboardWidgets && { dashboardWidgets }),
      updatedAt: new Date().toISOString()
    };

    await user.update({
      preferences: newPreferences
    });

    res.json({
      success: true,
      message: 'Preferências atualizadas com sucesso',
      data: { preferences: newPreferences }
    });

  } catch (error) {
    console.error('Erro ao atualizar preferências:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /users/account - Deletar conta (soft delete)
router.delete('/account', async (req, res) => {
  try {
    const userId = req.user.id;
    const { confirmPassword } = req.body;

    if (!confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha de confirmação é obrigatória'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(confirmPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Senha incorreta'
      });
    }

    // Soft delete - marcar como deletado mas manter dados
    await user.update({
      deletedAt: new Date(),
      email: `deleted_${Date.now()}_${user.email}`,
      refreshToken: null
    });

    res.json({
      success: true,
      message: 'Conta deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar conta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /users/export - Exportar dados do usuário
router.get('/export', async (req, res) => {
  try {
    const userId = req.user.id;
    const { format = 'json' } = req.query;

    // Buscar todos os dados do usuário
    const [user, transactions, categories] = await Promise.all([
      User.findByPk(userId, {
        attributes: ['id', 'name', 'email', 'createdAt', 'preferences']
      }),
      Transaction.findAll({
        where: { userId },
        include: [{
          model: Category,
          as: 'category',
          attributes: ['name', 'type', 'color', 'icon']
        }],
        order: [['date', 'DESC']]
      }),
      Category.findAll({
        where: { userId },
        order: [['name', 'ASC']]
      })
    ]);

    const exportData = {
      user,
      transactions,
      categories,
      exportedAt: new Date().toISOString(),
      totalTransactions: transactions.length,
      totalCategories: categories.length
    };

    if (format === 'csv') {
      // Converter para CSV (simplificado)
      const csv = transactions.map(t => 
        `${t.date},${t.description},${t.type},${t.amount},${t.category.name}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="monetasis_export.csv"');
      res.send(`Date,Description,Type,Amount,Category\n${csv}`);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="monetasis_export.json"');
      res.json(exportData);
    }

  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
