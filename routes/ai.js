const express = require('express');
const { Op } = require('sequelize');
const moment = require('moment');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

const router = express.Router();

// Função para gerar insights baseados em dados reais
const generateInsights = async (userId) => {
  const insights = [];

  try {
    // Análise dos últimos 3 meses
    const threeMonthsAgo = moment().subtract(3, 'months').startOf('month');
    const currentMonth = moment().startOf('month');
    
    // Buscar transações dos últimos 3 meses
    const transactions = await Transaction.findAll({
      where: {
        userId,
        date: {
          [Op.gte]: threeMonthsAgo.toDate()
        }
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['name', 'type']
      }],
      order: [['date', 'DESC']]
    });

    if (transactions.length === 0) {
      return [{
        type: 'welcome',
        title: '🎉 Bem-vindo ao MonetAsis!',
        message: 'Comece adicionando suas primeiras transações para receber insights personalizados sobre suas finanças.',
        priority: 'high',
        actionable: true,
        action: 'Adicionar primeira transação'
      }];
    }

    // 1. Análise de gastos por categoria
    const expensesByCategory = {};
    const incomesByCategory = {};
    
    transactions.forEach(t => {
      if (t.type === 'expense') {
        if (!expensesByCategory[t.category.name]) {
          expensesByCategory[t.category.name] = { total: 0, count: 0, recent: [] };
        }
        expensesByCategory[t.category.name].total += parseFloat(t.amount);
        expensesByCategory[t.category.name].count++;
        if (moment(t.date).isAfter(moment().subtract(7, 'days'))) {
          expensesByCategory[t.category.name].recent.push(t);
        }
      } else {
        if (!incomesByCategory[t.category.name]) {
          incomesByCategory[t.category.name] = { total: 0, count: 0 };
        }
        incomesByCategory[t.category.name].total += parseFloat(t.amount);
        incomesByCategory[t.category.name].count++;
      }
    });

    // Encontrar categoria com maior gasto
    const topExpenseCategory = Object.entries(expensesByCategory)
      .sort(([,a], [,b]) => b.total - a.total)[0];

    if (topExpenseCategory) {
      const [categoryName, data] = topExpenseCategory;
      const monthlyAverage = data.total / 3;
      
      insights.push({
        type: 'spending_pattern',
        title: `💸 Maior gasto: ${categoryName}`,
        message: `Você gastou R$ ${data.total.toFixed(2)} em ${categoryName} nos últimos 3 meses (média mensal: R$ ${monthlyAverage.toFixed(2)}).`,
        priority: 'medium',
        category: categoryName,
        data: { total: data.total, average: monthlyAverage, transactions: data.count }
      });
    }

    // 2. Análise de tendência de gastos
    const currentMonthExpenses = transactions
      .filter(t => t.type === 'expense' && moment(t.date).isAfter(currentMonth))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const lastMonthExpenses = transactions
      .filter(t => t.type === 'expense' && 
        moment(t.date).isBetween(
          moment().subtract(1, 'month').startOf('month'),
          moment().subtract(1, 'month').endOf('month')
        ))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    if (lastMonthExpenses > 0) {
      const changePercent = ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
      
      if (Math.abs(changePercent) > 15) {
        const trend = changePercent > 0 ? 'aumentaram' : 'diminuíram';
        const emoji = changePercent > 0 ? '📈' : '📉';
        const priority = changePercent > 20 ? 'high' : 'medium';
        
        insights.push({
          type: 'trend_analysis',
          title: `${emoji} Seus gastos ${trend}`,
          message: `Seus gastos ${trend} ${Math.abs(changePercent).toFixed(1)}% comparado ao mês passado (R$ ${Math.abs(currentMonthExpenses - lastMonthExpenses).toFixed(2)}).`,
          priority,
          trend: changePercent > 0 ? 'up' : 'down',
          percentage: Math.abs(changePercent).toFixed(1)
        });
      }
    }

    // 3. Análise de receita vs despesa
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    if (totalIncome > 0) {
      let savingsInsight;
      if (savingsRate >= 20) {
        savingsInsight = {
          type: 'savings_good',
          title: '🎯 Excelente taxa de economia!',
          message: `Você está economizando ${savingsRate.toFixed(1)}% da sua renda. Continue assim!`,
          priority: 'low'
        };
      } else if (savingsRate >= 10) {
        savingsInsight = {
          type: 'savings_moderate',
          title: '💰 Boa economia, mas pode melhorar',
          message: `Sua taxa de economia é ${savingsRate.toFixed(1)}%. Tente chegar aos 20% recomendados.`,
          priority: 'medium'
        };
      } else if (savingsRate >= 0) {
        savingsInsight = {
          type: 'savings_low',
          title: '⚠️ Taxa de economia baixa',
          message: `Você está economizando apenas ${savingsRate.toFixed(1)}% da sua renda. Considere revisar seus gastos.`,
          priority: 'high',
          actionable: true,
          action: 'Ver sugestões de economia'
        };
      } else {
        savingsInsight = {
          type: 'spending_over_income',
          title: '🚨 Gastos acima da renda!',
          message: `Você está gastando R$ ${Math.abs(totalIncome - totalExpenses).toFixed(2)} a mais do que ganha. Ação urgente necessária!`,
          priority: 'critical',
          actionable: true,
          action: 'Criar plano de redução de gastos'
        };
      }
      
      insights.push(savingsInsight);
    }

    // 4. Análise de frequência de transações
    const recentTransactions = transactions.filter(t => 
      moment(t.date).isAfter(moment().subtract(7, 'days'))
    );

    if (recentTransactions.length === 0) {
      insights.push({
        type: 'activity_low',
        title: '📊 Sem atividade recente',
        message: 'Você não registrou transações na última semana. Lembre-se de manter seus dados atualizados!',
        priority: 'medium',
        actionable: true,
        action: 'Adicionar transações'
      });
    } else if (recentTransactions.length > 20) {
      insights.push({
        type: 'activity_high',
        title: '🔥 Muita atividade financeira!',
        message: `Você registrou ${recentTransactions.length} transações esta semana. Está controlando bem suas finanças!`,
        priority: 'low'
      });
    }

    // 5. Insights sobre dias da semana
    const transactionsByWeekday = {};
    transactions.forEach(t => {
      const weekday = moment(t.date).format('dddd');
      if (!transactionsByWeekday[weekday]) {
        transactionsByWeekday[weekday] = { count: 0, amount: 0 };
      }
      transactionsByWeekday[weekday].count++;
      if (t.type === 'expense') {
        transactionsByWeekday[weekday].amount += parseFloat(t.amount);
      }
    });

    const topSpendingDay = Object.entries(transactionsByWeekday)
      .sort(([,a], [,b]) => b.amount - a.amount)[0];

    if (topSpendingDay && topSpendingDay[1].amount > 0) {
      insights.push({
        type: 'weekday_pattern',
        title: `📅 ${topSpendingDay[0]} é seu dia de maior gasto`,
        message: `Você tende a gastar mais às ${topSpendingDay[0]}s (R$ ${topSpendingDay[1].amount.toFixed(2)} em média).`,
        priority: 'low',
        data: { day: topSpendingDay[0], amount: topSpendingDay[1].amount }
      });
    }

    // 6. Sugestões baseadas em padrões
    if (expensesByCategory['Alimentação'] && expensesByCategory['Alimentação'].total > 1000) {
      insights.push({
        type: 'suggestion',
        title: '🍽️ Dica: Economia na alimentação',
        message: 'Seus gastos com alimentação estão altos. Considere cozinhar mais em casa para economizar.',
        priority: 'medium',
        actionable: true,
        action: 'Ver receitas econômicas'
      });
    }

    // Ordenar insights por prioridade
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    insights.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    return insights.slice(0, 8); // Retornar no máximo 8 insights

  } catch (error) {
    console.error('Erro ao gerar insights:', error);
    return [{
      type: 'error',
      title: '⚠️ Erro na análise',
      message: 'Não foi possível analisar seus dados no momento. Tente novamente mais tarde.',
      priority: 'medium'
    }];
  }
};

// GET /ai/insights - Insights financeiros personalizados
router.get('/insights', async (req, res) => {
  try {
    const userId = req.user.id;
    const insights = await generateInsights(userId);

    res.json({
      success: true,
      data: {
        insights,
        generatedAt: new Date().toISOString(),
        totalInsights: insights.length
      }
    });

  } catch (error) {
    console.error('Erro ao gerar insights:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /ai/predictions - Previsões financeiras
router.get('/predictions', async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar dados dos últimos 6 meses para previsão
    const sixMonthsAgo = moment().subtract(6, 'months').startOf('month');
    
    const monthlyData = await Transaction.findAll({
      where: {
        userId,
        date: {
          [Op.gte]: sixMonthsAgo.toDate()
        }
      },
      attributes: [
        [Transaction.sequelize.fn('DATE_TRUNC', Transaction.sequelize.literal("'month'"), Transaction.sequelize.col('date')), 'month'],
        'type',
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total']
      ],
      group: [
        Transaction.sequelize.fn('DATE_TRUNC', Transaction.sequelize.literal("'month'"), Transaction.sequelize.col('date')),
        'type'
      ],
      order: [
        [Transaction.sequelize.fn('DATE_TRUNC', Transaction.sequelize.literal("'month'"), Transaction.sequelize.col('date')), 'ASC']
      ],
      raw: true
    });

    // Calcular médias mensais
    const incomeData = monthlyData.filter(d => d.type === 'income');
    const expenseData = monthlyData.filter(d => d.type === 'expense');

    const avgMonthlyIncome = incomeData.length > 0 
      ? incomeData.reduce((sum, d) => sum + parseFloat(d.total), 0) / incomeData.length
      : 0;

    const avgMonthlyExpense = expenseData.length > 0
      ? expenseData.reduce((sum, d) => sum + parseFloat(d.total), 0) / expenseData.length
      : 0;

    // Previsões para os próximos 3 meses
    const predictions = [];
    for (let i = 1; i <= 3; i++) {
      const futureMonth = moment().add(i, 'months');
      
      // Ajuste sazonal simples (gastos tendem a ser maiores em dezembro)
      let seasonalMultiplier = 1;
      if (futureMonth.month() === 11) { // Dezembro
        seasonalMultiplier = 1.2;
      } else if (futureMonth.month() === 0) { // Janeiro
        seasonalMultiplier = 0.9;
      }

      predictions.push({
        month: futureMonth.format('YYYY-MM'),
        monthName: futureMonth.format('MMMM YYYY'),
        predictedIncome: Math.round(avgMonthlyIncome * 100) / 100,
        predictedExpense: Math.round(avgMonthlyExpense * seasonalMultiplier * 100) / 100,
        predictedBalance: Math.round((avgMonthlyIncome - (avgMonthlyExpense * seasonalMultiplier)) * 100) / 100,
        confidence: monthlyData.length >= 3 ? 'medium' : 'low'
      });
    }

    res.json({
      success: true,
      data: {
        predictions,
        basedOnMonths: monthlyData.length / 2, // Dividido por 2 porque temos income e expense
        avgMonthlyIncome,
        avgMonthlyExpense,
        note: 'Previsões baseadas em dados históricos e padrões sazonais simples'
      }
    });

  } catch (error) {
    console.error('Erro ao gerar previsões:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /ai/recommendations - Recomendações personalizadas
router.get('/recommendations', async (req, res) => {
  try {
    const userId = req.user.id;
    const recommendations = [];

    // Buscar dados para análise
    const recentTransactions = await Transaction.findAll({
      where: {
        userId,
        date: {
          [Op.gte]: moment().subtract(2, 'months').toDate()
        }
      },
      include: [{
        model: Category,
        as: 'category'
      }]
    });

    if (recentTransactions.length === 0) {
      return res.json({
        success: true,
        data: {
          recommendations: [{
            type: 'getting_started',
            title: '🚀 Comece sua jornada financeira',
            description: 'Adicione suas transações para receber recomendações personalizadas',
            priority: 'high',
            actions: [
              'Adicionar receitas mensais',
              'Registrar principais gastos',
              'Criar categorias personalizadas'
            ]
          }]
        }
      });
    }

    // Análise de gastos por categoria
    const expensesByCategory = {};
    const totalExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    recentTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const categoryName = t.category.name;
        if (!expensesByCategory[categoryName]) {
          expensesByCategory[categoryName] = 0;
        }
        expensesByCategory[categoryName] += parseFloat(t.amount);
      });

    // Recomendações baseadas em percentuais de gasto
    Object.entries(expensesByCategory).forEach(([category, amount]) => {
      const percentage = (amount / totalExpenses) * 100;
      
      if (percentage > 40) {
        recommendations.push({
          type: 'spending_concentration',
          title: `⚠️ Alto gasto em ${category}`,
          description: `${percentage.toFixed(1)}% do seu orçamento vai para ${category}. Considere diversificar ou reduzir esses gastos.`,
          priority: 'high',
          category,
          percentage: percentage.toFixed(1),
          actions: [
            `Definir orçamento para ${category}`,
            'Buscar alternativas mais baratas',
            'Monitorar gastos semanalmente'
          ]
        });
      }
    });

    // Recomendação de criação de emergência
    const monthlyIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0) / 2; // Média de 2 meses

    const monthlyExpenses = totalExpenses / 2;
    const monthlySavings = monthlyIncome - monthlyExpenses;

    if (monthlySavings > 0) {
      recommendations.push({
        type: 'emergency_fund',
        title: '🛡️ Fundo de Emergência',
        description: `Com R$ ${monthlySavings.toFixed(2)} de sobra mensal, você pode criar um fundo de emergência.`,
        priority: 'medium',
        actions: [
          'Separar 20% das sobras para emergência',
          'Abrir conta poupança específica',
          'Meta: 6 meses de gastos guardados'
        ]
      });
    }

    // Recomendações de investimento (se sobrar dinheiro)
    if (monthlySavings > 500) {
      recommendations.push({
        type: 'investment',
        title: '📈 Hora de investir!',
        description: `Com R$ ${monthlySavings.toFixed(2)} mensais sobrando, considere investimentos.`,
        priority: 'medium',
        actions: [
          'Estudar sobre Tesouro Direto',
          'Considerar CDBs de bancos digitais',
          'Diversificar investimentos gradualmente'
        ]
      });
    }

    // Recomendação de controle de gastos pequenos
    const smallExpenses = recentTransactions
      .filter(t => t.type === 'expense' && parseFloat(t.amount) < 50)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    if (smallExpenses > monthlyExpenses * 0.15) {
      recommendations.push({
        type: 'small_expenses',
        title: '☕ Atenção aos pequenos gastos',
        description: `R$ ${smallExpenses.toFixed(2)} em pequenos gastos nos últimos 2 meses. Eles somam mais do que você imagina!`,
        priority: 'medium',
        actions: [
          'Listar gastos menores que R$ 50',
          'Definir limite semanal para "pequenos prazeres"',
          'Usar dinheiro físico para controle'
        ]
      });
    }

    // Ordenar por prioridade
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    res.json({
      success: true,
      data: {
        recommendations: recommendations.slice(0, 5), // Máximo 5 recomendações
        analysisBasedOn: `${recentTransactions.length} transações dos últimos 2 meses`,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro ao gerar recomendações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /ai/ask - Chat com IA financeira (simulado)
router.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Pergunta é obrigatória'
      });
    }

    // Respostas pré-programadas baseadas em palavras-chave
    const responses = {
      'economia|economizar|guardar': 'Para economizar, sugiro: 1) Anote todos os gastos, 2) Corte 10% dos gastos não essenciais, 3) Automatize a poupança. Quer que eu analise seus gastos atuais?',
      'investir|investimento': 'Para começar a investir: 1) Tenha uma reserva de emergência, 2) Comece com Tesouro Direto, 3) Diversifique gradualmente. Baseado no seu perfil, você tem condições de investir?',
      'orçamento|planejar': 'Um bom orçamento segue a regra 50/30/20: 50% necessidades, 30% desejos, 20% poupança. Posso criar um orçamento baseado nas suas transações?',
      'dívida|dívidas': 'Para sair das dívidas: 1) Liste todas com juros, 2) Quite primeiro as de maior juros, 3) Negocie condições. Precisa de ajuda para organizar suas dívidas?',
      'meta|objetivo': 'Defina metas financeiras SMART: Específicas, Mensuráveis, Atingíveis, Relevantes, com Tempo definido. Que meta financeira você tem em mente?'
    };

    let response = 'Interessante pergunta! Posso te ajudar com: análise de gastos, sugestões de economia, planejamento de orçamento, estratégias de investimento e organização de metas. Seja mais específico sobre o que você gostaria de saber!';

    // Encontrar resposta baseada na pergunta
    for (const [keywords, answer] of Object.entries(responses)) {
      const regex = new RegExp(keywords, 'i');
      if (regex.test(question)) {
        response = answer;
        break;
      }
    }

    res.json({
      success: true,
      data: {
        question,
        answer: response,
        timestamp: new Date().toISOString(),
        suggestedActions: [
          'Ver meus insights',
          'Analisar gastos por categoria',
          'Criar meta financeira',
          'Gerar relatório mensal'
        ]
      }
    });

  } catch (error) {
    console.error('Erro no chat IA:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
