const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const router = express.Router();

// Middleware para validar email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// GET /auth/test (rota que já existe)
router.get('/test', (req, res) => {
  res.json({
    message: 'Rota de autenticação funcionando!',
    timestamp: new Date().toISOString()
  });
});

// POST /auth/register - Cadastro de usuário
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validações básicas
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Nome, email e senha são obrigatórios'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        message: 'Email inválido'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Senha deve ter pelo menos 6 caracteres'
      });
    }

    // Verificar se usuário já existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: 'Email já está cadastrado'
      });
    }

    // Hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Criar novo usuário
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword
    });

    const savedUser = await newUser.save();

    // Gerar token JWT
    const token = jwt.sign(
      { 
        userId: savedUser._id,
        email: savedUser.email 
      },
      process.env.JWT_SECRET || 'sua-chave-secreta-aqui',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Cadastro realizado com sucesso!',
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email
      }
    });

  } catch (error) {
    console.error('Erro no cadastro:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// POST /auth/login - Login de usuário
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validações básicas
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email e senha são obrigatórios'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        message: 'Email inválido'
      });
    }

    // Buscar usuário no banco
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        message: 'Email ou senha incorretos'
      });
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Email ou senha incorretos'
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email 
      },
      process.env.JWT_SECRET || 'sua-chave-secreta-aqui',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login realizado com sucesso!',
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
      message: 'Erro interno do servidor'
    });
  }
});

// Middleware para verificar token JWT (para rotas protegidas)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      message: 'Token de acesso requerido'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-secreta-aqui', (err, user) => {
    if (err) {
      return res.status(403).json({
        message: 'Token inválido'
      });
    }
    req.user = user;
    next();
  });
};

// GET /auth/profile - Obter dados do usuário logado
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
