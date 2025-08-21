import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import AIInsights from '../components/AIInsights'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [summary, setSummary] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    category: '',
    description: '',
    amount: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      router.push('/')
      return
    }

    setUser(JSON.parse(userData))
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Buscar resumo
      const summaryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const summaryData = await summaryResponse.json()
      setSummary(summaryData)

      // Buscar transações
      const transactionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const transactionsData = await transactionsResponse.json()
      setTransactions(transactionsData)
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTransaction = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newTransaction,
          amount: parseFloat(newTransaction.amount)
        })
      })

      if (response.ok) {
        setNewTransaction({
          type: 'expense',
          category: '',
          description: '',
          amount: ''
        })
        setShowAddTransaction(false)
        fetchData() // Recarregar dados
      }
    } catch (error) {
      console.error('Erro ao adicionar transação:', error)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">MonetaSis</h1>
              <p className="text-gray-600">Bem-vindo, {user.name}!</p>
            </div>
            <button onClick={logout} className="btn-secondary">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Resumo Financeiro */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900">Receitas</h3>
              <p className="text-2xl font-bold text-green-600">
                R$ {summary.income.toFixed(2)}
              </p>
            </div>
            
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900">Gastos</h3>
              <p className="text-2xl font-bold text-red-600">
                R$ {summary.expenses.toFixed(2)}
              </p>
            </div>
            
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900">Saldo</h3>
              <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {summary.balance.toFixed(2)}
              </p>
            </div>
            
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900">Cashback</h3>
              <p className="text-2xl font-bold text-blue-600">
                R$ {summary.totalCashback.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Insights de IA */}
        <div className="mb-8">
          <AIInsights />
        </div>

        {/* Botão Adicionar Transação */}
        <div className="mb-6">
          <button 
            onClick={() => setShowAddTransaction(!showAddTransaction)}
            className="btn-primary"
          >
            {showAddTransaction ? 'Cancelar' : 'Nova Transação'}
          </button>
        </div>

        {/* Formulário Nova Transação */}
        {showAddTransaction && (
          <div className="card mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Nova Transação</h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                  <select 
                    className="input-field"
                    value={newTransaction.type}
                    onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                  >
                    <option value="expense">Gasto</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={newTransaction.category}
                    onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                    placeholder="Ex: Alimentação"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                  placeholder="Ex: Supermercado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="input-field"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>

              <button type="submit" className="btn-primary">
                Adicionar Transação
              </button>
            </form>
          </div>
        )}

        {/* Lista de Transações */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Transações Recentes</h3>
          
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhuma transação encontrada. Adicione sua primeira transação!
            </p>
          ) : (
            <div className="space-y-4">
              {transactions.slice(0, 10).map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-4 ${
                      transaction.type === 'income' ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {transaction.description}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                    </div>
                    {transaction.cashback > 0 && (
                      <div className="text-xs text-blue-600">
                        +R$ {transaction.cashback.toFixed(2)} cashback
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
  }
