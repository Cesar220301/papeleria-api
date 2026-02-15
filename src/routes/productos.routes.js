const { Router } = require('express');
const productosController = require('../controllers/productos.controller');
const { validateBody, validateParams } = require('../middlewares/validacion');
const {
  idParamsSchema,
  createProductoSchema,
  putProductoSchema,
  patchProductoSchema
} = require('../schemas/productos.schema');

const router = Router();

router.get('/', productosController.listarProductos);
router.get('/:id', validateParams(idParamsSchema), productosController.obtenerProducto);
router.post('/', validateBody(createProductoSchema), productosController.crearProducto);
router.put('/:id', validateParams(idParamsSchema), validateBody(putProductoSchema), productosController.reemplazarProducto);
router.patch('/:id', validateParams(idParamsSchema), validateBody(patchProductoSchema), productosController.actualizarProducto);
router.delete('/:id', validateParams(idParamsSchema), productosController.eliminarProducto);

module.exports = router;
