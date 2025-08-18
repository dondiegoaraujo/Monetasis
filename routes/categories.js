const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');

const router = express.Router();

// Validações
const createCategoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Nome deve ter entre 1 e 50 caracteres'),
  
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Tipo deve ser "income" ou "expense"'),
  
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Cor deve ser um código hexadecimal válido'),
  
  body('icon')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Ícone deve ter entre 1 e 50 caracteres')
];

// GET /categories - Listar todas as categorias do usuário
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    const where = { userId };
    if (type) {
      where.type = type;
    }

    const categories = await Category.findAll({
      where,
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: { categories }
    });

  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /categories/:id - Buscar categoria por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const category = await Category.findOne({
      where: { id, userId }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }

    res.json({
      success: true,
      data: { category }
    });

  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /categories - Criar nova categoria
router.post('/', createCategoryValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { name, type, color, icon } = req.body;
    const userId = req.user.id;

    // Verificar se já existe categoria com mesmo nome para o usuário
    const existingCategory = await Category.findOne({
      where: { name, userId, type }
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Já existe uma categoria com este nome para este tipo'
      });
    }

    // Criar categoria
    const category = await Category.create({
      name,
      type,
      color: color || (type === 'income' ? '#22C55E' : '#EF4444'),
      icon: icon || (type === 'income' ? '💰' : '💸'),
      userId
    });

    res.status(201).json({
      success: true,
      message: 'Categoria criada com sucesso',
      data: { category }
    });

  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /categories/:id - Atualizar categoria
router.put('/:id', createCategoryValidation, async (req, res) => {
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
    const { name, type, color, icon } = req.body;

    // Buscar categoria
    const category = await Category.findOne({
      where: { id, userId }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }

    // Verificar se já existe categoria com mesmo nome (exceto a atual)
    const existingCategory = await Category.findOne({
      where: { 
        name, 
        userId, 
        type,
        id: { [require('sequelize').Op.ne]: id }
      }
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Já existe uma categoria com este nome para este tipo'
      });
    }

    // Atualizar categoria
    await category.update({
      name,
      type,
      color,
      icon
    });

    res.json({
      success: true,
      message: 'Categoria atualizada com sucesso',
      data: { category }
    });

  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /categories/:id - Deletar categoria
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const category = await Category.findOne({
      where: { id, userId }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }

    // Verificar se existem transações usando esta categoria
    const Transaction = require('../models/Transaction');
    const transactionCount = await Transaction.count({
      where: { categoryId: id }
    });

    if (transactionCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Não é possível deletar esta categoria pois ela está sendo usada em ${transactionCount} transação(ões)`
      });
    }

    await category.destroy();

    res.json({
      success: true,
      message: 'Categoria deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /categories/default - Criar categorias padrão
router.post('/default', async (req, res) => {
  try {
    const userId = req.user.id;

    // Verificar se usuário já tem categorias
    const existingCategories = await Category.count({ where: { userId } });
    
    if (existingCategories > 0) {
      return res.status(400).json({
        success: false,
        message: 'Usuário já possui categorias criadas'
      });
    }

    // Categorias padrão de receita
    const incomeCategories = [
      { name: 'Salário', icon: '💼', color: '#22C55E' },
      { name: 'Freelance', icon: '💻', color: '#10B981' },
      { name: 'Investimentos', icon: '📈', color: '#059669' },
      { name: 'Vendas', icon: '🛒', color: '#047857' },
      { name: 'Outros', icon: '💰', color: '#065F46' }
    ];

    // Categorias padrão de despesa
    const expenseCategories = [
      { name: 'Alimentação', icon: '🍽️', color: '#EF4444' },
      { name: 'Transporte', icon: '🚗', color: '#DC2626' },
      { name: 'Moradia', icon: '🏠', color: '#B91C1C' },
      { name: 'Saúde', icon: '🏥', color: '#991B1B' },
      { name: 'Educação', icon: '📚', color: '#7F1D1D' },
      { name: 'Lazer', icon: '🎮', color: '#F97316' },
      { name: 'Compras', icon: '🛍️', color: '#EA580C' },
      { name: 'Contas', icon: '🧾', color: '#C2410C' },
      { name: 'Outros', icon: '💸', color: '#9A3412' }
    ];

    // Criar categorias de receita
    const createdIncomeCategories = await Category.bulkCreate(
      incomeCategories.map(cat => ({
        ...cat,
        type: 'income',
        userId
      }))
    );

    // Criar categorias de despesa
    const createdExpenseCategories = await Category.bulkCreate(
      expenseCategories.map(cat => ({
        ...cat,
        type: 'expense',
        userId
      }))
    );

    const allCategories = [...createdIncomeCategories, ...createdExpenseCategories];

    res.status(201).json({
      success: true,
      message: `${allCategories.length} categorias padrão criadas com sucesso`,
      data: { 
        categories: allCategories,
        summary: {
          income: createdIncomeCategories.length,
          expense: createdExpenseCategories.length,
          total: allCategories.length
        }
      }
    });

  } catch (error) {
    console.error('Erro ao criar categorias padrão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
