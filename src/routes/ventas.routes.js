const { Router } = require('express');
const ventasController = require('../controllers/ventas.controller');
const { validateBody, validateParams } = require('../middlewares/validacion');
const {
  idParamsSchema,
  createVentaSchema,
  putVentaSchema,
  patchVentaSchema
} = require('../schemas/ventas.schema');

const router = Router();

router.get('/', ventasController.listarVentas);
router.get('/:id', validateParams(idParamsSchema), ventasController.obtenerVenta);
router.post('/', validateBody(createVentaSchema), ventasController.crearVenta);
router.put('/:id', validateParams(idParamsSchema), validateBody(putVentaSchema), ventasController.reemplazarVenta);
router.patch('/:id', validateParams(idParamsSchema), validateBody(patchVentaSchema), ventasController.actualizarVenta);
router.delete('/:id', validateParams(idParamsSchema), ventasController.eliminarVenta);

module.exports = router;
