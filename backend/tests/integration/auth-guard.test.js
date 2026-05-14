const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const db = require('../../src/config/db');

const TEST_DOMAIN = '@test-be07.example.com';
const userA = { email: `be07-a${TEST_DOMAIN}`, password: 'pw-a-9999', name: 'Guard유저A' };
const userB = { email: `be07-b${TEST_DOMAIN}`, password: 'pw-b-9999', name: 'Guard유저B' };

let tokenA, tokenB, todoIdA, defaultCategoryId;

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

function expiredToken() {
  const secret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
  return jwt.sign({ user_id: 9999, email: 'expired@example.com' }, secret, { expiresIn: -1 });
}

function wrongSecretToken() {
  return jwt.sign({ user_id: 9999, email: 'fake@example.com' }, 'wrong-secret', { expiresIn: '1h' });
}

const PROTECTED_ROUTES = [
  { method: 'get',    path: '/api/categories' },
  { method: 'get',    path: '/api/todos' },
  { method: 'post',   path: '/api/todos' },
];

beforeAll(async () => {
  for (const user of [userA, userB]) {
    await request(app).post('/api/auth/register').send(user);
  }

  const loginA = await request(app).post('/api/auth/login').send({ email: userA.email, password: userA.password });
  tokenA = loginA.body.access_token;

  const loginB = await request(app).post('/api/auth/login').send({ email: userB.email, password: userB.password });
  tokenB = loginB.body.access_token;

  const catRes = await request(app).get('/api/categories').set(auth(tokenA));
  defaultCategoryId = catRes.body.data.find((c) => c.is_default).id;

  const todoRes = await request(app).post('/api/todos')
    .set(auth(tokenA))
    .send({ title: 'Guard테스트 할일', category_id: defaultCategoryId });
  todoIdA = todoRes.body.id;
});

afterAll(async () => {
  await db.query(`DELETE FROM users WHERE email LIKE '%${TEST_DOMAIN}'`);
  await db.end();
});

// ── 토큰 없음 ────────────────────────────────────────────────────────────────

describe('인증 토큰 없음 → 401', () => {
  for (const { method, path } of PROTECTED_ROUTES) {
    it(`${method.toUpperCase()} ${path}`, async () => {
      const res = await request(app)[method](path);
      expect(res.status).toBe(401);
    });
  }

  it('GET /api/todos/:id (토큰 없음)', async () => {
    const res = await request(app).get(`/api/todos/${todoIdA}`);
    expect(res.status).toBe(401);
  });

  it('PUT /api/todos/:id (토큰 없음)', async () => {
    const res = await request(app).put(`/api/todos/${todoIdA}`)
      .send({ title: 'T', category_id: defaultCategoryId });
    expect(res.status).toBe(401);
  });

  it('PATCH /api/todos/:id/complete (토큰 없음)', async () => {
    const res = await request(app).patch(`/api/todos/${todoIdA}/complete`);
    expect(res.status).toBe(401);
  });

  it('DELETE /api/todos/:id (토큰 없음)', async () => {
    const res = await request(app).delete(`/api/todos/${todoIdA}`);
    expect(res.status).toBe(401);
  });
});

// ── 잘못된 토큰 ──────────────────────────────────────────────────────────────

describe('유효하지 않은 토큰 → 401', () => {
  it('형식이 잘못된 토큰 (random string)', async () => {
    const res = await request(app).get('/api/todos').set(auth('not.a.valid.jwt'));
    expect(res.status).toBe(401);
  });

  it('서명 키가 다른 토큰', async () => {
    const res = await request(app).get('/api/todos').set(auth(wrongSecretToken()));
    expect(res.status).toBe(401);
  });

  it('Bearer 접두어 없는 토큰', async () => {
    const res = await request(app).get('/api/todos')
      .set('Authorization', tokenA);
    expect(res.status).toBe(401);
  });

  it('Authorization 헤더 없음', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(401);
  });
});

// ── 만료된 토큰 ──────────────────────────────────────────────────────────────

describe('만료된 토큰 → 401', () => {
  it('만료된 JWT로 카테고리 조회', async () => {
    const res = await request(app).get('/api/categories').set(auth(expiredToken()));
    expect(res.status).toBe(401);
  });

  it('만료된 JWT로 할일 조회', async () => {
    const res = await request(app).get('/api/todos').set(auth(expiredToken()));
    expect(res.status).toBe(401);
  });
});

// ── 다른 사용자 리소스 접근 ──────────────────────────────────────────────────

describe('다른 사용자 리소스 접근 → 403', () => {
  it('B가 A의 할일 단건 조회 시 403', async () => {
    const res = await request(app).get(`/api/todos/${todoIdA}`).set(auth(tokenB));
    expect(res.status).toBe(403);
  });

  it('B가 A의 할일 수정 시 403', async () => {
    const res = await request(app).put(`/api/todos/${todoIdA}`)
      .set(auth(tokenB))
      .send({ title: '탈취 수정', category_id: defaultCategoryId });
    expect(res.status).toBe(403);
  });

  it('B가 A의 할일 완료 토글 시 403', async () => {
    const res = await request(app).patch(`/api/todos/${todoIdA}/complete`).set(auth(tokenB));
    expect(res.status).toBe(403);
  });

  it('B가 A의 할일 삭제 시 403', async () => {
    const res = await request(app).delete(`/api/todos/${todoIdA}`).set(auth(tokenB));
    expect(res.status).toBe(403);
  });
});

// ── 유효한 토큰으로 정상 접근 ────────────────────────────────────────────────

describe('유효한 토큰으로 정상 접근 → 2xx', () => {
  it('A의 토큰으로 A의 할일 조회 → 200', async () => {
    const res = await request(app).get(`/api/todos/${todoIdA}`).set(auth(tokenA));
    expect(res.status).toBe(200);
  });

  it('A의 토큰으로 카테고리 목록 조회 → 200', async () => {
    const res = await request(app).get('/api/categories').set(auth(tokenA));
    expect(res.status).toBe(200);
  });
});
