const nodemailer = require('nodemailer');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

class EmailService {
  constructor() {
    // Configuração do transportador de email
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER, // seu email
        pass: process.env.SMTP_PASS  // senha do app (não a senha normal)
      }
    });
  }

  // Email de boas-vindas
  async sendWelcomeEmail(user) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .btn { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🎉 Bem-vindo ao MonetaSis!</h1>
            <p>Olá, ${user.name}! Sua jornada financeira começa agora.</p>
          </div>
          <div class="content">
            <div class="card">
              <h2>🚀 Primeiros Passos</h2>
              <p>Para aproveitar ao máximo o MonetaSis:</p>
              <ul>
                <li>✅ Adicione suas primeiras transações</li>
                <li>✅ Defina suas metas financeiras</li>
                <li>✅ Explore os insights de IA</li>
              </ul>
              <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">Acessar Dashboard</a>
            </div>
            
            <div class="card">
              <h2>📊 Relatórios Automáticos</h2>
              <p>A cada 15 dias você receberá:</p>
              <ul>
                <li>📈 Análise da sua evolução financeira</li>
                <li>💡 Dicas personalizadas de economia</li>
                <li>🎯 Progresso das suas metas</li>
              </ul>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: user.email,
      subject: `🎉 Bem-vindo ao MonetaSis, ${user.name}!`,
      html: htmlContent
    });
  }

  // Email de relatório quinzenal
  async sendBiweeklyReport(user) {
    const reportData = await this.generateReportData(user);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .metric { text-align: center; padding: 15px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #4facfe; }
          .metric-label { color: #666; font-size: 14px; }
          .positive { color: #10b981; }
          .negative { color: #ef4444; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>📊 Seu Relatório Quinzenal</h1>
            <p>Olá, ${user.name}! Veja como foram seus últimos 15 dias.</p>
          </div>
          
          <div class="content">
            <!-- Resumo Geral -->
            <div class="card">
              <h2>💰 Resumo Financeiro</h2>
              <div class="grid">
                <div class="metric">
                  <div class="metric-value ${reportData.balance >= 0 ? 'positive' : 'negative'}">
                    R$ ${reportData.balance.toFixed(2)}
                  </div>
                  <div class="metric-label">Saldo do Período</div>
                </div>
                <div class="metric">
                  <div class="metric-value">
                    ${reportData.savingsRate.toFixed(1)}%
                  </div>
                  <div class="metric-label">Taxa de Poupança</div>
                </div>
              </div>
            </div>

            <!-- Evolução -->
            <div class="card">
              <h2>📈 Sua Evolução</h2>
              <p><strong>Receitas:</strong> R$ ${reportData.income.toFixed(2)}</p>
              <p><strong>Gastos:</strong> R$ ${reportData.expenses.toFixed(2)}</p>
              <p><strong>Maior categoria de gasto:</strong> ${reportData.topCategory}</p>
              
              ${reportData.improvement > 0 ? 
                `<div style="background: #dcfce7; padding: 15px; border-radius: 6px; margin-top: 15px;">
                  <p style="margin: 0; color: #166534;">
                    🎉 <strong>Parabéns!</strong> Você melhorou ${reportData.improvement.toFixed(1)}% comparado aos 15 dias anteriores!
                  </p>
                </div>` :
                `<div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin-top: 15px;">
                  <p style="margin: 0; color: #92400e;">
                    ⚠️ <strong>Atenção!</strong> Seus gastos aumentaram ${Math.abs(reportData.improvement).toFixed(1)}%. Vamos ajustar?
                  </p>
                </div>`
              }
            </div>

            <!-- Dicas Personalizadas -->
            <div class="card">
              <h2>💡 Dicas Para Você</h2>
              ${reportData.tips.map(tip => `
                <div style="margin: 10px 0; padding: 10px; background: #f8fafc; border-left: 4px solid #4facfe; border-radius: 4px;">
                  ${tip}
                </div>
              `).join('')}
            </div>

            <!-- Call to Action -->
            <div class="card" style="text-align: center;">
              <h2>🚀 Continue Evoluindo</h2>
              <p>Acesse seu dashboard e veja mais detalhes da sua evolução!</p>
              <a href="${process.env.FRONTEND_URL}/dashboard" 
                 style="background: #4facfe; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Ver Dashboard Completo
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: user.email,
      subject: `📊 Seu progresso financeiro dos últimos 15 dias - MonetaSis`,
      html: htmlContent
    });
  }

  // Gerar dados do relatório
  async generateReportData(user) {
    const now = new Date();
    const fifteenDaysAgo = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000));
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Transações dos últimos 15 dias
    const recentTransactions = await Transaction.find({
      userId: user._id,
      date: { $gte: fifteenDaysAgo, $lte: now }
    });

    // Transações dos 15 dias anteriores (para comparação)
    const previousTransactions = await Transaction.find({
      userId: user._id,
      date: { $gte: thirtyDaysAgo, $lt: fifteenDaysAgo }
    });

    const income = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const previousExpenses = previousTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Categoria com maior gasto
    const expensesByCategory = {};
    recentTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
      });

    const topCategory = Object.keys(expensesByCategory).reduce((a, b) => 
      expensesByCategory[a] > expensesByCategory[b] ? a : b
    , Object.keys(expensesByCategory)[0] || 'Nenhuma');

    // Cálculo de melhoria
    const improvement = previousExpenses > 0 
      ? ((previousExpenses - expenses) / previousExpenses) * 100 
      : 0;

    // Dicas personalizadas
    const tips = this.generatePersonalizedTips(user, {
      income,
      expenses,
      topCategory,
      improvement,
      savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0
    });

    return {
      income,
      expenses,
      balance: income - expenses,
      topCategory,
      improvement,
      savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
      tips
    };
  }

  // Gerar dicas personalizadas
  generatePersonalizedTips(user, data) {
    const tips = [];

    if (data.savingsRate < 10) {
      tips.push('💰 Tente economizar pelo menos 10% da sua renda mensal para criar uma reserva de emergência.');
    }

    if (data.topCategory.toLowerCase().includes('alimentação')) {
      tips.push('🍽️ Seus maiores gastos são com alimentação. Que tal cozinhar mais em casa? Pode economizar até 40%!');
    }

    if (data.improvement < 0) {
      tips.push('📊 Seus gastos aumentaram comparado ao período anterior. Revise suas transações e identifique onde pode cortar.');
    }

    if (data.expenses > data.income) {
      tips.push('⚠️ Você está gastando mais do que ganha. É fundamental revisar o orçamento urgentemente.');
    }

    if (data.savingsRate >= 20) {
      tips.push('🎉 Parabéns pela excelente taxa de poupança! Continue assim e considere investir o excedente.');
    }

    // Garantir pelo menos 2 dicas
    if (tips.length < 2) {
      tips.push('📱 Use o MonetaSis diariamente para acompanhar seus gastos em tempo real.');
      tips.push('🎯 Defina metas mensais específicas para cada categoria de gasto.');
    }

    return tips.slice(0, 3); // Máximo 3 dicas
  }

  // Método base para enviar emails
  async sendEmail({ to, subject, html }) {
    try {
      const mailOptions = {
        from: `MonetaSis <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email enviado:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
