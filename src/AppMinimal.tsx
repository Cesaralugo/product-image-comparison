// src/AppMinimal.tsx
import React, { useState, useEffect } from 'react'

const AppMinimal: React.FC = () => {
  const [count, setCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('✅ AppMinimal mounted')
    console.log('   Count:', count)
  }, [count])

  console.log('🔄 AppMinimal rendering...')

  return (
    <div style={{
      padding: '40px',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      background: '#f7fafc',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#2d3748', marginBottom: '16px' }}>
          ✅ App is Working!
        </h1>
        <p style={{ color: '#4a5568', marginBottom: '8px' }}>
          If you see this, React is rendering correctly.
        </p>
        <p style={{ color: '#718096', fontSize: '14px', marginBottom: '20px' }}>
          Time: {new Date().toLocaleString()}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => setCount(c => c + 1)}
            style={{
              padding: '10px 20px',
              background: '#4299e1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Count: {count}
          </button>
          <button
            onClick={() => setError('Test error!')}
            style={{
              padding: '10px 20px',
              background: '#fc8181',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Test Error
          </button>
        </div>
        {error && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#fff5f5', borderRadius: '8px', color: '#c53030' }}>
            {error}
          </div>
        )}
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#a0aec0' }}>
          <p>Ready to build your full application!</p>
        </div>
      </div>
    </div>
  )
}

export default AppMinimal
