import React, { useMemo } from 'react';
import { useQueryStates, parseAsFloat, parseAsArrayOf, parseAsString, parseAsInteger } from 'nuqs';
import {
  useQuackSource,
  useQuackScope,
  useQuackMetric,
  useQuackCursor,
  useQuackResults,
} from '../src/react/hooks';
import geoData from './geo.json';

const OPTIMIZE_SEGMENTS = [
  { id: 'lot', label: 'Lot' },
  { id: 'messagerie', label: 'Messagerie' },
  { id: 'colis', label: 'Colis' },
] as const;

// Production-parity constants
const CARRIER_EMISSION_FACTORS: Record<string, number> = {
  DDS: 0.068,
  Geodis: 0.072,
  Heppner: 0.074,
  Tendron: 0.076,
  Speed: 0.07,
  BESSON: 0.069,
  GFS: 0.073,
  'SPEED-DISTRIBUTION': 0.07,
  MAZET: 0.078,
  DERET: 0.077,
  'KUEHNE-NAGEL': 0.071,
  GEFCO: 0.075,
};
const DEFAULT_EMISSION_FACTOR = 0.076;

const CARRIER_DELAY_FACTORS: Record<string, number> = {
  DDS: 0.9,
  Geodis: 0.95,
  Heppner: 1.0,
  Tendron: 1.0,
  Speed: 1.0,
  BESSON: 0.92,
  GFS: 0.98,
  'SPEED-DISTRIBUTION': 0.88,
  MAZET: 1.05,
  DERET: 1.02,
  'KUEHNE-NAGEL': 0.95,
  GEFCO: 1.0,
};
const DEFAULT_DELAY = 1.0;

// --- STYLING ---
const styles = {
  container: {
    background: '#0a0a0c',
    minHeight: '100vh',
    padding: '40px',
    color: '#e2e2e8',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  nav: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' },
  allocationCard: (color: string) => ({
    background: '#16161a',
    padding: '20px',
    borderRadius: '12px',
    border: `1px solid ${color}20`,
    textAlign: 'center' as const,
  }),
  allocationLabel: {
    fontSize: '10px',
    color: '#6e6e77',
    fontWeight: 700,
    marginBottom: '8px',
    letterSpacing: '1px',
  },
  allocationValue: { fontSize: '24px', fontWeight: 800, color: '#fff' },
  coverageBarContainer: {
    background: '#16161a',
    padding: '24px',
    borderRadius: '12px',
    marginBottom: '40px',
    border: '1px solid #ffffff08',
  },
  progressTrack: {
    height: '8px',
    background: '#2a2a2e',
    borderRadius: '4px',
    overflow: 'hidden',
    display: 'flex',
  },
  progressBar: {
    height: '100%',
    transition: 'width 0.5s ease-out',
  },
  legendItem: (color: string) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#a1a1aa',
    fontWeight: 500,
  }),
  legendDot: (color: string) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: color,
  }),
  title: { fontSize: '24px', fontWeight: '600', letterSpacing: '-0.02em', margin: 0 },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '30px',
  },
  kpiCard: (color: string) => ({
    background: '#141417',
    border: '1px solid #1f1f23',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: `0 4px 20px -5px ${color}11`,
  }),
  label: {
    fontSize: '12px',
    color: '#6e6e77',
    fontWeight: '500',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '12px',
  },
  value: { fontSize: '28px', fontWeight: '700', marginBottom: '4px' },
  subtext: (color: string) => ({ fontSize: '13px', color, fontWeight: '600' }),
  mainGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' },
  panel: {
    background: '#141417',
    borderRadius: '16px',
    border: '1px solid #1f1f23',
    padding: '24px',
    position: 'relative' as const,
  },
  tag: (bg: string, fg: string) => ({
    background: bg,
    color: fg,
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
  }),
  mapContainer: {
    width: '100%',
    height: '600px',
    background: '#0f0f12',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  segmentBtn: (active: boolean) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    border: '1px solid',
    borderColor: active ? '#3b82f6' : '#1f1f23',
    background: active ? '#3b82f611' : '#141417',
    color: active ? '#3b82f6' : '#6e6e77',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }),
} as const;

// --- MAP PROJECTION ---
const bounds = { minLon: -5.5, maxLon: 10, minLat: 41, maxLat: 51.5 };
const project = (lon: number, lat: number) => ({
  x: ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 600,
  y: ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 600,
});

const getCarrierColor = (carrier: string): string => {
  const colors = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#f97316',
  ];
  if (!carrier) return '#2a2a2e';
  let hash = 0;
  for (let i = 0; i < carrier.length; i++) hash = carrier.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 0,
  }).format(val);

const displayPercentage = (val: number, delta = false) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    maximumFractionDigits: 1,
    signDisplay: delta ? 'always' : 'auto',
  }).format(val);

export const OptimizerDemo = () => {
  const [state, setState] = useQueryStates({
    org: parseAsInteger.withDefault(5),
    coverage: parseAsFloat
      .withOptions({
        history: 'push',
        limitUrlUpdates: { method: 'throttle', timeMs: 100 },
        shallow: true,
      })
      .withDefault(0.8),
    segments: parseAsArrayOf(parseAsString, ',').withDefault(['lot', 'messagerie', 'colis']),
  });
  const { coverage: threshold, segments } = state;

  // 1. Data Sourcing - Direct from Parquet
  const transportOrders = useQuackSource(
    'org_transport_orders',
    `SELECT * FROM '${window.location.origin}/query/data/transport_orders.parquet' 
     WHERE ${segments.length > 0 ? `actual_segment IN (${segments.map((s) => `'${s}'`).join(',')})` : '1=0'}`,
    [segments]
  );
  const carrierCosts = useQuackSource(
    'org_order_carrier_costs',
    `SELECT * FROM '${window.location.origin}/query/data/order_carrier_costs.parquet'
     WHERE ${segments.length > 0 ? `actual_segment IN (${segments.map((s) => `'${s}'`).join(',')})` : '1=0'}`,
    [segments]
  );

  // 2. Full Analytical Parity Scope
  const optimizedScope = useQuackScope(
    transportOrders,
    (parent) => {
      const carrierEmissionCases = Object.entries(CARRIER_EMISSION_FACTORS)
        .map(([carrier, factor]) => `WHEN '${carrier}' THEN ${String(factor)}`)
        .join(' ');

      const carrierDelayCases = Object.entries(CARRIER_DELAY_FACTORS)
        .map(([carrier, factor]) => `WHEN '${carrier}' THEN ${String(factor)}`)
        .join(' ');

      return `
        WITH current_state AS (
            SELECT destination_department as numdept,
                SUM(actual_transport_cost) as cost,
                MODE(actual_carrier) as carrier,
                COUNT(*) as total_orders,
                SUM(COALESCE(distance_km, 0) * COALESCE(weight, 0) / 1000.0) as tkm
            FROM ${parent}
            WHERE destination_department IS NOT NULL
            GROUP BY 1
        ),
        carrier_stats AS (
            SELECT occ.numdept,
                occ.carrier,
                SUM(total_calculated_cost) as theoretical_cost,
                SUM(order_count) as covered_orders,
                (SUM(total_calculated_cost) / NULLIF(SUM(order_count), 0) * c.total_orders) as prorata_cost
            FROM org_order_carrier_costs occ
            JOIN current_state c ON occ.numdept = c.numdept
            GROUP BY 1, 2, c.total_orders
        ),
        best_options AS (
            SELECT s.numdept,
                s.carrier,
                s.theoretical_cost,
                s.covered_orders,
                s.prorata_cost
            FROM carrier_stats s
            JOIN current_state c ON s.numdept = c.numdept
            WHERE (s.covered_orders >= c.total_orders * ${threshold})
            QUALIFY ROW_NUMBER() OVER (PARTITION BY s.numdept ORDER BY s.theoretical_cost ASC) = 1
        ),
        prorata_fallback AS (
            SELECT s.numdept,
                s.carrier as prorata_carrier,
                s.prorata_cost as prorata_cost
            FROM carrier_stats s
            LEFT JOIN best_options b ON s.numdept = b.numdept
            WHERE b.numdept IS NULL AND s.covered_orders > 0
            QUALIFY ROW_NUMBER() OVER (PARTITION BY s.numdept ORDER BY s.prorata_cost ASC) = 1
        ),
        current_carriers AS (
            SELECT DISTINCT actual_carrier FROM ${parent}
        )
        SELECT 
            c.numdept::INT AS numdept,
            COALESCE(c.cost, 0)::INT AS current_cost,
            c.carrier::text AS current_carrier,
            b.prorata_cost::INT AS optimized_cost,
            b.carrier::TEXT AS optimized_carrier,
            pf.prorata_cost::INT AS prorata_fallback_cost,
            pf.prorata_carrier::TEXT AS prorata_fallback_carrier,
            (current_cost - COALESCE(optimized_cost, prorata_fallback_cost, current_cost))::INT AS savings_amount,
            
            COALESCE(c.tkm * (CASE c.carrier ${carrierEmissionCases} ELSE ${DEFAULT_EMISSION_FACTOR} END), 0)::DECIMAL(10, 3) AS current_co2,
            (c.tkm * (CASE COALESCE(b.carrier, pf.prorata_carrier, c.carrier) ${carrierEmissionCases} ELSE ${DEFAULT_EMISSION_FACTOR} END))::DECIMAL(10, 3) AS optimized_co2,
            
            (CASE c.carrier ${carrierDelayCases} ELSE ${DEFAULT_DELAY} END)::DECIMAL(10, 3) AS current_delay,
            (CASE COALESCE(b.carrier, pf.prorata_carrier, c.carrier) ${carrierDelayCases} ELSE ${DEFAULT_DELAY} END)::DECIMAL(10, 3) AS optimized_delay,
            
            COALESCE(b.covered_orders, 0)::INT AS covered_orders,
            c.total_orders::INT AS total_orders,
            
            -- Metric recalculation logic:
            CASE 
                WHEN COALESCE(b.carrier, pf.prorata_carrier, c.carrier) = c.carrier THEN 'reconduction'
                WHEN COALESCE(b.carrier, pf.prorata_carrier) IN (SELECT actual_carrier FROM current_carriers) THEN 'replacement'
                WHEN COALESCE(b.carrier, pf.prorata_carrier) IS NOT NULL THEN 'new'
                ELSE 'uncovered'
            END as allocation_type,
            
            CASE 
                WHEN b.carrier IS NOT NULL THEN 'covered'
                WHEN pf.prorata_carrier IS NOT NULL THEN 'prorata'
                ELSE 'uncovered'
            END as coverage_type
        FROM current_state c
        LEFT JOIN best_options b ON c.numdept = b.numdept
        LEFT JOIN prorata_fallback pf ON c.numdept = pf.numdept
    `;
    },
    [threshold, segments, transportOrders, carrierCosts]
  );

  // 3. Roll-up Metrics
  const metrics = useQuackMetric<{
    total_actual: number;
    total_optimized: number;
    total_co2_actual: number;
    total_co2_optimized: number;
    total_depts: number;
    covered_depts: number;
    total_orders: number;
    covered_orders: number;
    // New breakdown metrics
    reconduction_count: number;
    replacement_count: number;
    new_count: number;
    direct_spend: number;
    prorata_spend: number;
    uncovered_spend: number;
  }>(
    optimizedScope,
    (name) => `
        SELECT 
            SUM(current_cost) as total_actual,
            SUM(COALESCE(optimized_cost, prorata_fallback_cost, current_cost)) as total_optimized,
            SUM(current_co2) as total_co2_actual,
            SUM(optimized_co2) as total_co2_optimized,
            COUNT(*) as total_depts,
            COUNT(optimized_carrier) as covered_depts,
            SUM(total_orders) as total_orders,
            SUM(covered_orders) as covered_orders,
            -- Allocation Breakdown
            COUNT(*) FILTER (WHERE allocation_type = 'reconduction') as reconduction_count,
            COUNT(*) FILTER (WHERE allocation_type = 'replacement') as replacement_count,
            COUNT(*) FILTER (WHERE allocation_type = 'new') as new_count,
            -- Coverage Breakdown (Spend)
            SUM(current_cost) FILTER (WHERE coverage_type = 'covered') as direct_spend,
            SUM(current_cost) FILTER (WHERE coverage_type = 'prorata') as prorata_spend,
            SUM(current_cost) FILTER (WHERE coverage_type = 'uncovered') as uncovered_spend
        FROM ${name}
    `,
    []
  );

  // 4. Map Data Fetch (The "Iceberg Base")
  // We fetch ALL 95 departments' results to color the map.
  // In Quack, this is still fast because it's only 95 rows of aggregated data.
  const mapResults = useQuackResults<any>(
    optimizedScope,
    (name) => `SELECT numdept, optimized_carrier, current_carrier, savings_amount FROM ${name}`,
    []
  );
  const resultsMap = useMemo(() => {
    const m = new Map();
    (mapResults || []).forEach((r) => m.set(r.numdept, r));
    return m;
  }, [mapResults]);

  const savings = (metrics?.total_actual || 0) - (metrics?.total_optimized || 0);
  const co2Reduction = (metrics?.total_co2_actual || 0) - (metrics?.total_co2_optimized || 0);

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <div style={styles.tag('#3b82f622', '#3b82f6')}>OPTIMIZER V2 + QUACK MAP</div>
        <h1 style={styles.title}>Transport Optimization Dashboard</h1>
      </nav>

      <div style={styles.statsGrid}>
        <KPICard
          label="Projected Savings"
          value={savings}
          format={formatCurrency}
          color="#f59e0b"
          subValue={displayPercentage(savings / (metrics?.total_actual || 1), true)}
        />
        <KPICard
          label="CO2 Reduction"
          value={co2Reduction / 1000}
          unit="t"
          color="#10b981"
          subValue={displayPercentage(co2Reduction / (metrics?.total_co2_actual || 1), true)}
        />
        <KPICard
          label="Optimized Spend"
          value={metrics?.total_optimized || 0}
          format={formatCurrency}
          color="#3b82f6"
        />
        <KPICard
          label="Coverage"
          value={metrics?.covered_orders || 0}
          unit={`/ ${metrics?.total_orders || 0}`}
          color="#8b5cf6"
          subValue={`${(((metrics?.covered_orders || 0) / (metrics?.total_orders || 1)) * 100).toFixed(0)}%`}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '20px',
          marginBottom: '20px',
        }}
      >
        <div style={styles.allocationCard('#10b981')}>
          <div style={styles.allocationLabel}>RECONDUCTION</div>
          <div style={styles.allocationValue}>
            {displayPercentage((metrics?.reconduction_count || 0) / (metrics?.total_depts || 1))}
          </div>
        </div>
        <div style={styles.allocationCard('#3b82f6')}>
          <div style={styles.allocationLabel}>REPLACEMENT</div>
          <div style={styles.allocationValue}>
            {displayPercentage((metrics?.replacement_count || 0) / (metrics?.total_depts || 1))}
          </div>
        </div>
        <div style={styles.allocationCard('#f59e0b')}>
          <div style={styles.allocationLabel}>NEW</div>
          <div style={styles.allocationValue}>
            {displayPercentage((metrics?.new_count || 0) / (metrics?.total_depts || 1))}
          </div>
        </div>
      </div>

      <div style={styles.coverageBarContainer}>
        <div
          style={{
            fontSize: '10px',
            color: '#6e6e77',
            marginBottom: '12px',
            fontWeight: 600,
            letterSpacing: '0.5px',
          }}
        >
          BUDGET COVERAGE
        </div>
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressBar,
              width: `${((metrics?.direct_spend || 0) / (metrics?.total_actual || 1)) * 100}%`,
              background: '#10b981',
            }}
          />
          <div
            style={{
              ...styles.progressBar,
              width: `${((metrics?.prorata_spend || 0) / (metrics?.total_actual || 1)) * 100}%`,
              background: '#3b82f6',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
          <div style={styles.legendItem('#10b981')}>
            <div style={styles.legendDot('#10b981')} />
            Direct {displayPercentage((metrics?.direct_spend || 0) / (metrics?.total_actual || 1))}
          </div>
          <div style={styles.legendItem('#3b82f6')}>
            <div style={styles.legendDot('#3b82f6')} />
            Prorata{' '}
            {displayPercentage((metrics?.prorata_spend || 0) / (metrics?.total_actual || 1))}
          </div>
          <div style={styles.legendItem('#2a2a2e')}>
            <div style={styles.legendDot('#2a2a2e')} />
            Uncovered{' '}
            {displayPercentage((metrics?.uncovered_spend || 0) / (metrics?.total_actual || 1))}
          </div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.panel}>
          <div
            style={{
              ...styles.tag('#3b82f622', '#3b82f6'),
              position: 'absolute',
              top: 20,
              right: 20,
            }}
          >
            GEOGRAPHIC COVERAGE
          </div>
          <div style={styles.label}>Carrier Optimization Map</div>
          <div style={styles.mapContainer}>
            <svg viewBox="0 0 600 600" style={{ width: '100%', height: '100%' }}>
              {geoData.features.map((f: any) => {
                const code = f.properties.code;
                const numdept = code.includes('2A') || code.includes('2B') ? 20 : Number(code);
                const res = resultsMap.get(numdept);
                const fill = res?.optimized_carrier
                  ? getCarrierColor(res.optimized_carrier)
                  : '#1a1a1e';

                // Render paths
                const d = f.geometry.coordinates
                  .map((poly: any) => {
                    const ring = f.geometry.type === 'Polygon' ? poly : poly[0];
                    return (
                      'M' +
                      ring
                        .map((pt: any) => {
                          const { x, y } = project(pt[0], pt[1]);
                          return `${x},${y}`;
                        })
                        .join('L') +
                      'Z'
                    );
                  })
                  .join(' ');

                return (
                  <path
                    key={code}
                    d={d}
                    fill={fill}
                    stroke="#000"
                    strokeWidth="0.5"
                    style={{ transition: 'fill 0.3s' }}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={styles.panel}>
            <div style={styles.label}>Optimization Threshold: {(threshold * 100).toFixed(0)}%</div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.04"
              value={threshold}
              onChange={(e) => setState({ coverage: Number(e.target.value) })}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#3b82f6' }}
            />
            <div
              style={{
                marginTop: '20px',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {OPTIMIZE_SEGMENTS.map((s) => {
                const active = segments.includes(s.id);
                return (
                  <button
                    key={s.id}
                    style={styles.segmentBtn(active)}
                    onClick={() => {
                      const next = active
                        ? segments.filter((id) => id !== s.id)
                        : [...segments, s.id];
                      setState({ segments: next });
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
              <button
                onClick={() => setState({ segments: OPTIMIZE_SEGMENTS.map((s) => s.id) })}
                style={{
                  ...styles.segmentBtn(false),
                  marginLeft: 'auto',
                  fontSize: '11px',
                  textDecoration: 'underline',
                }}
              >
                Reset All
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#6e6e77', marginTop: '10px' }}>
              Adjusting this slider triggers a full re-calculation of 1,000,000 orders against all
              localized carrier grids in DuckDB-Wasm.
            </p>
          </div>

          <div style={styles.panel}>
            <div style={styles.label}>Top Optimization Opportunities</div>
            {(mapResults || [])
              .filter((r) => r.savings_amount > 0)
              .sort((a, b) => b.savings_amount - a.savings_amount)
              .slice(0, 6)
              .map((r) => (
                <div
                  key={r.numdept}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: '1px solid #1f1f23',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>Dept {r.numdept}</div>
                    <div style={{ fontSize: '11px', color: '#6e6e77' }}>{r.optimized_carrier}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#f59e0b' }}>
                      +€{formatNumber(r.savings_amount)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#10b981' }}>Optimized</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ label, value, unit, color, format, subValue }: any) => {
  const formattedValue = format
    ? format(value)
    : value.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
  return (
    <div style={styles.kpiCard(color)}>
      <div style={styles.label}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
        <div style={{ ...styles.value, color: value < 0 ? '#ef4444' : '#fff' }}>
          {formattedValue}
          {unit && (
            <span style={{ fontSize: '11px', marginLeft: '2px', color: '#6e6e77' }}>{unit}</span>
          )}
        </div>
        {subValue && <div style={styles.subtext(color)}>{subValue}</div>}
      </div>
    </div>
  );
};

function formatNumber(n: number) {
  if (n > 1000000) return (n / 1000000).toFixed(2) + 'M';
  if (n > 1000) return (n / 1000).toFixed(1) + 'k';
  return Math.round(n).toLocaleString();
}
