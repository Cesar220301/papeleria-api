const request = require('supertest');
const app = require('../src/app');

describe('GET /api/v1/health', () => {
  it('debe responder 200 con estado ok', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.statusCode).toBe(200);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.meta).toBeUndefined();
  });

  it('debe incluir headers CORS', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:5173');

    expect(response.headers['access-control-allow-origin']).toBe('*');
  });
});
