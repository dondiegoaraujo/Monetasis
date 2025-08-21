const axios = require('axios');

class AIService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || 'demo-key';
    this.apiUrl = 'https://api.deepseek.com/v1/chat/completions';
  }

  async analyzeFinancialData(user, transactions) {
    try {
      const financialSummary = this.createFinancialSummary(user, transactions);
      
      const prompt = this.createAnalysisPrompt(financialSummary);
      
      // Se não tiver API key, usar análise mock
      if (this.apiKey === 'demo-key') {
        return this.mockAnalysis(financialSummary);
      }

      const response = await axios.post(this.apiUrl, {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Você é um consultor financeiro especializado em análise de dados pessoais. Responda sempre em português brasileiro com dicas práticas e personalizadas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return this.parseAIResponse(response.data.choices[0].message.content, financialSummary);
    } catch (error) {
      console.error('Erro na análise de IA:', error);
      return this.mockAnalysis(this.createFinancialSummary(user, transactions));
    }
  }

  createFinancialSummary(user, transactions) {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const recentTransactions = transactions.filter(t => new Date(t.date) >= lastMonth);
    
    const totalIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expensesByCategory = {};
    recentTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
      });

    const topExpenseCategory = Object.keys(expensesByCategory).reduce((a, b) => 
      expensesByCategory[a] > expensesByCategory[b] ? a : b
    , Object.keys(expensesByCategory)[0] || 'Sem gastos');

    return {
      user: { name: user.name, monthlyIncome: user.monthlyIncome },
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      expensesByCategory,
      topExpenseCategory,
      transactionCount: recentTransactions.length,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
    };
  }

  createAnalysisPrompt(summary) {
    return `
Analise os dados financeiros do usuário ${summary.user.name}:

RECEITAS: R$ ${summary.totalIncome.toFixed(2)}
GASTOS: R$ ${summary.totalExpenses.toFixed(2)}
SALDO: R$ ${summary.balance.toFixed(2)}
TAXA DE POUPANÇA: ${summary.savingsRate.toFixed(1)}%

GASTOS POR CATEGORIA:
${Object.entries(summary.expensesByCategory).map(([cat, val]) => `- ${cat}: R$ ${val.toFixed(2)}`).join('\n')}

MAIOR GASTO: ${summary.topExpenseCategory}

Forneça:
1. Uma análise da situação financeira
2. 3 dicas específicas para melhorar
3. Uma meta realista para o próximo mês
4. Um alerta se houver algo preocupante

Seja direto, prático e motivacional. Máximo 400 palavras.
    `;
  }

  mockAnalysis(summary) {
    const insights = [];
    const suggestions = [];
    let goal = '';
    let alert = '';

    // Análise da situação
    if (summary.balance > 0) {
      insights.push(`Parabéns! Você teve um saldo positivo de R$ ${summary.balance.toFixed(2)} este mês.`);
    } else {
      insights.push(`Atenção: você gastou R$ ${Math.abs(summary.balance).toFixed(2)} a mais do que ganhou.`);
      alert = 'Você está gastando mais do que ganha. É hora de revisar seus gastos!';
    }

    if (summary.savingsRate >= 20) {
      insights.push('Excelente taxa de poupança! Você está no caminho certo.');
    } else if (summary.savingsRate >= 10) {
      insights.push('Boa taxa de poupança, mas dá para melhorar um pouquinho.');
    } else if (summary.savingsRate > 0) {
      insights.push('Você está poupando, mas muito pouco. Tente aumentar.');
    }

    // Sugestões baseadas na maior categoria de gasto
    if (summary.topExpenseCategory.toLowerCase().includes('alimentação')) {
      suggestions.push('Experimente cozinhar mais em casa - pode economizar até 40% com alimentação');
    } else if (summary.topExpenseCategory.toLowerCase().includes('transporte')) {
      suggestions.push('Considere usar transporte público ou compartilhado para economizar');
    } else {
      suggestions.push(`Revise os gastos com ${summary.topExpenseCategory} - é sua maior categoria`);
    }

    suggestions.push('Defina um orçamento mensal para cada categoria de gasto');
    suggestions.push('Tente economizar pelo menos 10% da sua renda todo mês');

    // Meta para próximo mês
    const targetSavings = Math.max(summary.totalIncome * 0.1, summary.balance + 200);
    goal = `Meta para próximo mês: economizar R$ ${targetSavings.toFixed(2)}`;

    return {
      analysis: insights.join(' '),
      suggestions,
      goal,
      alert,
      savingsRate: summary.savingsRate,
      topExpenseCategory: summary.topExpenseCategory
    };
  }

  parseAIResponse(aiText, summary) {
    // Parse básico da resposta da IA
    const lines = aiText.split('\n').filter(line => line.trim());
    
    return {
      analysis: aiText.substring(0, 200) + '...',
      suggestions: [
        'Sugestão baseada na análise de IA',
        'Dica personalizada para seu perfil',
        'Estratégia para próximo mês'
      ],
      goal: 'Meta sugerida pela IA para próximo mês',
      alert: summary.balance < 0 ? 'Atenção aos gastos!' : '',
      savingsRate: summary.savingsRate,
      topExpenseCategory: summary.topExpenseCategory
    };
  }
}

module.exports = new AIService();
