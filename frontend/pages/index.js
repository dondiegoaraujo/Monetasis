import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import styles from '../styles/Home.module.css';

// Importe o componente Image do Next.js para otimização
import Image from 'next/image';

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin ? { email, password } : { name, email, password };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("Erro de configuração: A variável NEXT_PUBLIC_API_URL não foi encontrada.");
      }

      const response = await axios.post(`${apiUrl}${endpoint}`, payload);
      
      // Assumindo que o token é retornado no corpo da resposta
      const token = response.data.token;
      localStorage.setItem('authToken', token); // Salva o token
      
      router.push('/dashboard'); // Redireciona para o dashboard

    } catch (err) {
      let errorMessage = 'Erro: Algo deu errado.';
      if (err.response) {
        errorMessage = `Erro: ${err.response.data.message || 'O servidor respondeu com um erro.'}`;
      } else if (err.request) {
        errorMessage = 'Erro de conexão com o servidor. Verifique sua internet ou tente mais tarde.';
      } else {
        errorMessage = `Erro na configuração da requisição: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Container principal com o fundo verde musgo
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#2A3F3D]">
      
      {/* Adicionando a Logo */}
      <div className="mb-8">
        <Image 
          src="https://i.imgur.com/3n5V5s1.png" 
          alt="Monetasis Logo" 
          width={200} 
          height={200}
          priority // Ajuda a carregar a imagem mais rápido
        />
      </div>

      {/* Container do formulário */}
      <div className={styles.formContainer}>
        <h1>{isLogin ? 'Login' : 'Criar Conta'}</h1>
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
        <button onClick={() => setIsLogin(!isLogin)} className={styles.toggleButton}>
          {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
              }
