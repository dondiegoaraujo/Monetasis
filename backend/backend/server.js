// CORREÇÃO COMPLETA PARA O BACKEND MONETASIS
// Problema identificado: Rota /auth/register não existe

// ============================================================================
// 1. ATUALIZAÇÃO DO server.js
// ============================================================================

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Configuração de CORS corrigida
const corsOptions = {
  origin: [
    'https://www.monetasis.com.br',
    'https://monetasis.vercel.app',
    'http://localhost:3000',
    /^https:\/\/monetasis-.*\.vercel\.app$/
  ],
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 204,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Middleware adicional para headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
  } else {
    next();
  }
});

// Middleware para parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    body: req.body,
    origin: req.headers.origin
  });
  next();
});

// ============================================================================
// 2. MODELO DE USUÁRIO (User.js)
// ============================================================================

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

// ============================================================================
// 3. ROTAS DE AUTENTICAÇÃO
// ============================================================================

// Rota de registro (NOVA - estava faltando!)
app.post('/auth/register', async (req, res) => {
  try {
    console.log('Tentativa de registro:', req.body);
    
    const { name, email, password } = req.body;
    
    // Validação básica
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email e senha são obrigatórios'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter pelo menos 6 caracteres'
      });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }
    
    // Verificar se usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Usuário já existe com este email'
      });
    }
    
    // Criar novo usuário
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    console.log('Usuário criado com sucesso:', user.email);
    
    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Rota de login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }
    
    // Buscar usuário
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
    
    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
    
    // Gerar token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ============================================================================
// 4. ROTAS EXISTENTES (manter)
// ============================================================================

app.get('/', (req, res) => {
  res.json({
    message: "🚀 MonetAsis API - Sistema de Gestão Financeira",
    status: "FUNCIONANDO!",
    version: "1.0.0",
    timestamp: new Date().toLocaleString('pt-BR'),
    features: [
      "✅ Servidor Express rodando",
      "✅ CORS configurado",
      "✅ JSON parser ativo",
      "✅ Banco de dados em configuração",
      "✅ Rotas da API em desenvolvimento"
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.post('/auth/test', (req, res) => {
  res.json({ message: 'Rota de teste funcionando', data: req.body });
});

app.get('/transactions', (req, res) => {
  res.json({ message: 'Rota de transações em desenvolvimento' });
});

// ============================================================================
// 5. CONEXÃO COM MONGODB
// ============================================================================

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/monetasis', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Conectado ao MongoDB');
})
.catch((error) => {
  console.error('❌ Erro ao conectar ao MongoDB:', error);
});

// ============================================================================
// 6. MIDDLEWARE DE TRATAMENTO DE ERROS
// ============================================================================

app.use((err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()}:`, err);
  
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    ...(isDevelopment && { stack: err.stack })
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'POST /auth/register',  // NOVA ROTA ADICIONADA
      'POST /auth/login',     // NOVA ROTA ADICIONADA
      'POST /auth/test',
      'GET /transactions'
    ]
  });
});

// ============================================================================
// 7. INICIALIZAÇÃO DO SERVIDOR
// ============================================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MonetAsis API Server`);
  console.log(`📍 Porta: ${PORT}`);
  console.log(`✅ Status: FUNCIONANDO!`);
  console.log(`🕒 Timestamp: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

