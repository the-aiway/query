import { initDuckDB } from '../../duckdb-wasm-init';

async function setup() {
  console.log('Generating 1,000,000 rows of synthetic data...');
  const { conn } = await initDuckDB();

  // Create a large synthetic table
  await conn.query(`
    CREATE TABLE big_data AS 
    SELECT 
        (random() * 1000000)::INT as id,
        (CASE WHEN random() > 0.5 THEN 'EMEA' 
              WHEN random() > 0.2 THEN 'APAC' 
              ELSE 'AMER' END) as region,
        (random() * 1000)::DOUBLE as revenue,
        range as timestamp
    FROM range(1000000)
  `);

  console.log('Exporting to parquet...');
  // Note: in WASM we usually register buffers, but here we can just keep it in the DB
  // for the demo, or export it to a buffer if we want to simulate remote load.
  // Let's keep it as an internal table 'big_data' for maximum performance.

  const count = await conn.query('SELECT count(*) FROM big_data');
  console.log('Data ready.');
  process.exit(0);
}

setup();
