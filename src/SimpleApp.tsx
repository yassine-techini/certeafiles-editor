/**
 * SimpleApp - Minimal test app to verify basic rendering
 */
import { useState } from 'react';

function SimpleApp(): JSX.Element {
  const [count, setCount] = useState(0);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
          CerteaFiles Editor - Test Page
        </h1>
        <p style={{ color: '#4b5563', marginBottom: '16px' }}>
          If you can see this, React is rendering correctly.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <button
            onClick={() => setCount(c => c - 1)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            -
          </button>
          <span style={{ fontSize: '20px', fontFamily: 'monospace' }}>{count}</span>
          <button
            onClick={() => setCount(c => c + 1)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            +
          </button>
        </div>
        <p style={{ marginTop: '16px', fontSize: '14px', color: '#9ca3af' }}>
          Click the buttons to test interactivity
        </p>
      </div>
    </div>
  );
}

export default SimpleApp;
