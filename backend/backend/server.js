const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Importa o pacote cors
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');

dotenv.config();

const app = express();

// --- CONFIGURAÇÃO DE CORS SIMPLIFICADA (PARA TESTE) ---
// Isso permite requisições de QUALQUER origem.
app.use(cors());
// --- FIM DA CONFIGURAÇÃO ---

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
