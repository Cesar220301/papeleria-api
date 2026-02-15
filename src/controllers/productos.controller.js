const { serializeProducto } = require('../utils/serializers');
const { parsePagination, buildPagination } = require('../utils/pagination');
const productosService = require('../services/productos.service');

async function listarProductos(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const [total, productos] = await Promise.all([
      productosService.obtenerTotalProductos(),
      productosService.listarProductosPaginados({ skip, limit })
    ]);

    return res.status(200).json({
      data: productos.map(serializeProducto),
      pagination: buildPagination({ page, limit, total })
    });
  } catch (error) {
    return next(error);
  }
}

async function obtenerProducto(req, res, next) {
  try {
    const producto = await productosService.obtenerProductoPorId(req.params.id);

    return res.status(200).json({
      data: serializeProducto(producto)
    });
  } catch (error) {
    return next(error);
  }
}

async function crearProducto(req, res, next) {
  try {
    const producto = await productosService.crearProducto(req.body);

    return res.status(201)
      .location(`/api/v1/productos/${producto.id}`)
      .json({
        data: serializeProducto(producto)
      });
  } catch (error) {
    return next(error);
  }
}

async function reemplazarProducto(req, res, next) {
  try {
    const producto = await productosService.actualizarProductoPorId(req.params.id, req.body);

    return res.status(200).json({
      data: serializeProducto(producto)
    });
  } catch (error) {
    return next(error);
  }
}

async function actualizarProducto(req, res, next) {
  try {
    const producto = await productosService.actualizarProductoPorId(req.params.id, req.body);

    return res.status(200).json({
      data: serializeProducto(producto)
    });
  } catch (error) {
    return next(error);
  }
}

async function eliminarProducto(req, res, next) {
  try {
    await productosService.eliminarProductoPorId(req.params.id);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listarProductos,
  obtenerProducto,
  crearProducto,
  reemplazarProducto,
  actualizarProducto,
  eliminarProducto
};
