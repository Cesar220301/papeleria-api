const request = require('supertest');
const app = require('../src/app');
const { prisma, crearProductoBase } = require('./helpers/db');

describe('Ventas API', () => {
  it('POST /api/v1/ventas crea venta, calcula iva y descuenta stock', async () => {
    const producto = await crearProductoBase({ precio: 10.5, stock: 20 });

    const response = await request(app)
      .post('/api/v1/ventas')
      .send({ productoId: producto.id, cantidadVendida: 3 });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.subtotal).toBe(31.5);
    expect(response.body.data.iva).toBe(5.04);
    expect(response.body.data.total).toBe(36.54);

    const actualizado = await prisma.producto.findUnique({ where: { id: producto.id } });
    expect(actualizado.stock).toBe(17);
  });

  it('POST /api/v1/ventas retorna 409 si no hay stock suficiente', async () => {
    const producto = await crearProductoBase({ stock: 1 });

    const response = await request(app)
      .post('/api/v1/ventas')
      .send({ productoId: producto.id, cantidadVendida: 2 });

    expect(response.statusCode).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
  });

  it('PATCH /api/v1/ventas/:id ajusta stock y recalcula montos', async () => {
    const producto = await crearProductoBase({ precio: 12, stock: 20 });

    const venta = await request(app)
      .post('/api/v1/ventas')
      .send({ productoId: producto.id, cantidadVendida: 2 })
      .expect(201);

    const patched = await request(app)
      .patch(`/api/v1/ventas/${venta.body.data.id}`)
      .send({ cantidadVendida: 5 });

    expect(patched.statusCode).toBe(200);
    expect(patched.body.data.subtotal).toBe(60);
    expect(patched.body.data.iva).toBe(9.6);
    expect(patched.body.data.total).toBe(69.6);

    const actualizado = await prisma.producto.findUnique({ where: { id: producto.id } });
    expect(actualizado.stock).toBe(15);
  });

  it('DELETE /api/v1/ventas/:id repone stock', async () => {
    const producto = await crearProductoBase({ stock: 10, precio: 20 });

    const venta = await request(app)
      .post('/api/v1/ventas')
      .send({ productoId: producto.id, cantidadVendida: 4 })
      .expect(201);

    await request(app)
      .delete(`/api/v1/ventas/${venta.body.data.id}`)
      .expect(204);

    const actualizado = await prisma.producto.findUnique({ where: { id: producto.id } });
    expect(actualizado.stock).toBe(10);
  });

  it('GET /api/v1/ventas retorna datos paginados sin meta', async () => {
    const producto = await crearProductoBase({ stock: 20, precio: 10 });

    await request(app).post('/api/v1/ventas').send({ productoId: producto.id, cantidadVendida: 1 }).expect(201);
    await request(app).post('/api/v1/ventas').send({ productoId: producto.id, cantidadVendida: 1 }).expect(201);
    await request(app).post('/api/v1/ventas').send({ productoId: producto.id, cantidadVendida: 1 }).expect(201);

    const response = await request(app).get('/api/v1/ventas?page=2&limit=2');

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
});
