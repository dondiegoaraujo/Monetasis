import { useState } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, CreditCard, Target, Calendar, Eye, EyeOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function MonetaSis() {
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dados mock para demonstração
  const monthlyData = [
    { name: 'Jan', receitas: 4500, gastos: 3200 },
    { name: 'Fev', receitas: 4200, gastos: 3800 },
    { name: 'Mar', receitas: 4800, gastos: 3500 },
    { name: 'Abr', receitas: 5100, gastos: 4200 },
    { name: 'Mai', receitas: 4900, gastos: 3900 },
    { name: 'Jun', receitas: 5200, gastos: 4100 }
  ];

  const expenseData = [
    { name: 'Alimentação', value: 1200, color: '#FF6B6B' },
    { name: 'Transporte', value: 800, color: '#4ECDC4' },
    { name: 'Moradia', value: 1500, color: '#45B7D1' },
    { name: 'Lazer', value: 600, color: '#96CEB4' },
    { name: 'Outros', value: 400, color: '#FFEAA7' }
  ];

  const recentTransactions = [
    { id: 1, desc: 'Salário', amount: 5200, type: 'income', date: '2024-06-15' },
    { id: 2, desc: 'Supermercado', amount: -320, type: 'expense', date: '2024-06-14' },
    { id: 3, desc: 'Freelance', amount: 800, type: 'income', date: '2024-06-13' },
    { id: 4, desc: 'Combustível', amount: -180, type: 'expense', date: '2024-06-12' },
    { id: 5, desc: 'Academia', amount: -80, type: 'expense', date: '2024-06-11' }
  ];

  const currentBalance = 12450.50;
  const monthlyIncome = 6000;
  const monthlyExpenses = 4100;
  const savingsGoal = 15000;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <DollarSign className="text-white w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-white">MonetaSis</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              {['dashboard', 'transacoes', 'metas', 'relatorios'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 rounded-lg capitalize transition-colors ${
                    activeTab === tab 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Saldo Atual */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-green-400 w-4 h-4" />
                </div>
                <span className="text-white/70 text-sm">Saldo Atual</span>
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-white/50 hover:text-white transition-colors"
              >
                {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-2xl font-bold text-white">
              {showBalance ? `R$ ${currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ ••••••'}
            </p>
          </div>

          {/* Receitas do Mês */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-blue-400 w-4 h-4" />
              </div>
              <span className="text-white/70 text-sm">Receitas</span>
            </div>
            <p className="text-2xl font-bold text-white">
              R$ {monthlyIncome.toLocaleString('pt-BR')}
            </p>
          </div>

          {/* Gastos do Mês */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                <TrendingDown className="text-red-400 w-4 h-4" />
              </div>
              <span className="text-white/70 text-sm">Gastos</span>
            </div>
            <p className="text-2xl font-bold text-white">
              R$ {monthlyExpenses.toLocaleString('pt-BR')}
            </p>
          </div>

          {/* Meta de Economia */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Target className="text-purple-400 w-4 h-4" />
              </div>
              <span className="text-white/70 text-sm">Meta Economia</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {Math.round((currentBalance / savingsGoal) * 100)}%
            </p>
            <div className="w-full bg-white/10 rounded-full h-2 mt-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((currentBalance / savingsGoal) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de Tendência */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-6">Receitas vs Gastos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="name" stroke="#ffffff60" />
                <YAxis stroke="#ffffff60" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: 'white'
                  }} 
                />
                <Line type="monotone" dataKey="receitas" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981' }} />
                <Line type="monotone" dataKey="gastos" stroke="#EF4444" strokeWidth={3} dot={{ fill: '#EF4444' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Gastos por Categoria */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-6">Gastos por Categoria</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: 'white'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {expenseData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-white/70 text-sm">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transações Recentes */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Transações Recentes</h3>
            <button className="flex items-center space-x-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-xl transition-colors">
              <PlusCircle className="w-4 h-4" />
              <span>Nova Transação</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {transaction.type === 'income' ? (
                      <TrendingUp className="text-green-400 w-5 h-5" />
                    ) : (
                      <TrendingDown className="text-red-400 w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{transaction.desc}</p>
                    <p className="text-white/50 text-sm">{transaction.date}</p>
                  </div>
                </div>
                <span className={`font-semibold ${
                  transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {transaction.type === 'income' ? '+' : ''}R$ {Math.abs(transaction.amount).toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
        <PlusCircle className="text-white w-8 h-8" />
      </button>
    </div>
  );
          }
