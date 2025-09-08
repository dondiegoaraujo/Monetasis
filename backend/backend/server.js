const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Importa o pacote cors
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');

dotenv.config();

const app = express();

// --- CONFIGURAÇÃO DO CORS ---
// Lista de domínios que podem fazer requisições para esta API
const allowedOrigins = [
  'http://localhost:3000', // Para desenvolvimento local
  'https://monetasis.vercel.app',
  'https://www.monetasis.com.br'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permite requisições sem 'origin' (como apps mobile ou Postman) ou se a origem estiver na lista
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200 // Para navegadores mais antigos
};

app.use(cors(corsOptions)); // Usa o middleware cors com as opções definidas
// --- FIM DA CONFIGURAÇÃO DO CORS ---

app.use(express.json());

// Conexão com o MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB conectado com sucesso.'))
.catch(err => console.error('Erro ao conectar com o MongoDB:', err));

// Rotas
app.get('/', (req, res) => {
  res.json({ message: "Bem-vindo à API Monetasis" });
});
app.use('/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
