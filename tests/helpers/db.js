const prisma = require('../../src/lib/prisma');

async function crearProductoBase(overrides = {}) {
  return prisma.producto.create({
    data: {
      nombre: 'Producto base',
      precio: 25.5,
      stock: 10,
      ...overrides
    }
  });
}

module.exports = {
  prisma,
  crearProductoBase
};
