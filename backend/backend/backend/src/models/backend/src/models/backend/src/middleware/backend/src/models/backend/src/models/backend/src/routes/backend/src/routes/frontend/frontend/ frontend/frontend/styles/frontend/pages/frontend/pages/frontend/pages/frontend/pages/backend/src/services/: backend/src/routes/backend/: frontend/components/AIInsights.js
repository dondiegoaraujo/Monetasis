import { useState, useEffect } from 'react'

export default function AIInsights() {
  const [insights, setInsights] = useState(null)
  const [trends, setTrends] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchInsights = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      // Buscar insights
      const insightsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/insights`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const insightsData = await insightsResponse.json()
      setInsights(insightsData.insights)

      // Buscar tendências
      const trendsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/trends`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const trendsData = await trendsResponse.json()
      setTrends(trendsData)
      
    } catch (error) {
      console.error('Erro ao buscar insights:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [])

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="loading-spinner mr-3"></div>
          <span>🤖 Analisando seus dados financeiros com IA...</span>
        </div>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            🤖 Insights Financeiros com IA
          </h3>
          <p className="text-gray-600 mb-4">
            Nossa IA analisará seus dados e fornecerá insights personalizados
          </p>
          <button onClick={fetchInsights} className="btn-primary">
            Analisar meus dados
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header da IA */}
      <div className="card bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white text-lg">🤖</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              MonetaSis IA
            </h3>
            <p className="text-sm text-gray-600">
              Análise inteligente das suas finanças
            </p>
          </div>
        </div>
      </div>

      {/* Análise Principal */}
      <div className="card">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">📊</span>
          <h4 className="text-lg font-medium text-gray-900">
            Análise da Situação Financeira
          </h4>
        </div>
        <p className="text-gray-700 leading-relaxed mb-4">
          {insights.analysis}
        </p>
        
        {insights.alert && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-500 text-xl mr-2">⚠️</span>
              <p className="text-red-700 font-medium">{insights.alert}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tendências */}
      {trends && (
        <div className="card">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">📈</span>
            <h4 className="text-lg font-medium text-gray-900">
              Análise de Tendências
            </h4>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700">{trends.message}</p>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Período atual:</span>
                <span className="ml-2 font-medium">R$ {trends.currentExpenses?.toFixed(2) || '0.00'}</span>
              </div>
              <div>
                <span className="text-gray-600">Período anterior:</span>
                <span className="ml-2 font-medium">R$ {trends.previousExpenses?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sugestões Personalizadas */}
      <div className="card">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">💡</span>
          <h4 className="text-lg font-medium text-gray-900">
            Sugestões Personalizadas
          </h4>
        </div>
        <div className="space-y-3">
          {insights.suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
              <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center mr-3 mt-0.5 text-sm font-bold">
                {index + 1}
              </div>
              <p className="text-green-800 flex-1">{suggestion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Meta do Próximo Mês */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <div className="flex items-center mb-3">
          <span className="text-3xl mr-3">🎯</span>
          <h4 className="text-lg font-semibold text-gray-900">Meta Inteligente</h4>
        </div>
        <p className="text-gray-800 font-medium text-lg">{insights.goal}</p>
        <p className="text-gray-600 text-sm mt-2">
          Baseado na análise dos seus padrões financeiros
        </p>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center bg-gradient-to-b from-green-50 to-green-100">
          <div className="text-3xl font-bold text-green-600 mb-1">
            {insights.savingsRate.toFixed(1)}%
          </div>
          <div className="text-sm text-green-700 font-medium">Taxa de Poupança</div>
          <div className="text-xs text-gray-600 mt-1">
            {insights.savingsRate >= 20 ? 'Excelente!' : 
             insights.savingsRate >= 10 ? 'Boa!' : 'Pode melhorar'}
          </div>
        </div>
        
        <div className="card text-center bg-gradient-to-b from-orange-50 to-orange-100">
          <div className="text-lg font-semibold text-orange-800 mb-1 truncate">
            {insights.topExpenseCategory}
          </div>
          <div className="text-sm text-orange-700 font-medium">Maior Categoria</div>
          <div className="text-xs text-gray-600 mt-1">de gastos</div>
        </div>
      </div>

      {/* Botão de Atualização */}
      <div className="text-center">
        <button 
          onClick={fetchInsights}
          className="btn-secondary inline-flex items-center"
          disabled={loading}
        >
          <span className="mr-2">🔄</span>
          {loading ? 'Analisando...' : 'Atualizar Análise'}
        </button>
        <p className="text-xs text-gray-500 mt-2">
          A IA analisa seus dados em tempo real
        </p>
      </div>
    </div>
  )
        }
