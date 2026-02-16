const { z } = require('zod');

const isIsoDate = (value) => !Number.isNaN(Date.parse(value));
const productoUnicoPorItem = (items) => new Set(items.map((item) => item.productoId)).size === items.length;

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive('id debe ser un entero positivo')
}).strict();

const ventaItemSchema = z.object({
  productoId: z.coerce.number().int('productoId debe ser entero').positive('productoId debe ser positivo'),
  cantidad: z.coerce.number().int('cantidad debe ser entero').positive('cantidad debe ser mayor a 0')
}).strict();

const ventaItemsSchema = z.array(ventaItemSchema)
  .min(1, 'items debe contener al menos un elemento')
  .refine(productoUnicoPorItem, 'No se permite repetir productoId dentro de items');

const ventaBaseSchema = {
  items: ventaItemsSchema,
  fecha: z.string().refine(isIsoDate, 'fecha debe ser ISO 8601 valida').optional()
};

const createVentaSchema = z.object(ventaBaseSchema).strict();

const putVentaSchema = z.object(ventaBaseSchema).strict();

const patchVentaSchema = z.object({
  items: ventaItemsSchema.optional(),
  fecha: ventaBaseSchema.fecha
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'Debe enviar al menos un campo para actualizar',
  path: []
});

module.exports = {
  idParamsSchema,
  createVentaSchema,
  putVentaSchema,
  patchVentaSchema
};
