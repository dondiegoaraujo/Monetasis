express = require('express');
const auth = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Enviar email de boas-vindas (teste)
router.post('/welcome', auth, async (req, res) => {
  try {
    const user = req.user;
    
    const result = await emailService.sendWelcomeEmail(user);
    
    if (result.success) {
      res.json({
        message: 'Email de boas-vindas enviado com sucesso!',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        message: 'Erro ao enviar email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Enviar relatório manual (teste)
router.post('/report', auth, async (req, res) => {
  try {
    const user = req.user;
    
    const result = await emailService.sendBiweeklyReport(user);
    
    if (result.success) {
      res.json({
        message: 'Relatório enviado com sucesso!',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        message: 'Erro ao enviar relatório',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erro ao enviar relatório:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar preferências de notificação
router.put('/preferences', auth, async (req, res) => {
  try {
    const { notifications } = req.body;
    const userId = req.userId;
    
    await User.findByIdAndUpdate(userId, { notifications });
    
    res.json({
      message: 'Preferências atualizadas com sucesso!',
      notifications
    });
  } catch (error) {
    console.error('Erro ao atualizar preferências:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Status do sistema de emails
router.get('/status', auth, async (req, res) => {
  try {
    res.json({
      status: 'online',
      features: {
        welcome_emails: true,
        biweekly_reports: true,
        spending_alerts: true,
        achievement_notifications: true,
        reengagement_emails: true
      },
      scheduler_active: process.env.NODE_ENV === 'production',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
