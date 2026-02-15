const { z } = require('zod');

const maxTwoDecimals = (value) => /^\d+(\.\d{1,2})?$/.test(String(value));

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive('id debe ser un entero positivo')
}).strict();

const createProductoSchema = z.object({
  nombre: z.string().trim().min(1, 'nombre es requerido').max(255, 'nombre demasiado largo'),
  precio: z.coerce.number().positive('precio debe ser mayor a 0').refine(maxTwoDecimals, 'precio debe tener maximo 2 decimales'),
  stock: z.coerce.number().int('stock debe ser entero').min(0, 'stock no puede ser negativo')
}).strict();

const putProductoSchema = createProductoSchema;

const patchProductoSchema = z.object({
  nombre: z.string().trim().min(1, 'nombre es requerido').max(255, 'nombre demasiado largo').optional(),
  precio: z.coerce.number().positive('precio debe ser mayor a 0').refine(maxTwoDecimals, 'precio debe tener maximo 2 decimales').optional(),
  stock: z.coerce.number().int('stock debe ser entero').min(0, 'stock no puede ser negativo').optional()
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'Debe enviar al menos un campo para actualizar',
  path: []
});

module.exports = {
  idParamsSchema,
  createProductoSchema,
  putProductoSchema,
  patchProductoSchema
};
