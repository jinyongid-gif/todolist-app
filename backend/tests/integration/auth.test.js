const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const db = require('../../src/config/db');

const TEST_EMAIL_PREFIX = 'be04-test-';
const TEST_DOMAIN = '@test-be04.example.com';

function testEmail(suffix) {
  return `${TEST_EMAIL_PREFIX}${suffix}${TEST_DOMAIN}`;
}

afterAll(async () => {
  await db.query(`DELETE FROM users WHERE email LIKE '%${TEST_DOMAIN}'`);
  await db.end();
});

describe('POST /api/auth/register', () => {
  it('201 + 사용자 정보(비밀번호 미포함)를 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail('register1'), password: 'password123', name: '홍길동' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.email).toBe(testEmail('register1'));
    expect(res.body.name).toBe('홍길동');
    expect(res.body.password).toBeUndefined();
  });

  it('created_at 필드가 반환된다', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail('register2'), password: 'pw', name: '김철수' });

    expect(res.body.created_at).toBeDefined();
  });

  it('이미 등록된 이메일이면 409를 반환한다', async () => {
    const email = testEmail('dup');
    await request(app).post('/api/auth/register').send({ email, password: 'pw', name: '중복' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'pw2', name: '중복2' });

    expect(res.status).toBe(409);
  });

  it('email 누락 시 400을 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'pw', name: '이름' });

    expect(res.status).toBe(400);
  });

  it('password 누락 시 400을 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail('nopw'), name: '이름' });

    expect(res.status).toBe(400);
  });

  it('name 누락 시 400을 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail('noname'), password: 'pw' });

    expect(res.status).toBe(400);
  });

  it('유효하지 않은 이메일 형식이면 400을 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'pw', name: '이름' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  const loginEmail = testEmail('login-user');
  const loginPassword = 'login-test-pw-1234';

  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: loginEmail, password: loginPassword, name: '로그인유저' });
  });

  it('200 + access_token, token_type, user를 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: loginEmail, password: loginPassword });

    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
    expect(res.body.token_type).toBe('Bearer');
    expect(res.body.user.email).toBe(loginEmail);
    expect(res.body.user.password).toBeUndefined();
  });

  it('JWT payload에 user_id와 email이 포함된다', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: loginEmail, password: loginPassword });

    const decoded = jwt.decode(res.body.access_token);
    expect(decoded.user_id).toBeDefined();
    expect(decoded.email).toBe(loginEmail);
  });

  it('존재하지 않는 이메일이면 401을 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail('nonexistent-xyz'), password: 'pw' });

    expect(res.status).toBe(401);
  });

  it('비밀번호 불일치 시 401을 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: loginEmail, password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('이메일 미존재와 비밀번호 불일치의 에러 메시지가 동일하다', async () => {
    const res1 = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail('nobody'), password: 'pw' });

    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ email: loginEmail, password: 'wrong' });

    expect(res1.body.message).toBe(res2.body.message);
  });

  it('email 누락 시 400을 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'pw' });

    expect(res.status).toBe(400);
  });

  it('password 누락 시 400을 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: loginEmail });

    expect(res.status).toBe(400);
  });

  it('발급된 토큰으로 JWT 검증이 성공한다', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: loginEmail, password: loginPassword });

    const secret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
    expect(() => jwt.verify(res.body.access_token, secret)).not.toThrow();
  });
});
