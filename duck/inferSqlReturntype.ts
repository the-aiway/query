// --- CONFIGURATION & ENUMS ---

type Whitespace = ' ' | '\n' | '\t' | '\r';
type AsKeyword = 'AS' | 'as';
type FromKeyword = 'FROM' | 'from';

type CleanChar = '_' | '-' | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

type NumericSqlFunction = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'row_number' | 'rank';

type CastMap = {
  int: number;
  integer: number;
  bigint: bigint;
  smallint: number;
  tinyint: number;
  double: number;
  float: number;
  decimal: number;
  boolean: boolean;
  bool: boolean;
  varchar: string;
  text: string;
  uuid: string;
  date: string;
  timestamp: string;
  timestamptz: string;
  json: unknown;
};

// --- UTILITIES ---

export type Materialize<T> = {
  [K in keyof T]: T[K];
} & {};

type TrimLeft<S extends string> = S extends `${Whitespace}${infer T}` ? TrimLeft<T> : S;

type TrimRight<S extends string> = S extends `${infer T}${Whitespace}` ? TrimRight<T> : S;

type StripBlockComments<S extends string> = S extends `${infer Pre}/*${string}*/${infer Post}` ? StripBlockComments<`${Pre}${Post}`> : S;

type StripLineComments<S extends string> = S extends `${infer Pre}--${infer Rest}` ? (Rest extends `${string}\n${infer Post}` ? StripLineComments<`${Pre}\n${Post}`> : Pre) : S;

type StripComments<S extends string> = StripLineComments<StripBlockComments<S>>;

export type Trim<S extends string> = TrimLeft<TrimRight<StripComments<S>>>;

type CountOpen<S extends string, Acc extends unknown[] = []> = S extends `${string}(${infer Tail}` ? CountOpen<Tail, [...Acc, unknown]> : Acc;

type FindMainSelect<S extends string, Depth extends unknown[] = []> = S extends `${infer Pre})${infer Post}`
  ? CountOpen<Pre> extends infer NewOpens extends unknown[]
    ? [...Depth, ...NewOpens] extends [unknown, ...infer NewDepth]
      ? NewDepth['length'] extends 0
        ? TrimLeft<Post> extends `SELECT${infer Rest}`
          ? `SELECT${Rest}`
          : FindMainSelect<Post, NewDepth>
        : FindMainSelect<Post, NewDepth>
      : never
    : never
  : never;

export type StripWith<S extends string> =
  Trim<S> extends `WITH ${infer Body}`
    ? FindMainSelect<Body> extends never
      ? Trim<S> // Fallback
      : FindMainSelect<Body>
    : Trim<S>;

type StripFrom<S extends string> = S extends `${infer Fields}${Whitespace}${FromKeyword} ${string}` ? Fields : S;

export type ExtractSelect<S extends string> = StripWith<S> extends `SELECT${infer Rest}` ? StripFrom<Trim<Rest>> : StripWith<S> extends `${FromKeyword}${Whitespace}${string}SELECT${infer Rest}` ? Trim<Rest> : never;

type IsBalanced<S extends string, Depth extends unknown[] = []> = S extends `${infer PreOpen}(${infer PostOpen}`
  ? S extends `${infer PreClose})${infer PostClose}`
    ? PreOpen extends `${PreClose}${string}`
      ? Depth extends [unknown, ...infer NewDepth]
        ? IsBalanced<PostClose, NewDepth>
        : false
      : IsBalanced<PostOpen, [...Depth, unknown]>
    : IsBalanced<PostOpen, [...Depth, unknown]>
  : S extends `${string})${infer PostClose}`
    ? Depth extends [unknown, ...infer NewDepth]
      ? IsBalanced<PostClose, NewDepth>
      : false
    : Depth['length'] extends 0
      ? true
      : false;

type EndsWithAsAlias<S extends string> = Trim<S> extends `${string} ${AsKeyword} ${infer Alias}` ? IsClean<Alias> : false;

type SplitNewline<S extends string, Current extends string = ''> = S extends `${infer Head}\n${infer Tail}`
  ? IsBalanced<`${Current}${Head}`> extends true
    ? EndsWithAsAlias<`${Current}${Head}`> extends true
      ? [Trim<`${Current}${Head}`>, ...SplitNewline<Tail, ''>]
      : SplitNewline<Tail, `${Current}${Head}\n`>
    : SplitNewline<Tail, `${Current}${Head}\n`>
  : [Trim<`${Current}${S}`>];

type MapSplitNewline<T extends unknown[]> = T extends [infer Head, ...infer Tail] ? (Head extends string ? (Tail extends string[] ? [...SplitNewline<Head>, ...MapSplitNewline<Tail>] : [...SplitNewline<Head>]) : MapSplitNewline<Tail>) : [];

export type SplitComma<S extends string, Current extends string = ''> = S extends `${infer Head},${infer Tail}` ? (IsBalanced<`${Current}${Head}`> extends true ? [Trim<`${Current}${Head}`>, ...SplitComma<Tail, ''>] : SplitComma<Tail, `${Current}${Head},`>) : [Trim<`${Current}${S}`>];

type SplitInferredFields<S extends string> = MapSplitNewline<SplitComma<S>>;

type StripParens<S extends string> = S extends `${infer T}(${string})` ? T : S;

type ResolveCast<T extends string> = Lowercase<StripParens<T>> extends keyof CastMap ? CastMap[Lowercase<StripParens<T>>] : unknown;

type GetColName<S extends string> = S extends `${string}(${string}` ? S : S extends `${string}.${infer Rest}` ? GetColName<Rest> : S;

type IsClean<S extends string> = S extends '' ? true : S extends `${infer C}${infer Rest}` ? (Lowercase<C> extends Uppercase<C> ? (C extends CleanChar ? IsClean<Rest> : false) : IsClean<Rest>) : true;

// We revert to explicit checks because Union inference in template literals is unstable for recursion
type ExtractAliasName<S extends string, Current extends string = ''> = S extends `${infer Head} AS ${infer Tail}`
  ? IsBalanced<`${Current}${Head}`> extends true
    ? Trim<Tail>
    : ExtractAliasName<Tail, `${Current}${Head} AS `>
  : S extends `${infer Head} as ${infer Tail}`
    ? IsBalanced<`${Current}${Head}`> extends true
      ? Trim<Tail>
      : ExtractAliasName<Tail, `${Current}${Head} as `>
    : never;
type SplitAlias<S extends string, Current extends string = ''> = S extends `${infer Head} AS ${infer Tail}`
  ? IsBalanced<`${Current}${Head}`> extends true
    ? [Trim<`${Current}${Head}`>, Trim<Tail>]
    : SplitAlias<Tail, `${Current}${Head} AS `>
  : S extends `${infer Head} as ${infer Tail}`
    ? IsBalanced<`${Current}${Head}`> extends true
      ? [Trim<`${Current}${Head}`>, Trim<Tail>]
      : SplitAlias<Tail, `${Current}${Head} as `>
    : never;

type ResolveImplicitType<T extends string> = Lowercase<T> extends `${NumericSqlFunction}(${string}` ? number : T extends `${number}` ? number : T extends `'${string}'` ? string : unknown;

export type ParseField<S extends string> =
  // CASE 1 & 2: Has Cast "::"
  S extends `${infer Expr}::${infer Rest}`
    ? // Check if there is an AS alias after the cast
      Rest extends `${infer CastType} AS ${infer Alias}`
      ? { name: Trim<Alias>; type: ResolveCast<Trim<CastType>> }
      : Rest extends `${infer CastType} as ${infer Alias}`
        ? { name: Trim<Alias>; type: ResolveCast<Trim<CastType>> }
        : // No alias, just cast. The name is the identifier part of Expr.
          // We use GetColName to handle "db.field" -> "field".
          IsClean<GetColName<Trim<Expr>>> extends true
          ? { name: GetColName<Trim<Expr>>; type: ResolveCast<Trim<Rest>> }
          : { name: never; type: unknown }
    : ExtractAliasName<S> extends never
      ? // CASE 4: Bare identifier
        IsClean<GetColName<Trim<S>>> extends true
        ? { name: GetColName<Trim<S>>; type: unknown }
        : { name: never; type: unknown }
      : // CASE 3: No Cast, but has AS alias
        SplitAlias<S> extends [infer Expr extends string, infer Alias]
        ? { name: Alias; type: ResolveImplicitType<Expr> }
        : { name: ExtractAliasName<S>; type: unknown };

type FieldsToObject<F extends string[]> = {
  [K in F[number] as ParseField<K>['name']]: ParseField<K>['type'];
};

export type InferSql<T extends string> =
  ExtractSelect<T> extends infer SelectPart
    ? [SelectPart] extends [never]
      ? Record<string, unknown>[]
      : SelectPart extends string
        ? SplitInferredFields<SelectPart> extends infer Fields
          ? Fields extends string[]
            ? FieldsToObject<Fields>[]
            : Record<string, unknown>[]
          : Record<string, unknown>[]
        : Record<string, unknown>[]
    : Record<string, unknown>[];

export type InferSQL<T extends string, TOverride = unknown> = unknown extends TOverride ? Materialize<InferSql<T>[number] & Record<string, unknown>>[] : TOverride extends unknown[] ? TOverride : Materialize<TOverride>[];

export type InferSQLStrict<T extends string, TOverride = unknown> = unknown extends TOverride ? Materialize<InferSql<T>[number]>[] : TOverride extends unknown[] ? TOverride : Materialize<TOverride>[];

export declare function sql<TOverride = unknown, T extends string = string>(query: T): InferSQL<T, TOverride>;

export declare function sqlStrict<TOverride = unknown, T extends string = string>(query: T): InferSQLStrict<T, TOverride>;

export function typeCheck() {
  const test3 = sqlStrict('WITH cte AS (SELECT 1) SELECT total::DECIMAL FROM orders');
  test3 satisfies {
    total: number;
  }[];

  const test4 = sqlStrict(`
  SELECT
    a::BOOL AS isActive,
    b::INTEGER
  FROM t
`);
  test4 satisfies { isActive: boolean; b: number }[];

  const test5 = sqlStrict(` SELECT x::int,  y::InTeGeR`);
  test5 satisfies {
    x: number;
    y: number;
  }[];

  const test6 = sqlStrict(`
SELECT x, y
FROM zz
`);
  test6 satisfies {
    x: unknown;
    y: unknown;
  }[];

  const test7 = sqlStrict(`SELECT a::int, b::boolean, c::timestamp FROM t`);
  test7 satisfies {
    a: number;
    b: boolean;
    c: string;
  }[];

  const test8 = sqlStrict(`SELECT first_name AS firstName, age AS userAge FROM users`);
  test8 satisfies {
    firstName: unknown;
    userAge: unknown;
  }[];

  const test9 = sqlStrict(`SELECT id::bigint AS userId, val::double AS score FROM scores`);
  test9 satisfies {
    userId: bigint;
    score: number;
  }[];

  const test10 = sqlStrict(`
  SELECT
    x::integer
    ,
    y::text
  FROM t
`);
  test10 satisfies { x: number; y: string }[];

  const test11 = sqlStrict(`SELECT 1::InTeGeR AS One, 'foo'::VaRcHaR AS Bar`);
  test11 satisfies {
    One: number;
    Bar: string;
  }[];

  const test12 = sqlStrict(`SELECT data::blob AS rawData FROM t`);
  test12 satisfies { rawData: unknown }[];

  const test13 = sqlStrict(`SELECT info::json, created_at::date, uid::uuid FROM t`);
  test13 satisfies {
    info: unknown;
    created_at: string;
    uid: string;
  }[];

  const test14 = sqlStrict(`SELECT 1::int AS val`);
  test14 satisfies { val: number }[];

  const test15 = sqlStrict(`SELECT
val::decimal`);
  test15 satisfies { val: number }[];

  const test16 = sqlStrict(`SELECT count(*)::int AS total FROM t`);
  test16 satisfies {
    total: number;
  }[];

  const test17 = sqlStrict(`SELECT a::tinyint, b::smallint, c::float FROM t`);
  test17 satisfies {
    a: number;
    b: number;
    c: number;
  }[];

  const test18 = sqlStrict(`SELECT ad :: inqdssqt, b :: text FROM t`);
  test18 satisfies {
    ad: unknown;
    b: string;
  }[];

  const test19 = sqlStrict(`
  WITH cte1 AS (SELECT 1), cte2 AS (SELECT 2)
  SELECT val::int FROM cte2
`);
  test19 satisfies { val: number }[];

  const test20 = sqlStrict(`SELECT NULL::int AS nothing`);
  test20 satisfies {
    nothing: number;
  }[];

  const test21 = sqlStrict(`SELECT 'fixed'::text AS status`);
  test21 satisfies {
    status: string;
  }[];

  const test22 = sqlStrict(`SELECT now::timestamptz AS currentTime`);
  test22 satisfies {
    currentTime: string;
  }[];

  const test23 = sqlStrict(`SELECT 1::bool AS isTrue`);
  test23 satisfies {
    isTrue: boolean;
  }[];

  const test24 = sqlStrict(`SELECT val::int    AS    result FROM t`);
  test24 satisfies {
    result: number;
  }[];

  const test25 = sqlStrict(`SELECT val
  ::
  int AS num FROM t`);
  test25 satisfies {
    num: number;
  }[];

  const test26 = sqlStrict(`SELECT (a + b)::int AS sumVal FROM t`);
  test26 satisfies {
    sumVal: number;
  }[];

  const test27 = sqlStrict(`SELECT db.field FROM t`);
  test27 satisfies {
    field: unknown;
  }[];

  const test28 = sqlStrict(`
  WITH cte1 AS (
    SELECT
    toto,
    tata
  ), cte2 AS (
    SELECT
  toto: 123,
    tata as xxx
  ) 
  SELECT val::int, lol FROM cte2
`);
  test28 satisfies { val: number; lol: unknown }[];

  const test29 = sqlStrict(`
WITH cte AS (
  select tt from zz
) SELECT TOTO AS XXX,
ccc::DOUBLE
FROM cte
`);
  test29 satisfies { ccc: number }[];

  const test30 = sqlStrict(`
WITH cte AS (
  select tt from zz
)
SELECT TOTO AS XXX,
ccc::DOUBLE
FROM cte
`);
  test30 satisfies { ccc: number }[];

  const test31 = sqlStrict(`SELECT * from toto `);
  // @ts-expect-error: This is a valid query
  test31 satisfies { '*': unknown }[];

  const test32 = sqlStrict(`SELECT oop::TEXT from toto `);
  test32 satisfies { oop: string }[];

  const test33 = sqlStrict(
    `WITH CTE AS (
    SELECT TOTO::INT, tata, my_table.ezzzzzzz FROM my_table WHERE whatever JOIN toto ON toto.id = my_table.id
  )
  SELECT ee, mmm FROM CTE
  `
  );

  test33 satisfies { ee: unknown; mmm: unknown }[];

  const test34 = sqlStrict(
    `WITH CTE AS (
    SELECT WRONG::INT,input
  ) SELECT ee, mmm FROM CTE
  `
  );
  test34 satisfies { ee: unknown; mmm: unknown }[];

  const test35 = sqlStrict(
    `WITH CTE AS (
SELECT WRONG::INT,input
  ) SELECT ee, mmm FROM CTE
  `
  );
  test35 satisfies { ee: unknown; mmm: unknown }[];

  const test36 = sqlStrict(`--sql_strict
SELECT v1, v2
`);
  test36 satisfies { v1: unknown; v2: unknown }[];

  const test37 = sqlStrict(`/* block
comment */
SELECT 1::int AS one
`);
  test37 satisfies { one: number }[];

  const test38 = sqlStrict(`
/* block */
-- line
SELECT 1::int AS one -- tail comment
`);
  test38 satisfies { one: number }[];

  const test39 = sqlStrict<{ toto: 123; xxx: unknown; cccc: unknown }>(`
SELECT xxx, cccc
`);
  test39 satisfies { toto: number; xxx: unknown; cccc: unknown }[];

  const test40 = sqlStrict(`
    SELECT
      COALESCE(c.cost, 0) as current_cost,
      COALESCE(b.theoretical_cost, c.cost, 0) as optimized_cost
    FROM t
  `);
  test40 satisfies { current_cost: unknown; optimized_cost: unknown }[];

  const test41 = sqlStrict(`SELECT MONTH(transport_date) as zz`);

  test41 satisfies { zz: unknown }[];

  const test42 = sqlStrict(`SELECT
      CAST(DAYOFWEEK(transport_date) AS INT) as day_number,
      CAST(ROUND(SUM(COALESCE(actual_transport_cost, 0) + COALESCE(fuel_transport_cost, 0) + COALESCE(extra_cost, 0)), 0) AS DOUBLE) as expense`);

  test42 satisfies { day_number: unknown; expense: unknown }[];

  const test43 = sqlStrict<{ forced: boolean }>(`SELECT 1 as ignored`);
  test43 satisfies { forced: boolean }[];
  // @ts-expect-error: ignored should not be present in the type because we strictly override
  test43 satisfies { ignored: boolean }[];

  // When providing a generic, T defaults to string, so inference is lost
  const test44 = sql<{ extra: string }>(`SELECT 1::int as val`);
  test44 satisfies { extra: string }[];

  const test45 = sql<{ extra: string }, 'SELECT 1::int as val'>(`SELECT 1::int as val`);
  test45 satisfies { extra: string }[];

  const test46 = sqlStrict<{ whatever: true }>(`SELECT * FROM t`);
  test46 satisfies { whatever: true }[];

  // const test47 = sqlStrict<[string, number]>('SELECT 1');
  // test47 satisfies [string, number][];

  const test48 = sqlStrict<string>('SELECT 1');
  test48 satisfies string[];

  const test49 = sql<string>('SELECT A, B::int FROM TOTO');
  test49 satisfies string[];

  const test50 = sql<{ a: number }[]>('SELECT A, B::int FROM TOTO');
  test50 satisfies { a: number }[];
  const test51 = sql<{ a: number }>('SELECT A, B::int FROM TOTO');
  test51 satisfies { a: number }[];

  // const test52 = sql<[string, number]>('SELECT A, B::int FROM TOTO');
  // test52 satisfies [string, number][];

  // // @ts-expect-error
  // test52 satisfies { xx: unknown }[];

  const test53 = sql<bigint>('SELECT whatever FROM TOTO');

  test53 satisfies bigint[];

  const test54 = sqlStrict(`
    WITH overrides AS (
      () SELECT
    ) SELECT abel AS XX FROM overrides`);

  test54 satisfies { XX: unknown }[];

  const test55 = sqlStrict(`
    WITH overrides AS (
      () SEL_ECT
    ) SELECT abel AS XX FROM overrides`);

  test55 satisfies { XX: unknown }[];

  const test56 = sqlStrict(`
  SELECT
  count(*) as total,
  avg(rates * 4xx()) as avgx,
  SUM(cost) as total_cost
  from whatever`);

  test56 satisfies { total: number; avgx: number; total_cost: number }[];

  const test57 = sqlStrict(`SELECT savings_percent::DECIMAL(10, 2) AS savings_percent FROM ZZ`);

  test57 satisfies { savings_percent: number }[];

  const testRefacto = sqlStrict(`
    SELECT
      x
       FROM t
  `);
  testRefacto satisfies { x: unknown }[];

  const testNewFeature = sqlStrict("SELECT 1 as id, 'toto' as name");
  testNewFeature satisfies { id: number; name: string }[];

  const testLiterals = sqlStrict("SELECT 123 as num, 'hello' as str, 45.6 as float_val");
  testLiterals satisfies { num: number; str: string; float_val: number }[];

  const test58 = sqlStrict('FROM zz SELECT lol::INT as xxx');
  test58 satisfies { xxx: number }[];
  let t = { table_1: 'SQD' };
  const test59 = sqlStrict(`SELECT count(*)::int as total, lol::INT as xxx WHERE id=$id FROM ${t.table_1} xx`);
  test59 satisfies { total: number; xxx: number }[];

  return [];
}
