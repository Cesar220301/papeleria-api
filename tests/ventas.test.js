const request = require('supertest');
const app = require('../src/app');
const { prisma, crearProductoBase } = require('./helpers/db');

describe('Ventas API', () => {
  it('POST /api/v1/ventas crea venta con multiples productos y descuenta stock', async () => {
    const productoA = await crearProductoBase({ precio: 10.5, stock: 20 });
    const productoB = await crearProductoBase({ precio: 5, stock: 10, nombre: 'Borrador' });

    const response = await request(app)
      .post('/api/v1/ventas')
      .send({
        items: [
          { productoId: productoA.id, cantidad: 3 },
          { productoId: productoB.id, cantidad: 2 }
        ]
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.subtotal).toBe(41.5);
    expect(response.body.data.iva).toBe(6.64);
    expect(response.body.data.total).toBe(48.14);
    expect(response.body.data.items).toHaveLength(2);
    expect(response.body.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productoId: productoA.id,
          cantidad: 3,
          precioUnitario: 10.5,
          subtotal: 31.5,
          iva: 5.04,
          total: 36.54
        }),
        expect.objectContaining({
          productoId: productoB.id,
          cantidad: 2,
          precioUnitario: 5,
          subtotal: 10,
          iva: 1.6,
          total: 11.6
        })
      ])
    );

    const actualizadoA = await prisma.producto.findUnique({ where: { id: productoA.id } });
    const actualizadoB = await prisma.producto.findUnique({ where: { id: productoB.id } });
    expect(actualizadoA.stock).toBe(17);
    expect(actualizadoB.stock).toBe(8);
  });

  it('POST /api/v1/ventas retorna 409 si no hay stock suficiente en algun item', async () => {
    const productoA = await crearProductoBase({ stock: 1 });
    const productoB = await crearProductoBase({ stock: 10, nombre: 'Resaltador' });

    const response = await request(app)
      .post('/api/v1/ventas')
      .send({
        items: [
          { productoId: productoA.id, cantidad: 2 },
          { productoId: productoB.id, cantidad: 1 }
        ]
      });

    expect(response.statusCode).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
  });

  it('POST /api/v1/ventas retorna 404 si algun producto no existe', async () => {
    const response = await request(app)
      .post('/api/v1/ventas')
      .send({ items: [{ productoId: 999999, cantidad: 1 }] });

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('PATCH /api/v1/ventas/:id reemplaza items, ajusta stock y recalcula montos', async () => {
    const productoA = await crearProductoBase({ precio: 12, stock: 20 });
    const productoB = await crearProductoBase({ precio: 8, stock: 20, nombre: 'Plumones' });

    const venta = await request(app)
      .post('/api/v1/ventas')
      .send({ items: [{ productoId: productoA.id, cantidad: 2 }] })
      .expect(201);

    const patched = await request(app)
      .patch(`/api/v1/ventas/${venta.body.data.id}`)
      .send({
        items: [
          { productoId: productoA.id, cantidad: 1 },
          { productoId: productoB.id, cantidad: 3 }
        ]
      });

    expect(patched.statusCode).toBe(200);
    expect(patched.body.data.subtotal).toBe(36);
    expect(patched.body.data.iva).toBe(5.76);
    expect(patched.body.data.total).toBe(41.76);
    expect(patched.body.data.items).toHaveLength(2);

    const actualizadoA = await prisma.producto.findUnique({ where: { id: productoA.id } });
    const actualizadoB = await prisma.producto.findUnique({ where: { id: productoB.id } });
    expect(actualizadoA.stock).toBe(19);
    expect(actualizadoB.stock).toBe(17);
  });

  it('PATCH /api/v1/ventas/:id permite actualizar solo fecha sin tocar stock', async () => {
    const producto = await crearProductoBase({ stock: 10, precio: 20 });

    const venta = await request(app)
      .post('/api/v1/ventas')
      .send({ items: [{ productoId: producto.id, cantidad: 4 }] })
      .expect(201);

    const response = await request(app)
      .patch(`/api/v1/ventas/${venta.body.data.id}`)
      .send({ fecha: '2025-12-10T10:00:00.000Z' });

    expect(response.statusCode).toBe(200);
    expect(new Date(response.body.data.fecha).toISOString()).toBe('2025-12-10T10:00:00.000Z');

    const actualizado = await prisma.producto.findUnique({ where: { id: producto.id } });
    expect(actualizado.stock).toBe(6);
  });

  it('DELETE /api/v1/ventas/:id repone stock de todos los items', async () => {
    const productoA = await crearProductoBase({ stock: 10, precio: 20 });
    const productoB = await crearProductoBase({ stock: 5, precio: 15, nombre: 'Regla' });

    const venta = await request(app)
      .post('/api/v1/ventas')
      .send({
        items: [
          { productoId: productoA.id, cantidad: 4 },
          { productoId: productoB.id, cantidad: 2 }
        ]
      })
      .expect(201);

    await request(app)
      .delete(`/api/v1/ventas/${venta.body.data.id}`)
      .expect(204);

    const actualizadoA = await prisma.producto.findUnique({ where: { id: productoA.id } });
    const actualizadoB = await prisma.producto.findUnique({ where: { id: productoB.id } });
    expect(actualizadoA.stock).toBe(10);
    expect(actualizadoB.stock).toBe(5);
  });

  it('GET /api/v1/ventas retorna datos paginados sin meta', async () => {
    const producto = await crearProductoBase({ stock: 20, precio: 10 });

    await request(app).post('/api/v1/ventas').send({ items: [{ productoId: producto.id, cantidad: 1 }] }).expect(201);
    await request(app).post('/api/v1/ventas').send({ items: [{ productoId: producto.id, cantidad: 1 }] }).expect(201);
    await request(app).post('/api/v1/ventas').send({ items: [{ productoId: producto.id, cantidad: 1 }] }).expect(201);

    const response = await request(app).get('/api/v1/ventas?page=2&limit=2');

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].items).toHaveLength(1);
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

  it('POST /api/v1/ventas retorna 400 si items repite productoId', async () => {
    const producto = await crearProductoBase({ stock: 20, precio: 10 });

    const response = await request(app)
      .post('/api/v1/ventas')
      .send({
        items: [
          { productoId: producto.id, cantidad: 1 },
          { productoId: producto.id, cantidad: 2 }
        ]
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
