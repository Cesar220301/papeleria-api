const { AppError } = require('../errors/app-error');

function formatIssues(issues) {
  return issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message
  }));
}

function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Datos de entrada invalidos', formatIssues(result.error.issues)));
    }

    req.body = result.data;
    return next();
  };
}

function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Parametros invalidos', formatIssues(result.error.issues)));
    }

    req.params = result.data;
    return next();
  };
}

module.exports = {
  validateBody,
  validateParams
};
