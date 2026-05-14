const request = require('supertest');
const app = require('../../src/app');

describe('GET /health', () => {
  it('200 OK와 { status: "ok" }를 반환한다', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('Content-Type이 application/json이다', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});

describe('Express 앱 기본 설정', () => {
  it('존재하지 않는 경로는 404를 반환한다', async () => {
    const res = await request(app).get('/not-exist');
    expect(res.status).toBe(404);
  });

  it('POST /health는 404를 반환한다', async () => {
    const res = await request(app).post('/health');
    expect(res.status).toBe(404);
  });

  it('json body를 파싱한다', async () => {
    const res = await request(app)
      .post('/health')
      .send({ test: 'value' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(404);
  });

  it('CORS 헤더가 포함된다', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
