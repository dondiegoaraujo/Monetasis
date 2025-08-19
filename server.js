
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Rota de teste - Health check
app.get('/', (req, res) => {
  res.json({
    message: '🚀 MonetAsis API - Sistema de Gestão Financeira',
    status: 'FUNCIONANDO!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: [
      '✅ Servidor Express rodando',
      '✅ CORS configurado', 
      '✅ JSON parser ativo',
      '🔄 Banco de dados em configuração',
      '🔄 Rotas da API em desenvolvimento'
    ]
  });
});

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Rota de teste para autenticação (simulada)
app.post('/auth/test', (req, res) => {
  res.json({
    message: '🔐 Endpoint de autenticação funcionando',
    data: {
      user: 'teste',
      token: 'jwt_token_exemplo'
    }
  });
});

// Rota de teste para transações (simulada)
app.get('/transactions', (req, res) => {
  res.json({
    message: '💰 Endpoint de transações funcionando',
    data: [
      {
        id: 1,
        description: 'Salário',
        amount: 5000,
        type: 'income',
        date: '2024-08-19'
      },
      {
        id: 2,
        description: 'Supermercado',
        amount: 150,
        type: 'expense', 
        date: '2024-08-19'
      }
    ]
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Algo deu errado!',
    message: err.message
  });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    availableEndpoints: [
      'GET /',
      'GET /health', 
      'POST /auth/test',
      'GET /transactions'
    ]
  });
});

// Inicializar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════╗
║        🚀 MonetAsis API Server        ║
║                                      ║
║  Porta: ${PORT.toString().padEnd(27)} ║
║  Status: FUNCIONANDO!                ║
║  Timestamp: ${new Date().toLocaleString().padEnd(20)} ║
╚══════════════════════════════════════╝
  `);
});

module.exports = app;
