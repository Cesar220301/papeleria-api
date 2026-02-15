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
    productoId: venta.productoId,
    cantidadVendida: venta.cantidadVendida,
    subtotal: decimalToNumber(venta.subtotal),
    iva: decimalToNumber(venta.iva),
    total: decimalToNumber(venta.total),
    fecha: venta.fecha,
    createdAt: venta.createdAt,
    updatedAt: venta.updatedAt
  };
}

module.exports = {
  serializeProducto,
  serializeVenta
};
