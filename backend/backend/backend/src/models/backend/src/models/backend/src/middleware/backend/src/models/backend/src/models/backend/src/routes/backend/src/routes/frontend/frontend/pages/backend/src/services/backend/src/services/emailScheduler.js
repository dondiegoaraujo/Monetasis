const cron = require('node-cron');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const emailService = require('./emailService');

class EmailScheduler {
  constructor() {
    this.startSchedulers();
  }

  startSchedulers() {
    // Relatórios quinzenais - todo dia 1 e 15 às 09:00
    cron.schedule('0 9 1,15 * *', async () => {
      console.log('Iniciando envio de relatórios quinzenais...');
      await this.sendBiweeklyReports();
    });

    // Verificar alertas diários - todo dia às 20:00
    cron.schedule('0 20 * * *', async () => {
      console.log('Verificando alertas de gastos...');
      await this.checkSpendingAlerts();
    });

    // Verificar conquistas - todo dia às 18:00
    cron.schedule('0 18 * * *', async () => {
      console.log('Verificando novas conquistas...');
      await this.checkAchievements();
    });

    // Reengajamento - toda segunda às 10:00
    cron.schedule('0 10 * * 1', async () => {
      console.log('Enviando emails de reengajamento...');
      await this.sendReengagementEmails();
    });

    console.log('📧 Schedulers de email iniciados!');
  }

  async sendBiweeklyReports() {
    try {
      const users = await User.find({ 
        isActive: true, 
        notifications: true 
      });

      for (const user of users) {
        // Verificar se o usuário tem transações
        const transactionCount = await Transaction.countDocuments({
          userId: user._id
        });

        if (transactionCount >= 5) { // Só enviar se tiver pelo menos 5 transações
          await emailService.sendBiweeklyReport(user);
          
          // Delay entre emails para evitar spam
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log(`Relatórios quinzenais enviados para ${users.length} usuários`);
    } catch (error) {
      console.error('Erro ao enviar relatórios quinzenais:', error);
    }
  }

  async checkSpendingAlerts() {
    try {
      const users = await User.find({ 
        isActive: true, 
        notifications: true 
      });

      for (const user of users) {
        await this.checkUserSpendingAlerts(user);
      }
    } catch (error) {
      console.error('Erro ao verificar alertas de gastos:', error);
    }
  }

  async checkUserSpendingAlerts(user) {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Gastos do mês atual
    const monthlyTransactions = await Transaction.find({
      userId: user._id,
      type: 'expense',
      date: { $gte: thisMonth }
    });

    // Agrupar por categoria
    const expensesByCategory = {};
    monthlyTransactions.forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

    // Verificar se alguma categoria ultrapassou 30% da renda mensal
    const warningThreshold = user.monthlyIncome * 0.3; // 30% da renda em uma categoria

    for (const [category, amount] of Object.entries(expensesByCategory)) {
      if (amount > warningThreshold && user.monthlyIncome > 0) {
        // Verificar se já enviou alerta este mês para esta categoria
        const lastAlert = await this.getLastAlert(user._id, category);
        
        if (!lastAlert || lastAlert.month !== today.getMonth()) {
          await this.sendSpendingAlert(user, {
            message: `Você gastou mais de 30% da sua renda mensal com ${category}`,
            amount,
            category
          });

          // Salvar que enviou o alerta
          await this.saveAlert(user._id, category, today.getMonth());
        }
      }
    }
  }

  async sendSpendingAlert(user, alertData) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); color: #333; padding: 30px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .alert-card { background: #fef2f2; border: 2px solid #fecaca; padding: 20px; margin: 20px 0; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>⚠️ Alerta de Gastos</h1>
            <p>Olá, ${user.name}! Detectamos algo importante.</p>
          </div>
          
          <div class="content">
            <div class="alert-card">
              <h2>📊 Situação Atual</h2>
              <p><strong>${alertData.message}</strong></p>
              <p>Valor gasto: <strong>R$ ${alertData.amount.toFixed(2)}</strong></p>
              <p>Categoria: <strong>${alertData.category}</strong></p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h2>💡 Sugestões</h2>
              <ul>
                <li>Revise seus gastos em ${alertData.category}</li>
                <li>Defina um limite mensal para esta categoria</li>
                <li>Considere alternativas mais econômicas</li>
              </ul>
              
              <a href="${process.env.FRONTEND_URL}/dashboard" 
                 style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Revisar Gastos
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await emailService.sendEmail({
      to: user.email,
      subject: `⚠️ Alerta: Gastos elevados em ${alertData.category}`,
      html: htmlContent
    });
  }

  async checkAchievements() {
    try {
      const users = await User.find({ 
        isActive: true, 
        notifications: true 
      });

      for (const user of users) {
        await this.checkUserAchievements(user);
      }
    } catch (error) {
      console.error('Erro ao verificar conquistas:', error);
    }
  }

  async checkUserAchievements(user) {
    const transactionCount = await Transaction.countDocuments({
      userId: user._id
    });

    // Conquista: Primeira transação
    if (transactionCount === 1) {
      await this.sendAchievementEmail(user, {
        title: 'Primeiro Passo!',
        description: 'Você registrou sua primeira transação no MonetaSis!',
        reward: 'Continue adicionando suas transações para ter insights mais precisos.'
      });
    }

    // Conquista: 10 transações
    if (transactionCount === 10) {
      await this.sendAchievementEmail(user, {
        title: 'Usuário Ativo!',
        description: 'Parabéns por registrar 10 transações!',
        reward: 'Você está construindo um histórico financeiro sólido!'
      });
    }

    // Conquista: 50 transações
    if (transactionCount === 50) {
      await this.sendAchievementEmail(user, {
        title: 'Usuário Dedicado!',
        description: 'Incrível! Você registrou 50 transações!',
        reward: 'Seus relatórios de IA estão cada vez mais precisos!'
      });
    }
  }

  async sendAchievementEmail(user, achievement) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 40px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .card { background: white; padding: 30px; margin: 20px 0; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.15); text-align: center; }
          .trophy { font-size: 60px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🎉 PARABÉNS, ${user.name}!</h1>
            <p>Você alcançou uma nova conquista!</p>
          </div>
          
          <div class="content">
            <div class="card">
              <div class="trophy">🏆</div>
              <h2>${achievement.title}</h2>
              <p style="font-size: 18px; color: #666;">${achievement.description}</p>
              
              <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #166534;">
                  ${achievement.reward}
                </p>
              </div>
              
              <a href="${process.env.FRONTEND_URL}/dashboard" 
                 style="background: #f5576c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Continue Evoluindo!
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await emailService.sendEmail({
      to: user.email,
      subject: `🏆 Nova conquista desbloqueada - ${achievement.title}`,
      html: htmlContent
    });
  }

  async sendReengagementEmails() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Usuários que não fazem login há mais de 30 dias
      const inactiveUsers = await User.find({
        isActive: true,
        lastLogin: { $lt: thirtyDaysAgo }
      });

      for (const user of inactiveUsers) {
        await this.sendReengagementEmail(user);
      }

      console.log(`Emails de reengajamento enviados para ${inactiveUsers.length} usuários`);
    } catch (error) {
      console.error('Erro ao enviar emails de reengajamento:', error);
    }
  }

  async sendReengagementEmail(user) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🌟 Sentimos sua falta, ${user.name}!</h1>
            <p>Que tal retomar o controle das suas finanças?</p>
          </div>
          
          <div class="content">
            <div class="card">
              <h2>📊 Novidades que você perdeu:</h2>
              <ul>
                <li>🤖 Insights de IA mais inteligentes</li>
                <li>📧 Relatórios automáticos por email</li>
                <li>🎯 Sistema de metas e conquistas</li>
                <li>📱 Interface ainda mais fácil de usar</li>
              </ul>
              
              <a href="${process.env.FRONTEND_URL}/dashboard" 
                 style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px;">
                Voltar ao MonetaSis
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await emailService.sendEmail({
      to: user.email,
      subject: `🌟 ${user.name}, sentimos sua falta no MonetaSis!`,
      html: htmlContent
    });
  }

  // Métodos auxiliares para rastrear alertas e conquistas
  async getLastAlert(userId, category) {
    // Por simplicidade, vamos usar um mock
    return null;
  }

  async saveAlert(userId, category, month) {
    // Por simplicidade, só loggar
    console.log(`Alerta salvo para usuário ${userId}, categoria ${category}, mês ${month}`);
  }
}

module.exports = new EmailScheduler();
