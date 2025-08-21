const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const aiService = require('../services/aiService');

const router = express.Router();

// Obter insights de IA
router.get('/insights', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const transactions = await Transaction.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(100); // Últimas 100 transações

    const insights = await aiService.analyzeFinancialData(user, transactions);
    
    res.json({
      message: 'Análise realizada com sucesso',
      insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao gerar insights:', error);
    res.status(500).json({ message: 'Erro ao gerar insights de IA' });
  }
});

// Obter sugestão para uma transação específica
router.post('/suggest', auth, async (req, res) => {
  try {
    const { category, amount, description } = req.body;
    
    const user = await User.findById(req.userId);
    const recentTransactions = await Transaction.find({ 
      userId: req.userId,
      category 
    }).sort({ date: -1 }).limit(5);

    const avgAmount = recentTransactions.length > 0 
      ? recentTransactions.reduce((sum, t) => sum + t.amount, 0) / recentTransactions.length
      : 0;

    let suggestion = '';
    if (amount > avgAmount * 1.5) {
      suggestion = `⚠️ Este gasto é 50% maior que sua média em ${category}. Tem certeza?`;
    } else if (amount > avgAmount * 1.2) {
      suggestion = `📊 Gasto um pouco acima da média para ${category}.`;
    } else {
      suggestion = `✅ Gasto dentro do normal para ${category}.`;
    }

    res.json({
      suggestion,
      avgAmount,
      comparison: amount / (avgAmount || 1)
    });
  } catch (error) {
    console.error('Erro ao gerar sugestão:', error);
    res.status(500).json({ message: 'Erro ao gerar sugestão' });
  }
});

// Obter análise de tendências
router.get('/trends', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const transactions = await Transaction.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(200);

    // Análise simples de tendências
    const last30Days = transactions.filter(t => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(t.date) >= thirtyDaysAgo;
    });

    const previous30Days = transactions.filter(t => {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(t.date) >= sixtyDaysAgo && new Date(t.date) < thirtyDaysAgo;
    });

    const currentExpenses = last30Days
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const previousExpenses = previous30Days
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const trend = previousExpenses > 0 
      ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 
      : 0;

    let trendMessage = '';
    if (trend > 10) {
      trendMessage = `📈 Seus gastos aumentaram ${trend.toFixed(1)}% comparado ao mês anterior. Fique atento!`;
    } else if (trend < -10) {
      trendMessage = `📉 Parabéns! Seus gastos diminuíram ${Math.abs(trend).toFixed(1)}% comparado ao mês anterior.`;
    } else {
      trendMessage = `📊 Seus gastos estão estáveis comparado ao mês anterior.`;
    }

    res.json({
      trend: trend.toFixed(1),
      message: trendMessage,
      currentExpenses,
      previousExpenses,
      comparison: trend
    });
  } catch (error) {
    console.error('Erro ao gerar análise de tendências:', error);
    res.status(500).json({ message: 'Erro ao gerar análise de tendências' });
  }
});

module.exports = router;
