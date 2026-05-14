const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

const TEST_DOMAIN = '@test-be06.example.com';
const userA = { email: `be06-a${TEST_DOMAIN}`, password: 'pw-a-1234', name: 'A유저' };
const userB = { email: `be06-b${TEST_DOMAIN}`, password: 'pw-b-1234', name: 'B유저' };

let tokenA, tokenB, userAId, defaultCategoryId;

async function loginAs(user) {
  const res = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
  return res.body.access_token;
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

beforeAll(async () => {
  for (const user of [userA, userB]) {
    const reg = await request(app).post('/api/auth/register').send(user);
    if (user === userA) userAId = reg.body.id;
  }
  tokenA = await loginAs(userA);
  tokenB = await loginAs(userB);

  const catRes = await request(app).get('/api/categories').set(auth(tokenA));
  defaultCategoryId = catRes.body.data.find((c) => c.is_default).id;
});

afterAll(async () => {
  await db.query(`DELETE FROM users WHERE email LIKE '%${TEST_DOMAIN}'`);
  await db.end();
});

async function createTodo(token, overrides = {}) {
  return request(app)
    .post('/api/todos')
    .set(auth(token))
    .send({ title: '기본 할일', category_id: defaultCategoryId, ...overrides });
}

// ── 인증 ─────────────────────────────────────────────────────────────────────

describe('인증 없는 요청', () => {
  it('GET /api/todos → 401', async () => {
    expect((await request(app).get('/api/todos')).status).toBe(401);
  });
  it('POST /api/todos → 401', async () => {
    expect((await request(app).post('/api/todos').send({ title: 'T', category_id: 1 })).status).toBe(401);
  });
});

// ── 목록 조회 ────────────────────────────────────────────────────────────────

describe('GET /api/todos', () => {
  it('200 + { data: [...] } 반환', async () => {
    const res = await request(app).get('/api/todos').set(auth(tokenA));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('본인 할일만 반환된다', async () => {
    await createTodo(tokenA, { title: 'A의 할일' });
    await createTodo(tokenB, { title: 'B의 할일' });

    const res = await request(app).get('/api/todos').set(auth(tokenA));
    const titles = res.body.data.map((t) => t.title);
    expect(titles.some((t) => t === 'A의 할일')).toBe(true);
    expect(titles.every((t) => t !== 'B의 할일')).toBe(true);
  });

  it('기본 정렬은 created_at DESC이다', async () => {
    const res = await request(app).get('/api/todos').set(auth(tokenA));
    const dates = res.body.data.map((t) => new Date(t.created_at).getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
    }
  });

  it('?category_id= 필터링이 동작한다', async () => {
    await createTodo(tokenA, { title: '카테고리 필터 테스트' });
    const res = await request(app)
      .get(`/api/todos?category_id=${defaultCategoryId}`)
      .set(auth(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.data.every((t) => t.category_id === defaultCategoryId)).toBe(true);
  });

  it('?is_completed=false 필터링이 동작한다', async () => {
    const res = await request(app).get('/api/todos?is_completed=false').set(auth(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.data.every((t) => t.is_completed === false)).toBe(true);
  });

  it('?overdue=true 필터링이 동작한다 (미완료 기간 초과)', async () => {
    await createTodo(tokenA, { title: '기간 초과 할일', due_date: '2020-01-01' });
    const res = await request(app).get('/api/todos?overdue=true').set(auth(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((t) => !t.is_completed)).toBe(true);
  });
});

// ── 등록 ─────────────────────────────────────────────────────────────────────

describe('POST /api/todos', () => {
  it('201 + 생성된 할일 전체 반환', async () => {
    const res = await createTodo(tokenA, { title: '새 할일' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe('새 할일');
    expect(res.body.user_id).toBeDefined();
  });

  it('title 누락 시 400', async () => {
    const res = await request(app).post('/api/todos')
      .set(auth(tokenA)).send({ category_id: defaultCategoryId });
    expect(res.status).toBe(400);
  });

  it('category_id 누락 시 400', async () => {
    const res = await request(app).post('/api/todos')
      .set(auth(tokenA)).send({ title: '제목' });
    expect(res.status).toBe(400);
  });

  it('존재하지 않는 category_id이면 400', async () => {
    const res = await request(app).post('/api/todos')
      .set(auth(tokenA)).send({ title: '제목', category_id: 999999 });
    expect(res.status).toBe(400);
  });

  it('due_date가 잘못된 형식이면 400', async () => {
    const res = await createTodo(tokenA, { due_date: '2026/12/31' });
    expect(res.status).toBe(400);
  });

  it('YYYY-MM-DD 형식의 due_date는 허용된다', async () => {
    const res = await createTodo(tokenA, { due_date: '2026-12-31' });
    expect(res.status).toBe(201);
    expect(res.body.due_date).toBe('2026-12-31');
  });
});

// ── 단건 조회 ────────────────────────────────────────────────────────────────

describe('GET /api/todos/:id', () => {
  let todoId;

  beforeAll(async () => {
    const res = await createTodo(tokenA, { title: '단건 조회 테스트' });
    todoId = res.body.id;
  });

  it('200 + 할일 반환', async () => {
    const res = await request(app).get(`/api/todos/${todoId}`).set(auth(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(todoId);
  });

  it('존재하지 않는 ID는 404', async () => {
    const res = await request(app).get('/api/todos/9999999').set(auth(tokenA));
    expect(res.status).toBe(404);
  });

  it('다른 사용자 할일에 접근하면 403', async () => {
    const res = await request(app).get(`/api/todos/${todoId}`).set(auth(tokenB));
    expect(res.status).toBe(403);
  });
});

// ── 수정 ─────────────────────────────────────────────────────────────────────

describe('PUT /api/todos/:id', () => {
  let todoId;

  beforeAll(async () => {
    const res = await createTodo(tokenA, { title: '수정 전 제목' });
    todoId = res.body.id;
  });

  it('200 + 수정된 할일 반환', async () => {
    const res = await request(app).put(`/api/todos/${todoId}`)
      .set(auth(tokenA))
      .send({ title: '수정 후 제목', category_id: defaultCategoryId });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('수정 후 제목');
  });

  it('updated_at이 갱신된다', async () => {
    const before = (await request(app).get(`/api/todos/${todoId}`).set(auth(tokenA))).body.updated_at;
    await new Promise((r) => setTimeout(r, 10));
    await request(app).put(`/api/todos/${todoId}`)
      .set(auth(tokenA)).send({ title: '또 수정', category_id: defaultCategoryId });
    const after = (await request(app).get(`/api/todos/${todoId}`).set(auth(tokenA))).body.updated_at;
    expect(new Date(after).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());
  });

  it('존재하지 않는 ID는 404', async () => {
    const res = await request(app).put('/api/todos/9999999')
      .set(auth(tokenA)).send({ title: 'T', category_id: defaultCategoryId });
    expect(res.status).toBe(404);
  });

  it('다른 사용자 할일 수정 시도는 403', async () => {
    const res = await request(app).put(`/api/todos/${todoId}`)
      .set(auth(tokenB)).send({ title: 'T', category_id: defaultCategoryId });
    expect(res.status).toBe(403);
  });
});

// ── 완료 토글 ────────────────────────────────────────────────────────────────

describe('PATCH /api/todos/:id/complete', () => {
  let todoId;

  beforeAll(async () => {
    const res = await createTodo(tokenA, { title: '토글 테스트' });
    todoId = res.body.id;
  });

  it('200 + { id, is_completed, updated_at } 반환', async () => {
    const res = await request(app).patch(`/api/todos/${todoId}/complete`).set(auth(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(todoId);
    expect(typeof res.body.is_completed).toBe('boolean');
    expect(res.body.updated_at).toBeDefined();
  });

  it('is_completed가 TRUE ↔ FALSE로 토글된다', async () => {
    const first = await request(app).patch(`/api/todos/${todoId}/complete`).set(auth(tokenA));
    const second = await request(app).patch(`/api/todos/${todoId}/complete`).set(auth(tokenA));
    expect(second.body.is_completed).toBe(!first.body.is_completed);
  });

  it('존재하지 않는 ID는 404', async () => {
    const res = await request(app).patch('/api/todos/9999999/complete').set(auth(tokenA));
    expect(res.status).toBe(404);
  });

  it('다른 사용자 할일 토글 시도는 403', async () => {
    const res = await request(app).patch(`/api/todos/${todoId}/complete`).set(auth(tokenB));
    expect(res.status).toBe(403);
  });
});

// ── 삭제 ─────────────────────────────────────────────────────────────────────

describe('DELETE /api/todos/:id', () => {
  it('204 No Content 반환', async () => {
    const todo = await createTodo(tokenA, { title: '삭제 테스트' });
    const res = await request(app).delete(`/api/todos/${todo.body.id}`).set(auth(tokenA));
    expect(res.status).toBe(204);
  });

  it('삭제 후 조회하면 404', async () => {
    const todo = await createTodo(tokenA, { title: '삭제 후 조회' });
    await request(app).delete(`/api/todos/${todo.body.id}`).set(auth(tokenA));
    const res = await request(app).get(`/api/todos/${todo.body.id}`).set(auth(tokenA));
    expect(res.status).toBe(404);
  });

  it('존재하지 않는 ID는 404', async () => {
    const res = await request(app).delete('/api/todos/9999999').set(auth(tokenA));
    expect(res.status).toBe(404);
  });

  it('다른 사용자 할일 삭제 시도는 403', async () => {
    const todo = await createTodo(tokenA, { title: '403 삭제 테스트' });
    const res = await request(app).delete(`/api/todos/${todo.body.id}`).set(auth(tokenB));
    expect(res.status).toBe(403);
  });
});
