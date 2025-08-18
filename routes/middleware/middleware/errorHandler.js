// Middleware de tratamento de erros global
const errorHandler = (err, req, res, next) => {
  console.error('Error caught by errorHandler:', err);

  // Erro de validação do Sequelize
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(error => ({
      field: error.path,
      message: error.message,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      error: 'VALIDATION_ERROR',
      details: errors
    });
  }

  // Erro de constraint único do Sequelize
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'campo';
    const value = err.errors[0]?.value || '';

    return res.status(409).json({
      success: false,
      message: `${field} '${value}' já está em uso`,
      error: 'DUPLICATE_ENTRY',
      field: field
    });
  }

  // Erro de conexão com banco de dados
  if (err.name === 'SequelizeConnectionError') {
    console.error('Database connection error:', err);
    
    return res.status(503).json({
      success: false,
      message: 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.',
      error: 'SERVICE_UNAVAILABLE'
    });
  }

  // Erro de timeout de conexão
  if (err.name === 'SequelizeConnectionTimedOutError') {
    console.error('Database timeout:', err);
    
    return res.status(504).json({
      success: false,
      message: 'Timeout na conexão com o banco de dados',
      error: 'DATABASE_TIMEOUT'
    });
  }

  // Erro de foreign key
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Referência inválida. Verifique se os dados relacionados existem.',
      error: 'FOREIGN_KEY_ERROR'
    });
  }

  // Erro de JWT inválido
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token de acesso inválido',
      error: 'INVALID_TOKEN'
    });
  }

  // Erro de JWT expirado
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token de acesso expirado',
      error: 'TOKEN_EXPIRED',
      expiredAt: err.expiredAt
    });
  }

  // Erro de sintaxe JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Formato JSON inválido',
      error: 'INVALID_JSON'
    });
  }

  // Erro de validação do express-validator
  if (err.type === 'validation') {
    return res.status(400).json({
      success: false,
      message: 'Dados de entrada inválidos',
      error: 'INPUT_VALIDATION_ERROR',
      details: err.errors
    });
  }

  // Erro customizado da aplicação
  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message,
      error: err.code || 'OPERATIONAL_ERROR'
    });
  }

  // Erro de rate limit
  if (err.type === 'rate_limit_exceeded') {
    return res.status(429).json({
      success: false,
      message: 'Muitas requisições. Tente novamente mais tarde.',
      error: 'RATE_LIMIT_EXCEEDED',
      retryAfter: err.retryAfter
    });
  }

  // Erro de upload de arquivo
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Arquivo muito grande. Tamanho máximo permitido: 5MB',
      error: 'FILE_TOO_LARGE'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Tipo de arquivo não permitido',
      error: 'INVALID_FILE_TYPE'
    });
  }

  // Erro de CORS
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado por política CORS',
      error: 'CORS_ERROR'
    });
  }

  // Errors específicos do Node.js
  if (err.code === 'ENOTFOUND') {
    return res.status(503).json({
      success: false,
      message: 'Serviço externo indisponível',
      error: 'EXTERNAL_SERVICE_ERROR'
    });
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      message: 'Falha na conexão com serviços externos',
      error: 'CONNECTION_REFUSED'
    });
  }

  // Log detalhado para erros não tratados
  console.error('Unhandled error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Erro interno genérico
  return res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.message
    })
  });
};

// Middleware para capturar erros assíncronos
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Classe para erros operacionais customizados
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Função para criar erros específicos
const createError = {
  badRequest: (message, code = 'BAD_REQUEST') => new AppError(message, 400, code),
  unauthorized: (message, code = 'UNAUTHORIZED') => new AppError(message, 401, code),
  forbidden: (message, code = 'FORBIDDEN') => new AppError(message, 403, code),
  notFound: (message, code = 'NOT_FOUND') => new AppError(message, 404, code),
  conflict: (message, code = 'CONFLICT') => new AppError(message, 409, code),
  tooManyRequests: (message, code = 'TOO_MANY_REQUESTS') => new AppError(message, 429, code),
  internal: (message, code = 'INTERNAL_ERROR') => new AppError(message, 500, code)
};

// Middleware para log de requisições (desenvolvimento)
const requestLogger = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const method = req.method;
      const url = req.originalUrl;
      
      console.log(`[${new Date().toISOString()}] ${method} ${url} ${status} - ${duration}ms`);
    });
  }
  
  next();
};

// Middleware para sanitizar dados de entrada
const sanitizeInput = (req, res, next) => {
  // Remover propriedades perigosas
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Pular propriedades que começam com $ (MongoDB injection)
        if (key.startsWith('$')) continue;
        
        // Pular __proto__ e constructor
        if (key === '__proto__' || key === 'constructor') continue;
        
        if (typeof obj[key] === 'string') {
          // Remover scripts básicos
          sanitized[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        } else if (typeof obj[key] === 'object') {
          sanitized[key] = sanitize(obj[key]);
        } else {
          sanitized[key] = obj[key];
        }
      }
    }
    return sanitized;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

module.exports = {
  errorHandler,
  asyncHandler,
  AppError,
  createError,
  requestLogger,
  sanitizeInput
};
