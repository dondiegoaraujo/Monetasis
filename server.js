const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();

// Importar rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const transactionRoutes = require('./routes/transactions');
const categoryRoutes = require('./routes/categories');
const goalRoutes = require('./routes/goals');
const budgetRoutes = require('./routes/budgets');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');
const notificationRoutes = require('./routes/notifications');

// Importar middlewares
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requests por IP
  message: {
    error: 'Muitas tentativas. Tente novamente em 15 minutos.'
  }
});
app.use(limiter);

// CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://monetasis.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚀 MonetAsis API - Sistema de Gestão Financeira',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      users: '/users',
      transactions: '/transactions',
      categories: '/categories',
      goals: '/goals',
      budgets: '/budgets',
      analytics: '/analytics',
      ai: '/ai',
      notifications: '/notifications',
      health: '/health'
    },
    documentation: 'https://github.com/dondiegoaraujo/monetasis-backend'
  });
});

// Rotas da API
app.use('/auth', authRoutes);
app.use('/users', authMiddleware, userRoutes);
app.use('/transactions', authMiddleware, transactionRoutes);
app.use('/categories', authMiddleware, categoryRoutes);
app.use('/goals', authMiddleware, goalRoutes);
app.use('/budgets', authMiddleware, budgetRoutes);
app.use('/analytics', authMiddleware, analyticsRoutes);
app.use('/ai', authMiddleware, aiRoutes);
app.use('/notifications', authMiddleware, notificationRoutes);

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    message: `Rota ${req.originalUrl} não existe`,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'POST /auth/register',
      'POST /auth/login',
      'GET /auth/google',
      'GET /transactions',
      'POST /transactions',
      'GET /analytics/dashboard'
    ]
  });
});

// Inicializar servidor
app.listen(PORT, HOST, () => {
  console.log(`
╔══════════════════════════════════════╗
║        🚀 MonetAsis API Server        ║
║                                      ║
║  Porta: ${PORT.toString().padEnd(27)} ║
║  Host: ${HOST.padEnd(28)} ║
║  Ambiente: ${(process.env.NODE_ENV || 'development').padEnd(22)} ║
║  Timestamp: ${new Date().toLocaleString().padEnd(20)} ║
╚══════════════════════════════════════╝

✅ Servidor rodando em http://${HOST}:${PORT}
📚 Documentação: http://${HOST}:${PORT}
🔍 Health Check: http://${HOST}:${PORT}/health

🎯 Endpoints disponíveis:
   • POST /auth/register - Registro de usuários
   • POST /auth/login - Login
   • GET /auth/google - OAuth Google
   • GET /transactions - Listar transações
   • POST /transactions - Criar transação
   • GET /analytics/dashboard - Dashboard completo
   • GET /ai/insights - Insights da IA financeira
`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Recebido SIGTERM. Encerrando servidor graciosamente...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Recebido SIGINT. Encerrando servidor graciosamente...');
  process.exit(0);
});

module.exports = app;
