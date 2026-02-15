const { ZodError } = require('zod');
const { Prisma } = require('@prisma/client');
const { AppError } = require('../errors/app-error');

function notFoundHandler(req, res, next) {
  next(new AppError(404, 'NOT_FOUND', 'Ruta no encontrada'));
}

function errorHandler(error, req, res, next) {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'JSON invalido'
      }
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos de entrada invalidos',
        details: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      }
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Recurso no encontrado'
        }
      });
    }

    if (error.code === 'P2003') {
      return res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: 'No se puede completar la operacion por integridad referencial'
        }
      });
    }
  }

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor'
    }
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
