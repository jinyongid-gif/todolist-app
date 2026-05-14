/**
 * DB 연결 통합 테스트
 * 실제 todolist_dev PostgreSQL에 연결해 SELECT 1 검증
 */
const { Pool } = require('pg');

describe('DB 연결 통합 테스트', () => {
  let pool;

  beforeAll(() => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL ||
        'postgresql://postgres:postgres@localhost:5432/todolist_dev',
      max: 5,
      connectionTimeoutMillis: 3000,
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('SELECT 1 쿼리가 성공한다', async () => {
    const result = await pool.query('SELECT 1 AS result');
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].result).toBe(1);
  });

  it('DB 버전이 PostgreSQL 17이다', async () => {
    const result = await pool.query('SELECT version()');
    expect(result.rows[0].version).toMatch(/PostgreSQL 17/);
  });

  it('todolist_dev 데이터베이스에 연결된다', async () => {
    const result = await pool.query('SELECT current_database()');
    expect(result.rows[0].current_database).toBe('todolist_dev');
  });

  it('users, categories, todos 테이블이 존재한다', async () => {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    const tables = result.rows.map((r) => r.table_name);
    expect(tables).toContain('users');
    expect(tables).toContain('categories');
    expect(tables).toContain('todos');
  });

  it('Pool max 연결 수가 설정 값과 일치한다', () => {
    expect(pool.options.max).toBe(5);
  });

  it('잘못된 쿼리는 에러를 throw한다', async () => {
    await expect(pool.query('SELECT * FROM nonexistent_table_xyz')).rejects.toThrow();
  });
});
