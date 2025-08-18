const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para verificar token JWT
const authMiddleware = async (req, res, next) => {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido',
        error: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verificar e decodificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Buscar usuário no banco
    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'name', 'email', 'emailVerified', 'deletedAt']
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    // Verificar se usuário foi deletado
    if (user.deletedAt) {
      return res.status(401).json({
        success: false,
        message: 'Conta desativada',
        error: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Adicionar usuário no request
    req.user = user;
    req.userId = user.id;

    next();

  } catch (error) {
    console.error('Erro no middleware de auth:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        error: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
        error: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Middleware opcional - não bloqueia se não houver token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      req.userId = null;
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'name', 'email', 'emailVerified', 'deletedAt']
    });

    if (user && !user.deletedAt) {
      req.user = user;
      req.userId = user.id;
    } else {
      req.user = null;
      req.userId = null;
    }

    next();

  } catch (error) {
    // Em caso de erro, continua sem usuário autenticado
    req.user = null;
    req.userId = null;
    next();
  }
};

// Middleware para verificar se email foi verificado
const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado',
      error: 'NOT_AUTHENTICATED'
    });
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email não verificado. Verifique seu email antes de continuar.',
      error: 'EMAIL_NOT_VERIFIED'
    });
  }

  next();
};

// Middleware para verificar se usuário é admin (se houver sistema de roles)
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
        error: 'NOT_AUTHENTICATED'
      });
    }

    // Buscar usuário completo para verificar role
    const user = await User.findByPk(req.user.id);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Privilégios de administrador necessários.',
        error: 'ACCESS_DENIED'
      });
    }

    next();

  } catch (error) {
    console.error('Erro no middleware de admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Middleware para limitar tentativas de login por IP
const createLoginLimiter = () => {
  const attempts = new Map();
  const maxAttempts = 5;
  const windowMs = 15 * 60 * 1000; // 15 minutos

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Limpar tentativas antigas
    if (attempts.has(ip)) {
      const ipAttempts = attempts.get(ip);
      const validAttempts = ipAttempts.filter(time => now - time < windowMs);
      
      if (validAttempts.length === 0) {
        attempts.delete(ip);
      } else {
        attempts.set(ip, validAttempts);
      }
    }

    // Verificar se excedeu tentativas
    const currentAttempts = attempts.get(ip) || [];
    
    if (currentAttempts.length >= maxAttempts) {
      const oldestAttempt = Math.min(...currentAttempts);
      const timeRemaining = windowMs - (now - oldestAttempt);
      
      return res.status(429).json({
        success: false,
        message: `Muitas tentativas de login. Tente novamente em ${Math.ceil(timeRemaining / 60000)} minutos.`,
        error: 'TOO_MANY_ATTEMPTS',
        retryAfter: Math.ceil(timeRemaining / 1000)
      });
    }

    // Registrar tentativa em caso de falha
    req.recordLoginAttempt = () => {
      const ipAttempts = attempts.get(ip) || [];
      ipAttempts.push(now);
      attempts.set(ip, ipAttempts);
    };

    next();
  };
};

// Middleware para validar ownership de recursos
const validateOwnership = (model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const resourceId = req.params[paramName];
      const userId = req.user.id;

      const resource = await model.findOne({
        where: {
          id: resourceId,
          userId: userId
        }
      });

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Recurso não encontrado ou você não tem permissão para acessá-lo'
        });
      }

      req.resource = resource;
      next();

    } catch (error) {
      console.error('Erro no middleware de ownership:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };
};

// Middleware para log de atividades do usuário
const logUserActivity = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log apenas em caso de sucesso (status 2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const logData = {
          userId: req.user?.id,
          action,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString(),
          method: req.method,
          url: req.originalUrl
        };

        // Em produção, isso seria salvo no banco ou sistema de logs
        console.log('User Activity:', JSON.stringify(logData));
      }

      originalSend.call(this, data);
    };

    next();
  };
};

module.exports = {
  authMiddleware,
  optionalAuth,
  requireEmailVerified,
  requireAdmin,
  createLoginLimiter,
  validateOwnership,
  logUserActivity
};
