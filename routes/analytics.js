const express = require('express');
const { Op } = require('sequelize');
const moment = require('moment');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Goal = require('../models/Goal');
const Budget = require('../models/Budget');

const router = express.Router();

// GET /analytics/dashboard - Dashboard completo
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month' } = req.query;

    // Definir período baseado no parâmetro
    let startDate, endDate;
    switch (period) {
      case 'week':
        startDate = moment().startOf('week');
        endDate = moment().endOf('week');
        break;
      case 'month':
        startDate = moment().startOf('month');
        endDate = moment().endOf('month');
        break;
      case 'year':
        startDate = moment().startOf('year');
        endDate = moment().endOf('year');
        break;
      default:
        startDate = moment().startOf('month');
        endDate = moment().endOf('month');
    }

    // 1. Resumo financeiro geral
    const financialSummary = await Transaction.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [startDate.toDate(), endDate.toDate()]
        }
      },
      attributes: [
        'type',
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total'],
        [Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('id')), 'count']
      ],
      group: ['type'],
      raw: true
    });

    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      transactionCount: 0
    };

    financialSummary.forEach(item => {
      if (item.type === 'income') {
        summary.totalIncome = parseFloat(item.total) || 0;
      } else {
        summary.totalExpense = parseFloat(item.total) || 0;
      }
      summary.transactionCount += parseInt(item.count) || 0;
    });

    summary.balance = summary.totalIncome - summary.totalExpense;

    // 2. Transações por categoria
    const categoryStats = await Transaction.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [startDate.toDate(), endDate.toDate()]
        }
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'color', 'icon']
      }],
      attributes: [
        'type',
        'categoryId',
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total'],
        [Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('Transaction.id')), 'count']
      ],
      group: ['type', 'categoryId', 'category.id'],
      order: [[Transaction.sequelize.literal('total'), 'DESC']],
      raw: false
    });

    const categoryData = categoryStats.map(stat => ({
      categoryId: stat.categoryId,
      category: stat.category,
      type: stat.type,
      total: parseFloat(stat.get('total')),
      count: parseInt(stat.get('count')),
      percentage: stat.type === 'expense' 
        ? ((parseFloat(stat.get('total')) / summary.totalExpense) * 100).toFixed(1)
        : ((parseFloat(stat.get('total')) / summary.totalIncome) * 100).toFixed(1)
    }));

    // 3. Evolução mensal (últimos 12 meses)
    const monthlyEvolution = await Transaction.findAll({
      where: {
        userId,
        date: {
          [Op.gte]: moment().subtract(11, 'months').startOf('month').toDate()
        }
      },
      attributes: [
        [Transaction.sequelize.fn('DATE_TRUNC', Transaction.sequelize.literal("'month'"), Transaction.sequelize.col('date')), 'month'],
        [Transaction.sequelize.fn('SUM', 
          Transaction.sequelize.literal('CASE WHEN type = \'income\' THEN amount ELSE 0 END')
        ), 'income'],
        [Transaction.sequelize.fn('SUM', 
          Transaction.sequelize.literal('CASE WHEN type = \'expense\' THEN amount ELSE 0 END')
        ), 'expense']
      ],
      group: [Transaction.sequelize.fn('DATE_TRUNC', Transaction.sequelize.literal("'month'"), Transaction.sequelize.col('date'))],
      order: [[Transaction.sequelize.fn('DATE_TRUNC', Transaction.sequelize.literal("'month'"), Transaction.sequelize.col('date')), 'ASC']],
      raw: true
    });

    const evolutionData = monthlyEvolution.map(item => ({
      month: moment(item.month).format('YYYY-MM'),
      monthName: moment(item.month).format('MMM YYYY'),
      income: parseFloat(item.income) || 0,
      expense: parseFloat(item.expense) || 0,
      balance: (parseFloat(item.income) || 0) - (parseFloat(item.expense) || 0)
    }));

    // 4. Comparação com período anterior
    const previousStartDate = moment(startDate).subtract(1, period === 'week' ? 'week' : period === 'month' ? 'month' : 'year');
    const previousEndDate = moment(endDate).subtract(1, period === 'week' ? 'week' : period === 'month' ? 'month' : 'year');

    const previousSummary = await Transaction.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [previousStartDate.toDate(), previousEndDate.toDate()]
        }
      },
      attributes: [
        'type',
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total']
      ],
      group: ['type'],
      raw: true
    });

    const comparison = {
      income: { current: summary.totalIncome, previous: 0, change: 0 },
      expense: { current: summary.totalExpense, previous: 0, change: 0 },
      balance: { current: summary.balance, previous: 0, change: 0 }
    };

    previousSummary.forEach(item => {
      const total = parseFloat(item.total) || 0;
      if (item.type === 'income') {
        comparison.income.previous = total;
      } else {
        comparison.expense.previous = total;
      }
    });

    comparison.balance.previous = comparison.income.previous - comparison.expense.previous;

    // Calcular porcentagens de mudança
    ['income', 'expense', 'balance'].forEach(key => {
      const current = comparison[key].current;
      const previous = comparison[key].previous;
      
      if (previous > 0) {
        comparison[key].change = ((current - previous) / previous * 100).toFixed(1);
      } else if (current > 0) {
        comparison[key].change = '100.0';
      } else {
        comparison[key].change = '0.0';
      }
    });

    // 5. Top 5 maiores despesas do período
    const topExpenses = await Transaction.findAll({
      where: {
        userId,
        type: 'expense',
        date: {
          [Op.between]: [startDate.toDate(), endDate.toDate()]
        }
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['name', 'color', 'icon']
      }],
      order: [['amount', 'DESC']],
      limit: 5
    });

    // 6. Metas do usuário (se existir o modelo)
    let goalsData = [];
    try {
      const goals = await Goal.findAll({
        where: { userId },
        order: [['targetDate', 'ASC']]
      });
      
      goalsData = goals.map(goal => ({
        id: goal.id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        progress: ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1),
        targetDate: goal.targetDate,
        daysRemaining: moment(goal.targetDate).diff(moment(), 'days')
      }));
    } catch (error) {
      console.log('Modelo Goal não encontrado, continuando sem metas...');
    }

    // 7. Status dos orçamentos (se existir o modelo)
    let budgetStatus = [];
    try {
      const budgets = await Budget.findAll({
        where: { userId },
        include: [{
          model: Category,
          as: 'category',
          attributes: ['name', 'color', 'icon']
        }]
      });

      // Para cada orçamento, calcular quanto foi gasto neste período
      for (const budget of budgets) {
        const spent = await Transaction.sum('amount', {
          where: {
            userId,
            categoryId: budget.categoryId,
            type: 'expense',
            date: {
              [Op.between]: [startDate.toDate(), endDate.toDate()]
            }
          }
        }) || 0;

        budgetStatus.push({
          id: budget.id,
          category: budget.category,
          budgetAmount: budget.amount,
          spent: spent,
          remaining: budget.amount - spent,
          percentage: ((spent / budget.amount) * 100).toFixed(1),
          status: spent > budget.amount ? 'exceeded' : 
                  spent > budget.amount * 0.8 ? 'warning' : 'good'
        });
      }
    } catch (error) {
      console.log('Modelo Budget não encontrado, continuando sem orçamentos...');
    }

    res.json({
      success: true,
      data: {
        period: {
          type: period,
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
          label: `${startDate.format('DD/MM')} - ${endDate.format('DD/MM/YYYY')}`
        },
        summary,
        comparison,
        categoryData,
        evolutionData,
        topExpenses,
        goals: goalsData,
        budgets: budgetStatus
      }
    });

  } catch (error) {
    console.error('Erro ao gerar dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /analytics/cash-flow - Fluxo de caixa
router.get('/cash-flow', async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      startDate = moment().subtract(30, 'days').format('YYYY-MM-DD'),
      endDate = moment().format('YYYY-MM-DD'),
      groupBy = 'day'
    } = req.query;

    let dateFormat;
    switch (groupBy) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-%u';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const cashFlow = await Transaction.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      },
      attributes: [
        [Transaction.sequelize.fn('DATE_FORMAT', Transaction.sequelize.col('date'), dateFormat), 'period'],
        [Transaction.sequelize.fn('SUM', 
          Transaction.sequelize.literal('CASE WHEN type = \'income\' THEN amount ELSE 0 END')
        ), 'income'],
        [Transaction.sequelize.fn('SUM', 
          Transaction.sequelize.literal('CASE WHEN type = \'expense\' THEN amount ELSE 0 END')
        ), 'expense']
      ],
      group: [Transaction.sequelize.fn('DATE_FORMAT', Transaction.sequelize.col('date'), dateFormat)],
      order: [[Transaction.sequelize.fn('DATE_FORMAT', Transaction.sequelize.col('date'), dateFormat), 'ASC']],
      raw: true
    });

    const flowData = cashFlow.map(item => ({
      period: item.period,
      income: parseFloat(item.income) || 0,
      expense: parseFloat(item.expense) || 0,
      balance: (parseFloat(item.income) || 0) - (parseFloat(item.expense) || 0)
    }));

    res.json({
      success: true,
      data: {
        cashFlow: flowData,
        summary: {
          totalIncome: flowData.reduce((sum, item) => sum + item.income, 0),
          totalExpense: flowData.reduce((sum, item) => sum + item.expense, 0),
          netFlow: flowData.reduce((sum, item) => sum + item.balance, 0)
        }
      }
    });

  } catch (error) {
    console.error('Erro ao gerar fluxo de caixa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /analytics/trends - Tendências e padrões
router.get('/trends', async (req, res) => {
  try {
    const userId = req.user.id;

    // Análise de padrões por dia da semana
    const weeklyPattern = await Transaction.findAll({
      where: {
        userId,
        date: {
          [Op.gte]: moment().subtract(3, 'months').toDate()
        }
      },
      attributes: [
        [Transaction.sequelize.fn('EXTRACT', Transaction.sequelize.literal('DOW FROM date')), 'dayOfWeek'],
        'type',
        [Transaction.sequelize.fn('AVG', Transaction.sequelize.col('amount')), 'avgAmount'],
        [Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('id')), 'count']
      ],
      group: [
        Transaction.sequelize.fn('EXTRACT', Transaction.sequelize.literal('DOW FROM date')),
        'type'
      ],
      order: [
        [Transaction.sequelize.fn('EXTRACT', Transaction.sequelize.literal('DOW FROM date')), 'ASC']
      ],
      raw: true
    });

    const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const weeklyData = weekDays.map((day, index) => {
      const dayData = weeklyPattern.filter(p => parseInt(p.dayOfWeek) === index);
      const income = dayData.find(d => d.type === 'income') || { avgAmount: 0, count: 0 };
      const expense = dayData.find(d => d.type === 'expense') || { avgAmount: 0, count: 0 };

      return {
        day,
        dayIndex: index,
        avgIncome: parseFloat(income.avgAmount) || 0,
        avgExpense: parseFloat(expense.avgAmount) || 0,
        incomeCount: parseInt(income.count) || 0,
        expenseCount: parseInt(expense.count) || 0
      };
    });

    // Categorias mais utilizadas nos últimos 30 dias
    const topCategories = await Transaction.findAll({
      where: {
        userId,
        date: {
          [Op.gte]: moment().subtract(30, 'days').toDate()
        }
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['name', 'color', 'icon']
      }],
      attributes: [
        'categoryId',
        'type',
        [Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('Transaction.id')), 'usage'],
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total']
      ],
      group: ['categoryId', 'type', 'category.id'],
      order: [[Transaction.sequelize.literal('usage'), 'DESC']],
      limit: 10,
      raw: false
    });

    const categoryTrends = topCategories.map(cat => ({
      category: cat.category,
      type: cat.type,
      usage: parseInt(cat.get('usage')),
      total: parseFloat(cat.get('total'))
    }));

    res.json({
      success: true,
      data: {
        weeklyPattern: weeklyData,
        topCategories: categoryTrends
      }
    });

  } catch (error) {
    console.error('Erro ao analisar tendências:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
