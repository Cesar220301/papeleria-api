const { Prisma } = require('@prisma/client');
const prisma = require('../lib/prisma');
const { AppError } = require('../errors/app-error');

const IVA_RATE = new Prisma.Decimal(process.env.IVA_RATE || '0.16');
const DECIMAL_ZERO = new Prisma.Decimal(0);

function calcularTotales(precioUnitario, cantidad) {
  const subtotal = precioUnitario
    .mul(cantidad)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  const iva = subtotal
    .mul(IVA_RATE)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  const total = subtotal
    .plus(iva)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  return { subtotal, iva, total };
}

function agregarCantidadesPorProducto(items) {
  const cantidades = new Map();

  for (const item of items) {
    const acumulado = cantidades.get(item.productoId) || 0;
    cantidades.set(item.productoId, acumulado + item.cantidad);
  }

  return cantidades;
}

function sumarTotales(detalles) {
  return detalles.reduce((acumulado, detalle) => ({
    subtotal: acumulado.subtotal
      .plus(detalle.subtotal)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
    iva: acumulado.iva
      .plus(detalle.iva)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
    total: acumulado.total
      .plus(detalle.total)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
  }), {
    subtotal: DECIMAL_ZERO,
    iva: DECIMAL_ZERO,
    total: DECIMAL_ZERO
  });
}

async function prepararDetalles(tx, items) {
  const cantidadesPorProducto = agregarCantidadesPorProducto(items);
  const productoIds = Array.from(cantidadesPorProducto.keys());

  const productos = await tx.producto.findMany({
    where: { id: { in: productoIds } }
  });

  const productosPorId = new Map(productos.map((producto) => [producto.id, producto]));

  if (productos.length !== productoIds.length) {
    const productoFaltante = productoIds.find((id) => !productosPorId.has(id));
    throw new AppError(404, 'NOT_FOUND', `Producto no encontrado: ${productoFaltante}`);
  }

  const detalles = [];

  for (const [productoId, cantidad] of cantidadesPorProducto.entries()) {
    const producto = productosPorId.get(productoId);

    if (producto.stock < cantidad) {
      throw new AppError(409, 'CONFLICT', 'Stock insuficiente para registrar la venta');
    }

    const precioUnitario = new Prisma.Decimal(producto.precio);
    const { subtotal, iva, total } = calcularTotales(precioUnitario, cantidad);

    detalles.push({
      productoId,
      cantidad,
      precioUnitario,
      subtotal,
      iva,
      total
    });
  }

  return detalles;
}

async function descontarStock(tx, detalles) {
  for (const detalle of detalles) {
    const updated = await tx.producto.updateMany({
      where: {
        id: detalle.productoId,
        stock: {
          gte: detalle.cantidad
        }
      },
      data: {
        stock: {
          decrement: detalle.cantidad
        }
      }
    });

    if (updated.count !== 1) {
      throw new AppError(409, 'CONFLICT', 'Stock insuficiente para registrar la venta');
    }
  }
}

async function reponerStock(tx, detalles) {
  for (const detalle of detalles) {
    await tx.producto.update({
      where: { id: detalle.productoId },
      data: {
        stock: {
          increment: detalle.cantidad
        }
      }
    });
  }
}

async function obtenerVentaConDetalles(tx, ventaId) {
  return tx.venta.findUnique({
    where: { id: ventaId },
    include: {
      detalles: {
        orderBy: { id: 'asc' }
      }
    }
  });
}

async function listarVentasPaginadas({ skip, limit }) {
  return prisma.venta.findMany({
    orderBy: { id: 'asc' },
    skip,
    take: limit,
    include: {
      detalles: {
        orderBy: { id: 'asc' }
      }
    }
  });
}

async function obtenerTotalVentas() {
  return prisma.venta.count();
}

async function obtenerVentaPorId(id) {
  const venta = await obtenerVentaConDetalles(prisma, id);

  if (!venta) {
    throw new AppError(404, 'NOT_FOUND', 'Venta no encontrada');
  }

  return venta;
}

async function crearVenta(data) {
  return prisma.$transaction(async (tx) => {
    const detalles = await prepararDetalles(tx, data.items);
    const { subtotal, iva, total } = sumarTotales(detalles);

    const venta = await tx.venta.create({
      data: {
        subtotal,
        iva,
        total,
        fecha: data.fecha ? new Date(data.fecha) : undefined
      }
    });

    await tx.ventaDetalle.createMany({
      data: detalles.map((detalle) => ({
        ventaId: venta.id,
        productoId: detalle.productoId,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
        subtotal: detalle.subtotal,
        iva: detalle.iva,
        total: detalle.total
      }))
    });

    await descontarStock(tx, detalles);

    return obtenerVentaConDetalles(tx, venta.id);
  });
}

async function actualizarVenta(ventaId, payload) {
  return prisma.$transaction(async (tx) => {
    const ventaActual = await obtenerVentaConDetalles(tx, ventaId);

    if (!ventaActual) {
      throw new AppError(404, 'NOT_FOUND', 'Venta no encontrada');
    }

    const nuevaFecha = payload.fecha ? new Date(payload.fecha) : undefined;

    if (!payload.items) {
      return tx.venta.update({
        where: { id: ventaId },
        data: {
          fecha: nuevaFecha
        },
        include: {
          detalles: {
            orderBy: { id: 'asc' }
          }
        }
      });
    }

    await reponerStock(tx, ventaActual.detalles);
    const detalles = await prepararDetalles(tx, payload.items);
    const { subtotal, iva, total } = sumarTotales(detalles);

    await tx.venta.update({
      where: { id: ventaId },
      data: {
        subtotal,
        iva,
        total,
        fecha: nuevaFecha || ventaActual.fecha
      }
    });

    await tx.ventaDetalle.deleteMany({
      where: { ventaId }
    });

    await tx.ventaDetalle.createMany({
      data: detalles.map((detalle) => ({
        ventaId,
        productoId: detalle.productoId,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
        subtotal: detalle.subtotal,
        iva: detalle.iva,
        total: detalle.total
      }))
    });

    await descontarStock(tx, detalles);

    return obtenerVentaConDetalles(tx, ventaId);
  });
}

async function eliminarVenta(ventaId) {
  return prisma.$transaction(async (tx) => {
    const venta = await obtenerVentaConDetalles(tx, ventaId);

    if (!venta) {
      throw new AppError(404, 'NOT_FOUND', 'Venta no encontrada');
    }

    await reponerStock(tx, venta.detalles);

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
