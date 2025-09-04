const express = require('express');
const router = express.Router();

// GET /auth/test (rota que já funcionava)
router.get('/test', (req, res) => {
  res.json({
    message: 'Rota de autenticação funcionando!',
    timestamp: new Date().toISOString()
  });
});

// POST /auth/register - versão simples para teste
router.post('/register', async (req, res) => {
  res.json({
    message: 'Rota de registro funcionando - em desenvolvimento'
  });
});

// POST /auth/login - versão simples para teste  
router.post('/login', async (req, res) => {
  res.json({
    message: 'Rota de login funcionando - em desenvolvimento'
  });
});

module.exports = router;
