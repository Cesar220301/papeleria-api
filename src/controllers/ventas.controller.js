const { serializeVenta } = require('../utils/serializers');
const { parsePagination, buildPagination } = require('../utils/pagination');
const ventasService = require('../services/ventas.service');

async function listarVentas(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const [total, ventas] = await Promise.all([
      ventasService.obtenerTotalVentas(),
      ventasService.listarVentasPaginadas({ skip, limit })
    ]);

    return res.status(200).json({
      data: ventas.map(serializeVenta),
      pagination: buildPagination({ page, limit, total })
    });
  } catch (error) {
    return next(error);
  }
}

async function obtenerVenta(req, res, next) {
  try {
    const venta = await ventasService.obtenerVentaPorId(req.params.id);

    return res.status(200).json({
      data: serializeVenta(venta)
    });
  } catch (error) {
    return next(error);
  }
}

async function crearVenta(req, res, next) {
  try {
    const venta = await ventasService.crearVenta(req.body);

    return res.status(201)
      .location(`/api/v1/ventas/${venta.id}`)
      .json({
        data: serializeVenta(venta)
      });
  } catch (error) {
    return next(error);
  }
}

async function reemplazarVenta(req, res, next) {
  try {
    const venta = await ventasService.actualizarVenta(req.params.id, req.body);

    return res.status(200).json({
      data: serializeVenta(venta)
    });
  } catch (error) {
    return next(error);
  }
}

async function actualizarVenta(req, res, next) {
  try {
    const venta = await ventasService.actualizarVenta(req.params.id, req.body);

    return res.status(200).json({
      data: serializeVenta(venta)
    });
  } catch (error) {
    return next(error);
  }
}

async function eliminarVenta(req, res, next) {
  try {
    await ventasService.eliminarVenta(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listarVentas,
  obtenerVenta,
  crearVenta,
  reemplazarVenta,
  actualizarVenta,
  eliminarVenta
};
