const { Prisma } = require('@prisma/client');
const prisma = require('../lib/prisma');
const { AppError } = require('../errors/app-error');

const IVA_RATE = new Prisma.Decimal(process.env.IVA_RATE || '0.16');

function calcularTotales(precio, cantidadVendida) {
  const subtotal = precio
    .mul(cantidadVendida)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  const iva = subtotal
    .mul(IVA_RATE)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  const total = subtotal
    .plus(iva)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  return { subtotal, iva, total };
}

async function listarVentasPaginadas({ skip, limit }) {
  return prisma.venta.findMany({
    orderBy: { id: 'asc' },
    skip,
    take: limit
  });
}

async function obtenerTotalVentas() {
  return prisma.venta.count();
}

async function obtenerVentaPorId(id) {
  const venta = await prisma.venta.findUnique({
    where: { id }
  });

  if (!venta) {
    throw new AppError(404, 'NOT_FOUND', 'Venta no encontrada');
  }

  return venta;
}

async function crearVenta(data) {
  return prisma.$transaction(async (tx) => {
    const producto = await tx.producto.findUnique({
      where: { id: data.productoId }
    });

    if (!producto) {
      throw new AppError(404, 'NOT_FOUND', 'Producto no encontrado');
    }

    if (producto.stock < data.cantidadVendida) {
      throw new AppError(409, 'CONFLICT', 'Stock insuficiente para registrar la venta');
    }

    const { subtotal, iva, total } = calcularTotales(producto.precio, data.cantidadVendida);

    const venta = await tx.venta.create({
      data: {
        productoId: data.productoId,
        cantidadVendida: data.cantidadVendida,
        subtotal,
        iva,
        total,
        fecha: data.fecha ? new Date(data.fecha) : undefined
      }
    });

    await tx.producto.update({
      where: { id: data.productoId },
      data: {
        stock: {
          decrement: data.cantidadVendida
        }
      }
    });

    return venta;
  });
}

async function actualizarVenta(ventaId, payload) {
  return prisma.$transaction(async (tx) => {
    const ventaActual = await tx.venta.findUnique({
      where: { id: ventaId }
    });

    if (!ventaActual) {
      throw new AppError(404, 'NOT_FOUND', 'Venta no encontrada');
    }

    const nuevoProductoId = payload.productoId ?? ventaActual.productoId;
    const nuevaCantidadVendida = payload.cantidadVendida ?? ventaActual.cantidadVendida;
    const nuevaFecha = payload.fecha ? new Date(payload.fecha) : ventaActual.fecha;

    await tx.producto.update({
      where: { id: ventaActual.productoId },
      data: {
        stock: {
          increment: ventaActual.cantidadVendida
        }
      }
    });

    const productoDestino = await tx.producto.findUnique({
      where: { id: nuevoProductoId }
    });

    if (!productoDestino) {
      throw new AppError(404, 'NOT_FOUND', 'Producto no encontrado para la venta');
    }

    if (productoDestino.stock < nuevaCantidadVendida) {
      throw new AppError(409, 'CONFLICT', 'Stock insuficiente para actualizar la venta');
    }

    const { subtotal, iva, total } = calcularTotales(productoDestino.precio, nuevaCantidadVendida);

    const ventaActualizada = await tx.venta.update({
      where: { id: ventaId },
      data: {
        productoId: nuevoProductoId,
        cantidadVendida: nuevaCantidadVendida,
        subtotal,
        iva,
        total,
        fecha: nuevaFecha
      }
    });

    await tx.producto.update({
      where: { id: nuevoProductoId },
      data: {
        stock: {
          decrement: nuevaCantidadVendida
        }
      }
    });

    return ventaActualizada;
  });
}

async function eliminarVenta(ventaId) {
  return prisma.$transaction(async (tx) => {
    const venta = await tx.venta.findUnique({
      where: { id: ventaId }
    });

    if (!venta) {
      throw new AppError(404, 'NOT_FOUND', 'Venta no encontrada');
    }

    await tx.producto.update({
      where: { id: venta.productoId },
      data: {
        stock: {
          increment: venta.cantidadVendida
        }
      }
    });

    await tx.venta.delete({
      where: { id: ventaId }
    });
  });
}

module.exports = {
  listarVentasPaginadas,
  obtenerTotalVentas,
  obtenerVentaPorId,
  crearVenta,
  actualizarVenta,
  eliminarVenta
};
