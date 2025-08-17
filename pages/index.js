import { useState } from 'react';

export default function MonetaSis() {
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  
  const currentBalance = 12450.50;
  const monthlyIncome = 6000;
  const monthlyExpenses = 4100;
  const savingsGoal = 15000;
  
  const recentTransactions = [
    { id: 1, desc: 'Salário', amount: 5200, type: 'income', date: '2024-08-15' },
    { id: 2, desc: 'Supermercado', amount: -320, type: 'expense', date: '2024-08-14' },
    { id: 3, desc: 'Freelance', amount: 800, type: 'income', date: '2024-08-13' },
    { id: 4, desc: 'Combustível', amount: -180, type: 'expense', date: '2024-08-12' }
  ];

  const LogoMonetaSis = () => (
    <div style={{
      width: '40px',
      height: '40px',
      background: 'linear-gradient(135deg, #10B981, #059669)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M7 14l3-3 3 3 6-6" stroke="white" strokeWidth="2"/>
        <path d="M17 8h3v3" stroke="white" strokeWidth="2"/>
        <rect x="3" y="12" width="3" height="5" fill="white" fillOpacity="0.7"/>
        <rect x="8" y="9" width="3" height="8" fill="white" fillOpacity="0.8"/>
        <rect x="13" y="6" width="3" height="11" fill="white" fillOpacity="0.9"/>
      </svg>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 50%, #F0FDF4 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
        padding: '16px 0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <LogoMonetaSis />
              <h1 style={{ color: '#111827', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
                MonetaSis
              </h1>
            </div>
            <nav style={{ display: 'flex', gap: '8px' }}>
              {['Dashboard', 'Transações', 'Metas', 'Relatórios'].map((tab, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === tab.toLowerCase() 
                      ? 'linear-gradient(135deg, #10B981, #059669)' 
                      : 'transparent',
                    color: activeTab === tab.toLowerCase() ? 'white' : '#6B7280',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        {/* Cards Principais */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Saldo Atual */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: '#10B981', fontSize: '16px' }}>💰</span>
                </div>
                <span style={{ color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                  Saldo Atual
                </span>
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6B7280',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {showBalance ? '👁️' : '🙈'}
              </button>
            </div>
            <p style={{
              color: '#111827',
              fontSize: '32px',
              fontWeight: 'bold',
              margin: 0
            }}>
              {showBalance 
                ? 'R$ ' + currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                : 'R$ ••••••'
              }
            </p>
          </div>

          {/* Receitas */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'rgba(59, 130, 246, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: '#3B82F6', fontSize: '16px' }}>📈</span>
              </div>
              <span style={{ color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                Receitas do Mês
              </span>
            </div>
            <p style={{ color: '#111827', fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
              R$ {monthlyIncome.toLocaleString('pt-BR')}
            </p>
          </div>

          {/* Gastos */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: '#EF4444', fontSize: '16px' }}>📉</span>
              </div>
              <span style={{ color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                Gastos do Mês
              </span>
            </div>
            <p style={{ color: '#111827', fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
              R$ {monthlyExpenses.toLocaleString('pt-BR')}
            </p>
          </div>

          {/* Meta de Economia */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'rgba(139, 92, 246, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: '#8B5CF6', fontSize: '16px' }}>🎯</span>
              </div>
              <span style={{ color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                Meta Economia
              </span>
            </div>
            <p style={{
              color: '#111827',
              fontSize: '32px',
              fontWeight: 'bold',
              margin: '0 0 12px 0'
            }}>
              {Math.round((currentBalance / savingsGoal) * 100)}%
            </p>
            <div style={{
              width: '100%',
              background: 'rgba(139, 92, 246, 0.1)',
              borderRadius: '8px',
              height: '8px'
            }}>
              <div style={{
                background: 'linear-gradient(90deg, #8B5CF6, #10B981)',
                height: '8px',
                borderRadius: '8px',
                width: Math.min((currentBalance / savingsGoal) * 100, 100) + '%',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>
        </div>

        {/* Transações Recentes */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h3 style={{
              color: '#111827',
              fontSize: '20px',
              fontWeight: '600',
              margin: 0
            }}>
              Transações Recentes
            </h3>
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              + Nova Transação
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.5)',
                borderRadius: '12px',
                border: '1px solid rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: transaction.type === 'income' 
                      ? 'rgba(16, 185, 129, 0.2)' 
                      : 'rgba(239, 68, 68, 0.2)'
                  }}>
                    <span style={{ 
                      fontSize: '18px',
                      color: transaction.type === 'income' ? '#10B981' : '#EF4444'
                    }}>
                      {transaction.type === 'income' ? '📈' : '📉'}
                    </span>
                  </div>
                  <div>
                    <p style={{
                      color: '#111827',
                      fontWeight: '500',
                      margin: 0,
                      marginBottom: '4px',
                      fontSize: '16px'
                    }}>
                      {transaction.desc}
                    </p>
                    <p style={{
                      color: '#6B7280',
                      fontSize: '14px',
                      margin: 0
                    }}>
                      {transaction.date}
                    </p>
                  </div>
                </div>
                <span style={{
                  fontWeight: '600',
                  fontSize: '16px',
                  color: transaction.type === 'income' ? '#10B981' : '#EF4444'
                }}>
                  {transaction.type === 'income' ? '+' : ''}
                  R$ {Math.abs(transaction.amount).toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          background: 'linear-gradient(135deg, #10B981, #059669)',
          border: 'none',
          borderRadius: '50%',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '24px',
          color: 'white',
          fontWeight: 'bold'
        }}
      >
        +
      </button>

      {/* Badge IA */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
        borderRadius: '20px',
        padding: '8px 16px',
        boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span style={{ fontSize: '16px' }}>🤖</span>
        <span style={{
          color: 'white',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          IA Financeira
        </span>
      </div>
    </div>
  );
                  }
