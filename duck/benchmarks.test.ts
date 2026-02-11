
import { test, expect, beforeAll, afterAll } from 'bun:test';
import { initCoordinator } from './duckdb-wasm-node';
import { DataCoordinator, type CacheEntry } from '../react/DataCoordinator';

let close: () => Promise<void>;
let coordinator: DataCoordinator;

beforeAll(async () => {
    const res = await initCoordinator(false); // Make debug true if we want logs
    coordinator = res.coordinator;
    close = res.close;
    
    // Warmup
    await coordinator.query("SELECT 1");
});

afterAll(async () => {
    // await close(); // Logic not yet fully implemented in initCoordinator, but process exit handles it
});

test('Benchmark: 100 Nested Fragments vs 100 Nested Views', async () => {
    const DEPTH = 100;
    
    // --- SCENARIO A: VIEWS ---
    console.log(`--- Benchmarking ${DEPTH} Nested Views ---`);
    const viewStart = performance.now();
    
    let lastViewId = await (async () => {
        // Step 1: Base Table
        const base = coordinator.registerView('base_table', 'SELECT * FROM duckdb_settings()');
        let currentDep = base as CacheEntry<any>;
        
        // Step 2: Chain of 100 Views
        for (let i = 0; i < DEPTH; i++) {
             const resolvedDep = currentDep.type === 'view' ? currentDep.id : `read_parquet('${currentDep.path}')`;
             
             currentDep = coordinator.registerView(
                 `view_${i}`, 
                 `SELECT * FROM ${resolvedDep}`, 
                 [currentDep.id],
                 'view'
             );
        }
        return currentDep;
    })();
    
    const viewSetupTime = performance.now() - viewStart;
    console.log(`Setup Time (Views): ${viewSetupTime.toFixed(2)}ms`);

    // Step 3: Resolution & Execution
    const viewExecStart = performance.now();
    const viewSqls = coordinator.resolveViewDependencies([lastViewId.id]);
    
    const finalViewQuery = `SELECT count(*) FROM ${lastViewId.id}`; 
    const viewFullSql = viewSqls.join('\n') + '\n' + finalViewQuery;
    
    await coordinator.query(viewFullSql);
    const viewExecTime = performance.now() - viewExecStart;
    console.log(`Execution Time (Views): ${viewExecTime.toFixed(2)}ms`);
    
    
    // --- SCENARIO B: FRAGMENTS ---
    console.log(`--- Benchmarking ${DEPTH} Nested Fragments ---`);
    
    const fragStart = performance.now();
    
    let lastFragId = await (async () => {
        const base = coordinator.registerView('base_table_f', 'SELECT * FROM duckdb_settings()');
        let currentDep = base as CacheEntry<any>;

        // Step 2: Chain of 100 Fragments
        for (let i = 0; i < DEPTH; i++) {
             let resolvedSlugForQuery: string;
             if (currentDep.type === 'fragment') {
                 resolvedSlugForQuery = `(${currentDep.query})`; 
             } else {
                 resolvedSlugForQuery = currentDep.type === 'view' ? currentDep.id : `read_parquet('${currentDep.path}')`;
             }
             
             currentDep = coordinator.registerView(
                 `frag_${i}`, 
                 `SELECT * FROM ${resolvedSlugForQuery}`, 
                 [currentDep.id],
                 'fragment'
             );
        }
        return currentDep;
    })();

    const fragSetupTime = performance.now() - fragStart;
    console.log(`Setup Time (Fragments): ${fragSetupTime.toFixed(2)}ms`);

    // Step 3: Resolution & Execution
    const fragExecStart = performance.now();
    
    const fragContextSqls = coordinator.resolveViewDependencies([lastFragId.id]);
    // fragments don't usually produce overhead views if fully inlined, but if they depend on views they might
    
    const finalFragQuery = `SELECT count(*) FROM (${lastFragId.query})`; 
    
    const fragFullSql = fragContextSqls.join('\n') + '\n' + finalFragQuery;
    
    await coordinator.query(fragFullSql);
    
    const fragExecTime = performance.now() - fragExecStart;
    console.log(`Execution Time (Fragments): ${fragExecTime.toFixed(2)}ms`);
    
});
