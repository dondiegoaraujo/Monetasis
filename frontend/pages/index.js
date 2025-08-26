import { useState } from 'react'
import Head from 'next/head'

export default function Home() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      
      if (response.ok) {
        alert(isLogin ? 'Login realizado com sucesso!' : 'Cadastro realizado com sucesso!')
      } else {
        alert('Erro: ' + (data.message || 'Algo deu errado'))
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Erro de conexão com o servidor')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <>
      <Head>
        <title>Monetasis - Gestão Financeira</title>
        <meta name="description" content="Plataforma completa de gestão financeira" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex min-h-screen">
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">
                  {isLogin ? 'Entrar' : 'Criar Conta'}
                </h2>
                <p className="mt-2 text-gray-600">
                  {isLogin ? 'Acesse sua conta' : 'Cadastre-se gratuitamente'}
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {!isLogin && (
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Nome
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required={!isLogin}
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Seu nome completo"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Senha
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 disabled:opacity-50"
                >
                  {isLoading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
                </button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                >
                  {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
                </button>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-purple-700 items-center justify-center p-12">
            <div className="text-center text-white">
              <h1 className="text-4xl font-bold mb-4">Monetasis</h1>
              <p className="text-xl opacity-90 mb-8">
                Sua plataforma completa de gestão financeira
              </p>
              <div className="space-y-4 text-left max-w-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Controle de receitas e despesas</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Relatórios detalhados</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Metas financeiras</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
                  }
