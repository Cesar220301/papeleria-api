const prisma = require('../lib/prisma');
const { AppError } = require('../errors/app-error');

async function listarProductosPaginados({ skip, limit }) {
  return prisma.producto.findMany({
    orderBy: { id: 'asc' },
    skip,
    take: limit
  });
}

async function obtenerTotalProductos() {
  return prisma.producto.count();
}

async function obtenerProductoPorId(id) {
  const producto = await prisma.producto.findUnique({
    where: { id }
  });

  if (!producto) {
    throw new AppError(404, 'NOT_FOUND', 'Producto no encontrado');
  }

  return producto;
}

async function crearProducto(data) {
  return prisma.producto.create({
    data
  });
}

async function actualizarProductoPorId(id, data) {
  return prisma.producto.update({
    where: { id },
    data
  });
}

async function eliminarProductoPorId(id) {
  return prisma.producto.delete({
    where: { id }
  });
}

module.exports = {
  listarProductosPaginados,
  obtenerTotalProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProductoPorId,
  eliminarProductoPorId
};
