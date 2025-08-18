const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuração do banco baseada no ambiente
const config = {
  development: {
    database: process.env.DB_NAME || 'monetasis_dev',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  }
};

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Criar instância do Sequelize
let sequelize;

if (env === 'production' && process.env.DATABASE_URL) {
  // Railway/Heroku style DATABASE_URL
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Configuração tradicional
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: dbConfig.logging,
      pool: dbConfig.pool,
      dialectOptions: dbConfig.dialectOptions || {}
    }
  );
}

// Testar conexão
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com PostgreSQL estabelecida com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com PostgreSQL:', error.message);
    return false;
  }
};

// Sincronizar modelos (apenas em desenvolvimento)
const syncDatabase = async (force = false) => {
  try {
    if (env === 'development') {
      await sequelize.sync({ force, alter: true });
      console.log(`✅ Banco sincronizado! (force: ${force})`);
    } else {
      console.log('ℹ️  Sincronização automática desabilitada em produção');
    }
  } catch (error) {
    console.error('❌ Erro ao sincronizar banco:', error);
    throw error;
  }
};

// Fechar conexão
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('🔌 Conexão com banco fechada');
  } catch (error) {
    console.error('❌ Erro ao fechar conexão:', error);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  closeConnection,
  Sequelize
};
