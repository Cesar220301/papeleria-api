const { z } = require('zod');

const isIsoDate = (value) => !Number.isNaN(Date.parse(value));

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive('id debe ser un entero positivo')
}).strict();

const ventaBaseSchema = {
  productoId: z.coerce.number().int('productoId debe ser entero').positive('productoId debe ser positivo'),
  cantidadVendida: z.coerce.number().int('cantidadVendida debe ser entero').positive('cantidadVendida debe ser mayor a 0'),
  fecha: z.string().refine(isIsoDate, 'fecha debe ser ISO 8601 valida').optional()
};

const createVentaSchema = z.object(ventaBaseSchema).strict();

const putVentaSchema = z.object(ventaBaseSchema).strict();

const patchVentaSchema = z.object({
  productoId: ventaBaseSchema.productoId.optional(),
  cantidadVendida: ventaBaseSchema.cantidadVendida.optional(),
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
