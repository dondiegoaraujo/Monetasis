import { useState } from 'react';

export default function MonetaSis() {
  const [showBalance, setShowBalance] = useState(true);
  
  const currentBalance = 12450.50;
  const monthlyIncome = 6000;
  const monthlyExpenses = 4100;
  
  const recentTransactions = [
    { id: 1, desc: 'Salário', amount: 5200, type: 'income', date: '2024-08-15' },
    { id: 2, desc: 'Supermercado', amount: -320, type: 'expense', date: '2024-08-14' },
    { id: 3, desc: 'Freelance', amount: 800, type: 'income', date: '2024-08-13' },
    { id: 4, desc: 'Combustível', amount: -180, type: 'expense', date: '2024-08-12' }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1e293b 0%, #7c3aed 50%, #1e293b 100%)',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>$</span>
            </div>
            <h1 style={{ color: 'white', fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
              MonetaSis
            </h1>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Cards de Resumo */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Saldo Atual */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
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
                  background: 'rgba(34, 197, 94, 0.2)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: '#22c55e', fontSize: '16px' }}>$</span>
                </div>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                  Saldo Atual
                </span>
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {showBalance ? '👁️' : '🙈'}
              </button>
            </div>
            <p style={{
              color: 'white',
              fontSize: '28px',
              fontWeight: 'bold',
              margin: 0
            }}>
              {showBalance 
                ? `R$ ${currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                : 'R$ ••••••'
              }
            </p>
          </div>

          {/* Receitas do Mês */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
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
                <span style={{ color: '#3b82f6', fontSize: '16px' }}>📈</span>
              </div>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                Receitas
              </span>
            </div>
            <p style={{
              color: 'white',
              fontSize: '28px',
              fontWeight: 'bold',
              margin: 0
            }}>
              R$ {monthlyIncome.toLocaleString('pt-BR')}
            </p>
          </div>

          {/* Gastos do Mês */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
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
                <span style={{ color: '#ef4444', fontSize: '16px' }}>📉</span>
              </div>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                Gastos
              </span>
            </div>
            <p style={{
              color: 'white',
              fontSize: '28px',
              fontWeight: 'bold',
              margin: 0
            }}>
              R$ {monthlyExpenses.toLocaleString('pt-BR')}
            </p>
          </div>

          {/* Economia do Mês */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
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
                <span style={{ color: '#8b5cf6', fontSize: '16px' }}>🎯</span>
              </div>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                Economia
              </span>
            </div>
            <p style={{
              color: 'white',
              fontSize: '28px',
              fontWeight: 'bold',
              margin: 0
            }}>
              R$ {(monthlyIncome - monthlyExpenses).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Transações Recentes */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h3 style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: '600',
              margin: 0
            }}>
              Transações Recentes
            </h3>
            <button style={{
              background: 'rgba(59, 130, 246, 0.2)',
              border: 'none',
              borderRadius: '12px',
              padding: '8px 16px',
              color: '#3b82f6',
              cursor: 'pointer'
            }}>
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
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                transition: 'all 0.3s ease'
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
                      ? 'rgba(34, 197, 94, 0.2)' 
                      : 'rgba(239, 68, 68, 0.2)'
                  }}>
                    <span style={{ 
                      fontSize: '18px',
                      color: transaction.type === 'income' ? '#22c55e' : '#ef4444'
                    }}>
                      {transaction.type === 'income' ? '📈' : '📉'}
                    </span>
                  </div>
                  <div>
                    <p style={{
                      color: 'white',
                      fontWeight: '500',
                      margin: 0,
                      marginBottom: '4px'
                    }}>
                      {transaction.desc}
                    </p>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.5)',
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
                  color: transaction.type === 'income' ? '#22c55e' : '#ef4444'
                }}>
                  {transaction.type === 'income' ? '+' : ''}R$ {Math.abs(transaction.amount).toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '64px',
        height: '64px',
        background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
        border: 'none',
        borderRadius: '50%',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'transform 0.3s ease'
      }}>
        <span style={{ color: 'white', fontSize: '24px' }}>+</span>
      </button>
    </div>
  );
}
