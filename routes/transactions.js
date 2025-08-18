const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { Op } = require('sequelize');
const moment = require('moment');

const router = express.Router();

// Validações
const createTransactionValidation = [
  body('description')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Descrição deve ter entre 1 e 255 caracteres'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Valor deve ser maior que 0'),
  
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Tipo deve ser "income" ou "expense"'),
  
  body('categoryId')
    .isInt({ min: 1 })
    .withMessage('Categoria é obrigatória'),
  
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Data deve estar no formato ISO8601')
];

const updateTransactionValidation = [
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Descrição deve ter entre 1 e 255 caracteres'),
  
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Valor deve ser maior que 0'),
  
  body('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Tipo deve ser "income" ou "expense"'),
  
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID da categoria deve ser um número válido')
];

// GET /transactions - Listar transações com filtros
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número maior que 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
  query('type').optional().isIn(['income', 'expense']).withMessage('Tipo deve ser income ou expense'),
  query('categoryId').optional().isInt({ min: 1 }).withMessage('ID da categoria deve ser um número'),
  query('startDate').optional().isISO8601().withMessage('Data inicial inválida'),
  query('endDate').optional().isISO8601().withMessage('Data final inválida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros inválidos',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      type,
      categoryId,
      startDate,
      endDate,
      search
    } = req.query;

    const userId = req.user.id;
    const offset = (page - 1) * limit;

    // Construir filtros
    const where = { userId };
    
    if (type) {
      where.type = type;
    }
    
    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }
    
    if (startDate && endDate) {
      where.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      where.date = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      where.date = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    if (search) {
      where.description = {
        [Op.iLike]: `%${search}%`
      };
    }

    // Buscar transações
    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where,
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'color', 'icon']
      }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calcular totais
    const totals = await Transaction.findAll({
      where,
      attributes: [
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total'],
        'type'
      ],
      group: ['type'],
      raw: true
    });

    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0
    };

    totals.forEach(total => {
      if (total.type === 'income') {
        summary.totalIncome = parseFloat(total.total) || 0;
      } else if (total.type === 'expense') {
        summary.totalExpense = parseFloat(total.total) || 0;
      }
    });

    summary.balance = summary.totalIncome - summary.totalExpense;

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        },
        summary
      }
    });

  } catch (error) {
    console.error('Erro ao listar transações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /transactions/:id - Buscar transação por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const transaction = await Transaction.findOne({
      where: { id, userId },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'color', 'icon']
      }]
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transação não encontrada'
      });
    }

    res.json({
      success: true,
      data: { transaction }
    });

  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /transactions - Criar nova transação
router.post('/', createTransactionValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { description, amount, type, categoryId, date, notes } = req.body;
    const userId = req.user.id;

    // Verificar se a categoria existe e pertence ao usuário
    const category = await Category.findOne({
      where: { id: categoryId, userId }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }

    // Criar transação
    const transaction = await Transaction.create({
      description,
      amount: parseFloat(amount),
      type,
      categoryId,
      userId,
      date: date ? new Date(date) : new Date(),
      notes: notes || null
    });

    // Buscar transação com categoria incluída
    const createdTransaction = await Transaction.findByPk(transaction.id, {
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'color', 'icon']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Transação criada com sucesso',
      data: { transaction: createdTransaction }
    });

  } catch (error) {
    console.error('Erro ao criar transação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /transactions/:id - Atualizar transação
router.put('/:id', updateTransactionValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Buscar transação
    const transaction = await Transaction.findOne({
      where: { id, userId }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transação não encontrada'
      });
    }

    // Se está atualizando categoria, verificar se ela existe
    if (updates.categoryId) {
      const category = await Category.findOne({
        where: { id: updates.categoryId, userId }
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Categoria não encontrada'
        });
      }
    }

    // Atualizar transação
    await transaction.update(updates);

    // Buscar transação atualizada com categoria
    const updatedTransaction = await Transaction.findByPk(id, {
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'color', 'icon']
      }]
    });

    res.json({
      success: true,
      message: 'Transação atualizada com sucesso',
      data: { transaction: updatedTransaction }
    });

  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /transactions/:id - Deletar transação
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const transaction = await Transaction.findOne({
      where: { id, userId }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transação não encontrada'
      });
    }

    await transaction.destroy();

    res.json({
      success: true,
      message: 'Transação deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar transação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /transactions/summary/monthly - Resumo mensal
router.get('/summary/monthly', async (req, res) => {
  try {
    const userId = req.user.id;
    const { year = new Date().getFullYear() } = req.query;

    const monthlySummary = await Transaction.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [
            new Date(`${year}-01-01`),
            new Date(`${year}-12-31`)
          ]
        }
      },
      attributes: [
        [Transaction.sequelize.fn('EXTRACT', Transaction.sequelize.literal('MONTH FROM date')), 'month'],
        [Transaction.sequelize.fn('SUM', 
          Transaction.sequelize.literal('CASE WHEN type = \'income\' THEN amount ELSE 0 END')
        ), 'totalIncome'],
        [Transaction.sequelize.fn('SUM', 
          Transaction.sequelize.literal('CASE WHEN type = \'expense\' THEN amount ELSE 0 END')
        ), 'totalExpense']
      ],
      group: [Transaction.sequelize.fn('EXTRACT', Transaction.sequelize.literal('MONTH FROM date'))],
      order: [[Transaction.sequelize.fn('EXTRACT', Transaction.sequelize.literal('MONTH FROM date')), 'ASC']],
      raw: true
    });

    // Criar array com todos os meses
    const monthlyData = Array.from({ length: 12 }, (_, index) => {
      const monthData = monthlySummary.find(item => parseInt(item.month) === index + 1);
      return {
        month: index + 1,
        monthName: moment().month(index).format('MMMM'),
        totalIncome: parseFloat(monthData?.totalIncome) || 0,
        totalExpense: parseFloat(monthData?.totalExpense) || 0,
        balance: (parseFloat(monthData?.totalIncome) || 0) - (parseFloat(monthData?.totalExpense) || 0)
      };
    });

    res.json({
      success: true,
      data: { monthlyData }
    });

  } catch (error) {
    console.error('Erro ao gerar resumo mensal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /transactions/summary/category - Resumo por categoria
router.get('/summary/category', async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      startDate = moment().startOf('month').toISOString(),
      endDate = moment().endOf('month').toISOString(),
      type 
    } = req.query;

    const where = {
      userId,
      date: {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
    };

    if (type) {
      where.type = type;
    }

    const categorySum = await Transaction.findAll({
      where,
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'color', 'icon']
      }],
      attributes: [
        'categoryId',
        'type',
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total'],
        [Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('Transaction.id')), 'count']
      ],
      group: ['categoryId', 'type', 'category.id'],
      order: [[Transaction.sequelize.literal('total'), 'DESC']],
      raw: false
    });

    const formattedData = categorySum.map(item => ({
      categoryId: item.categoryId,
      category: item.category,
      type: item.type,
      total: parseFloat(item.get('total')),
      count: parseInt(item.get('count')),
      percentage: 0 // Será calculado no frontend
    }));

    res.json({
      success: true,
      data: { categoryData: formattedData }
    });

  } catch (error) {
    console.error('Erro ao gerar resumo por categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
