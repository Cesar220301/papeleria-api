const { AppError } = require('../errors/app-error');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function parsePagination(query) {
  const page = query.page === undefined ? DEFAULT_PAGE : Number(query.page);
  const limit = query.limit === undefined ? DEFAULT_LIMIT : Number(query.limit);
  const details = [];

  if (!Number.isInteger(page) || page < 1) {
    details.push({ field: 'page', message: 'page debe ser un entero mayor o igual a 1' });
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    details.push({
      field: 'limit',
      message: `limit debe ser un entero entre 1 y ${MAX_LIMIT}`
    });
  }

  if (details.length > 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Parametros de paginacion invalidos', details);
  }

  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
}

function buildPagination({ page, limit, total }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

module.exports = {
  parsePagination,
  buildPagination
};
