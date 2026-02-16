function decimalToNumber(value) {
  if (value === null || value === undefined) {
    return value;
  }

  return Number(value.toString());
}

function serializeProducto(producto) {
  return {
    id: producto.id,
    nombre: producto.nombre,
    precio: decimalToNumber(producto.precio),
    stock: producto.stock,
    createdAt: producto.createdAt,
    updatedAt: producto.updatedAt
  };
}

function serializeVenta(venta) {
  return {
    id: venta.id,
    subtotal: decimalToNumber(venta.subtotal),
    iva: decimalToNumber(venta.iva),
    total: decimalToNumber(venta.total),
    fecha: venta.fecha,
    items: (venta.detalles || []).map((detalle) => ({
      productoId: detalle.productoId,
      cantidad: detalle.cantidad,
      precioUnitario: decimalToNumber(detalle.precioUnitario),
      subtotal: decimalToNumber(detalle.subtotal),
      iva: decimalToNumber(detalle.iva),
      total: decimalToNumber(detalle.total)
    })),
    createdAt: venta.createdAt,
    updatedAt: venta.updatedAt
  };
}

module.exports = {
  serializeProducto,
  serializeVenta
};
