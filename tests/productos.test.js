const request = require('supertest');
const app = require('../src/app');
const { prisma, crearProductoBase } = require('./helpers/db');

describe('Productos API', () => {
  it('POST /api/v1/productos crea producto valido', async () => {
    const response = await request(app)
      .post('/api/v1/productos')
      .send({ nombre: 'Cuaderno', precio: 45.5, stock: 100 });

    expect(response.statusCode).toBe(201);
    expect(response.body.data).toMatchObject({
      nombre: 'Cuaderno',
      precio: 45.5,
      stock: 100
    });
  });

  it('POST /api/v1/productos retorna 400 con precio invalido', async () => {
    const response = await request(app)
      .post('/api/v1/productos')
      .send({ nombre: 'Pluma', precio: -1, stock: 10 });

    expect(response.statusCode).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('DELETE /api/v1/productos/:id retorna 409 si tiene ventas', async () => {
    const producto = await crearProductoBase({ stock: 20 });

    await request(app)
      .post('/api/v1/ventas')
      .send({ items: [{ productoId: producto.id, cantidad: 2 }] })
      .expect(201);

    const response = await request(app).delete(`/api/v1/productos/${producto.id}`);

    expect(response.statusCode).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');

    const persisted = await prisma.producto.findUnique({ where: { id: producto.id } });
    expect(persisted).not.toBeNull();
  });

  it('GET /api/v1/productos retorna datos paginados sin meta', async () => {
    await crearProductoBase({ nombre: 'A', stock: 5 });
    await crearProductoBase({ nombre: 'B', stock: 6 });
    await crearProductoBase({ nombre: 'C', stock: 7 });

    const response = await request(app).get('/api/v1/productos?page=2&limit=2');

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.pagination).toMatchObject({
      page: 2,
      limit: 2,
      total: 3,
      totalPages: 2,
      hasNext: false,
      hasPrev: true
    });
    expect(response.body.meta).toBeUndefined();
  });

  it('GET /api/v1/productos retorna 400 si page o limit son invalidos', async () => {
    const response = await request(app).get('/api/v1/productos?page=0&limit=200');

    expect(response.statusCode).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'page' }),
        expect.objectContaining({ field: 'limit' })
      ])
    );
  });
});
