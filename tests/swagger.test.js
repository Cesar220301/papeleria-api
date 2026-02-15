const request = require('supertest');
const app = require('../src/app');

describe('Swagger UI', () => {
  it('GET /api-docs/ responde con la interfaz HTML', async () => {
    const response = await request(app).get('/api-docs/');

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('Swagger UI');
  });

  it('GET /api-docs/openapi.yaml responde con la especificacion', async () => {
    const response = await request(app).get('/api-docs/openapi.yaml');

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('openapi: 3.0.3');
  });
});
