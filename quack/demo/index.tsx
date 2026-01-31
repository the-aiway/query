import { getDBResource } from '../../react/DuckDBProvider';
import { QuackClient, QuackProvider } from '../';
import { DemoApp } from './App';
import { OptimizerDemo } from './OptimizerDemo';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { NuqsAdapter } from 'nuqs/adapters/react';

const Root = () => {
  const [page, setPage] = useState<'basic' | 'optimizer'>('optimizer');

  return (
    <div>
      <nav
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#141417',
          border: '1px solid #1f1f23',
          padding: '6px',
          borderRadius: '30px',
          display: 'flex',
          gap: '4px',
          zIndex: 1000,
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}
      >
        <NavButton active={page === 'basic'} onClick={() => setPage('basic')}>
          Basic Demo
        </NavButton>
        <NavButton active={page === 'optimizer'} onClick={() => setPage('optimizer')}>
          Optimizer Demo
        </NavButton>
      </nav>
      {page === 'basic' ? <DemoApp /> : <OptimizerDemo />}
    </div>
  );
};

const NavButton = ({ active, onClick, children }: any) => (
  <button
    onClick={onClick}
    style={{
      background: active ? '#3366ff' : 'transparent',
      color: active ? '#fff' : '#888',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '25px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 'bold',
      transition: '0.2s',
    }}
  >
    {children}
  </button>
);

async function main() {
  const { instance: db, pool } = await getDBResource({
    bundlePath: '/dist',
    debug: true,
  });

  const conn = await pool.run(async (c) => c);
  const client = new QuackClient(db as any, conn as any);

  console.log('[Quack] Loading Production Macros...');
  // Fetch real macros from the dedicated endpoint
  const macrosSql = await fetch('/api/macros').then((r) => r.text());
  await conn.query(macrosSql);

  const root = createRoot(document.getElementById('root')!);
  root.render(
    <NuqsAdapter>
      <QuackProvider client={client}>
        <Root />
      </QuackProvider>
    </NuqsAdapter>
  );
}

main();
