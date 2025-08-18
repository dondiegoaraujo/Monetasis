const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

// Configurar Passport Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Verificar se usuário já existe
    let user = await User.findOne({ where: { googleId: profile.id } });
    
    if (user) {
      return done(null, user);
    }

    // Verificar se existe usuário com mesmo email
    user = await User.findOne({ where: { email: profile.emails[0].value } });
    
    if (user) {
      // Associar conta Google ao usuário existente
      user.googleId = profile.id;
      await user.save();
      return done(null, user);
    }

    // Criar novo usuário
    user = await User.create({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      profilePicture: profile.photos[0].value,
      emailVerified: true
    });

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Função para gerar tokens JWT
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Validações
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nome deve ter entre 2 e 50 caracteres'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos: 1 minúscula, 1 maiúscula e 1 número')
];

const loginValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória')
];

// POST /auth/register - Registro de usuário
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // Verificar se usuário já existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email já está em uso'
      });
    }

    // Hash da senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Criar usuário
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      emailVerified: false
    });

    // Gerar tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Salvar refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Resposta (sem senha)
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /auth/login - Login de usuário
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Buscar usuário
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos'
      });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos'
      });
    }

    // Gerar tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Salvar refresh token
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // Resposta
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      profilePicture: user.profilePicture
    };

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken
        }
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

// POST /auth/refresh - Renovar token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token é obrigatório'
      });
    }

    // Verificar refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret');
    
    // Buscar usuário
    const user = await User.findOne({
      where: {
        id: decoded.userId,
        refreshToken
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token inválido'
      });
    }

    // Gerar novos tokens
    const tokens = generateTokens(user.id);
    
    // Salvar novo refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Tokens renovados com sucesso',
      data: {
        tokens
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token inválido ou expirado'
      });
    }

    console.error('Erro ao renovar token:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /auth/google - Iniciar OAuth Google
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// GET /auth/google/callback - Callback OAuth Google
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      // Gerar tokens para usuário autenticado via Google
      const { accessToken, refreshToken } = generateTokens(req.user.id);
      
      // Salvar refresh token
      req.user.refreshToken = refreshToken;
      req.user.lastLogin = new Date();
      await req.user.save();

      // Redirecionar para frontend com tokens
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
      res.redirect(redirectUrl);
      
    } catch (error) {
      console.error('Erro no callback Google:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_error`);
    }
  }
);

// POST /auth/logout - Logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      
      // Remover refresh token do banco
      await User.update(
        { refreshToken: null },
        { where: { id: decoded.userId } }
      );
    }

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });

  } catch (error) {
    console.error('Erro no logout:', error);
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  }
});

// GET /auth/me - Dados do usuário atual
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'name', 'email', 'emailVerified', 'profilePicture', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
