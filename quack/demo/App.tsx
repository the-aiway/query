import React, { useState, useEffect, useMemo, useContext, createContext } from 'react';
import { useQuackSource, useQuackScope, useQuackMetric, useQuackCursor } from '../src/react/hooks';

// Styling for that "Modern Analytical" look
const styles = {
  card: {
    background: '#1c1c21',
    border: '1px solid #2d2d35',
    padding: '20px',
    borderRadius: '12px',
    color: '#fff',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '15px',
    marginBottom: '20px',
  },
  label: {
    fontSize: '11px',
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    marginBottom: '8px',
  },
  value: { fontSize: '24px', fontWeight: '700' },
  percent: { fontSize: '14px', marginLeft: '8px' },
  chip: (active: boolean) => ({
    padding: '8px 16px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    background: active ? '#3366ff' : '#2d2d35',
    color: active ? '#fff' : '#aaa',
    border: 'none',
    transition: '0.2s',
  }),
  container: { maxWidth: '1200px', margin: '0 auto', color: '#ccc' },
} as const;

export const DemoApp = () => {
  const [segment, setSegment] = useState<'ALL' | 'lot' | 'messagerie' | 'colis'>('ALL');
  const [multiplier, setMultiplier] = useState(1.0); // Simulate price negotiation lever

  // 1. Data Sourcing - Direct from Parquet (Fetch from local dev server)
  const transportOrders = useQuackSource(
    'org_transport_orders',
    `SELECT * FROM '${window.location.origin}/query/data/transport_orders.parquet'`
  );
  const carrierCosts = useQuackSource(
    'org_order_carrier_costs',
    `SELECT * FROM '${window.location.origin}/query/data/6-order_carrier_costs.parquet'`
  );

  // 2. Simulation Scope: Refine costs with multipliers and filters
  // This simulates the complex logic in department-stats.sql and macros.sql
  const simulationScope = useQuackScope(
    transportOrders,
    (parent) => {
      let sql = `
      WITH filtered_orders AS (
        SELECT * FROM ${parent} 
        WHERE 1=1 ${segment !== 'ALL' ? `AND actual_segment = '${segment}'` : ''}
      ),
      simulated_costs AS (
        SELECT 
            *,
            theoretical_cost * ${multiplier} as simulated_cost
        FROM org_order_carrier_costs
      )
      SELECT 
        o.id,
        o.actual_transport_cost as actual_cost,
        o.actual_segment as segment,
        c.simulated_cost,
        get_emission_heuristic(o.actual_transport_cost, 1) as actual_co2,
        get_emission_heuristic(c.simulated_cost, 1) as simulated_co2
      FROM filtered_orders o
      LEFT JOIN simulated_costs c ON o.destination_department = c.numdept AND o.carrier = c.carrier
    `;
      return sql;
    },
    [segment, multiplier, transportOrders, carrierCosts]
  );

  // 3. Heavy Aggregation Metric
  // This pulls the "Iceberg Tip" calculated from 1M combinations in WASM
  const analytics = useQuackMetric<{
    actual_total: number;
    simulated_total: number;
    actual_co2: number;
    simulated_co2: number;
    carriers: number;
    count: number;
  }>(
    simulationScope,
    (name) => `
      SELECT 
        SUM(actual_cost) as actual_total,
        SUM(simulated_cost) as simulated_total,
        SUM(actual_co2) as actual_co2,
        SUM(simulated_co2) as simulated_co2,
        COUNT(DISTINCT segment) as carriers, -- simplifying carrier count for demo
        COUNT(*) as count
      FROM ${name}
    `,
    []
  );

  const savings = (analytics?.actual_total || 0) - (analytics?.simulated_total || 0);
  const savingsPercent = ((savings / (analytics?.actual_total || 1)) * 100).toFixed(1);
  const co2Reduction = (analytics?.actual_co2 || 0) - (analytics?.simulated_co2 || 0);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={{ color: '#fff', margin: 0 }}>Transport Optimization ⚡</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'lot', 'messagerie', 'colis'].map((s) => (
            <button key={s} style={styles.chip(segment === s)} onClick={() => setSegment(s as any)}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {/* High-Performance Levers */}
      <div style={{ ...styles.card, marginBottom: '20px', background: '#25252b' }}>
        <div style={styles.label}>
          Price Simulation Multiplier: <b>{multiplier.toFixed(2)}x</b>
        </div>
        <input
          type="range"
          min="0.5"
          max="1.5"
          step="0.01"
          value={multiplier}
          onChange={(e) => setMultiplier(Number(e.target.value))}
          style={{ width: '100%', cursor: 'pointer' }}
        />
        <div style={{ fontSize: '10px', color: '#666', marginTop: '10px' }}>
          Adjusting this slider re-calculates <b>1,000,000+</b> order x carrier combinations in WASM
          instantly.
        </div>
      </div>

      {/* Main KPI Row */}
      <div style={styles.row}>
        <KPI
          label="Savings"
          value={savings}
          unit="€"
          color="#ff9900"
          subValue={`${savingsPercent}%`}
        />
        <KPI
          label="CO2 Reduction"
          value={co2Reduction / 1000}
          unit="tCO2"
          color="#22c55e"
          subValue="12%"
        />
        <KPI
          label="Simulated Total"
          value={analytics?.simulated_total || 0}
          unit="€"
          color="#3b82f6"
        />
        <KPI label="Sample Volume" value={analytics?.count || 0} unit="Orders" color="#a855f7" />
      </div>

      {/* Comparison Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
        <div style={styles.card}>
          <div style={styles.label}>Current Situation</div>
          <KPISmall label="Spend" value={analytics?.actual_total || 0} unit="€" icon="💶" />
          <KPISmall label="CO2" value={(analytics?.actual_co2 || 0) / 1000} unit="tCO2" icon="🌳" />
          <KPISmall label="Segments" value={analytics?.carriers || 0} unit="" icon="🚛" />
        </div>
        <div style={{ ...styles.card, borderColor: '#ff990022', boxShadow: '0 0 40px #ff99000a' }}>
          <div style={{ ...styles.label, color: '#ff9900' }}>Optimized Situation (Simulated)</div>
          <KPISmall
            label="Simulated Spend"
            value={analytics?.simulated_total || 0}
            unit="€"
            icon="📉"
            color="#ff9900"
          />
          <KPISmall
            label="Simulated CO2"
            value={(analytics?.simulated_co2 || 0) / 1000}
            unit="tCO2"
            icon="🍃"
            color="#22c55e"
          />
          <div style={{ marginTop: '30px', borderTop: '1px solid #2d2d35', paddingTop: '20px' }}>
            <div style={styles.label}>Budget Coverage</div>
            <div
              style={{
                height: '8px',
                background: '#2d2d35',
                borderRadius: '4px',
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              <div style={{ width: '93%', background: '#22c55e' }} />
              <div style={{ width: '7%', background: '#ff9900' }} />
            </div>
            <div style={{ display: 'flex', gap: '15px', marginTop: '10px', fontSize: '10px' }}>
              <span>● Direct 93%</span>
              <span>● Pro-rata 7%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPI = ({ label, value, unit, color, subValue }: any) => (
  <div style={styles.card}>
    <div style={styles.label}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline' }}>
      <div style={{ ...styles.value, color }}>
        {unit === '€' ? '€' : ''}
        {formatNumber(value)}
        {unit !== '€' ? ` ${unit}` : ''}
      </div>
      {subValue && <div style={{ ...styles.percent, color }}>{subValue}</div>}
    </div>
  </div>
);

const KPISmall = ({ label, value, unit, icon, color }: any) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
    <div
      style={{
        background: '#2d2d35',
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
      }}
    >
      {icon}
    </div>
    <div>
      <div style={styles.label}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 'bold', color }}>
        {formatNumber(value)} {unit}
      </div>
    </div>
  </div>
);

function formatNumber(n: number) {
  if (n > 1000000) return (n / 1000000).toFixed(2) + 'M';
  if (n > 1000) return (n / 1000).toFixed(1) + 'k';
  return Math.round(n).toLocaleString();
}
