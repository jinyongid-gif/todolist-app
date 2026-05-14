const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

const TEST_EMAIL_PREFIX = 'be05-test-';
const TEST_DOMAIN = '@test-be05.example.com';

function testEmail(suffix) {
  return `${TEST_EMAIL_PREFIX}${suffix}${TEST_DOMAIN}`;
}

let token;

beforeAll(async () => {
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ email: testEmail('user'), password: 'password123', name: 'BE05유저' });
  expect(reg.status).toBe(201);

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: testEmail('user'), password: 'password123' });
  expect(login.status).toBe(200);
  token = login.body.access_token;
});

afterAll(async () => {
  await db.query(`DELETE FROM users WHERE email LIKE '%${TEST_DOMAIN}'`);
  await db.end();
});

describe('GET /api/categories', () => {
  it('인증 토큰 없이 요청하면 401을 반환한다', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(401);
  });

  it('유효하지 않은 토큰이면 401을 반환한다', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });

  it('유효한 토큰으로 요청하면 200을 반환한다', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('응답 형식이 { data: [...] }이다', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('각 카테고리 항목에 id, name, is_default 필드가 있다', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const cat of res.body.data) {
      expect(cat.id).toBeDefined();
      expect(cat.name).toBeDefined();
      expect(typeof cat.is_default).toBe('boolean');
    }
  });

  it('기본 카테고리(is_default=true)가 포함된다', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);
    const defaults = res.body.data.filter((c) => c.is_default === true);
    expect(defaults.length).toBeGreaterThanOrEqual(4);
  });

  it('기본 카테고리 이름(업무·개인·쇼핑·기타)이 포함된다', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);
    const names = res.body.data.map((c) => c.name);
    expect(names).toContain('업무');
    expect(names).toContain('개인');
    expect(names).toContain('쇼핑');
    expect(names).toContain('기타');
  });

  it('기본 카테고리가 목록 상단에 먼저 나온다', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);
    const data = res.body.data;
    const firstNonDefault = data.findIndex((c) => !c.is_default);
    const lastDefault = data.map((c) => c.is_default).lastIndexOf(true);
    if (firstNonDefault !== -1) {
      expect(lastDefault).toBeLessThan(firstNonDefault);
    } else {
      expect(data.every((c) => c.is_default)).toBe(true);
    }
  });
});
