import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // --- VERIFICAÇÃO DA VARIÁVEL DE AMBIENTE ---
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("Erro de configuração: A variável NEXT_PUBLIC_API_URL não foi encontrada.");
      }

      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin ? { email, password } : { name, email, password };
      
      const fullUrl = `${apiUrl}${endpoint}`;
      
      console.log(`Enviando requisição para: ${fullUrl}`); // Log para depuração

      const response = await axios.post(fullUrl, payload);
      
      const { token } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      router.push('/dashboard');

    } catch (err) {
      // --- CAPTURA DE ERRO MELHORADA ---
      console.error("--- ERRO DETALHADO ---", err);
      let errorMessage = 'Ocorreu um erro inesperado.';
      if (err.message.includes('Network Error')) {
        errorMessage = 'Erro de rede. Verifique sua conexão ou a configuração de CORS no servidor.';
      } else if (err.response) {
        // O servidor respondeu com um status de erro (4xx, 5xx)
        errorMessage = `Erro do servidor: ${err.response.data.message || err.response.statusText}`;
      } else {
        // Erro na configuração da requisição ou outro problema
        errorMessage = err.message;
      }
      setError(errorMessage);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        {/* O formulário permanece o mesmo */}
        <h1>{isLogin ? 'Login' : 'Cadastro'}</h1>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>
        {error && <p className={styles.error}>Erro: {error}</p>}
        <button className={styles.toggleButton} onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
        </button>
      </div>
    </div>
  );
}
