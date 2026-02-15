# Documentacion de la API

La especificacion formal esta en `openapi.yaml`.

## Como usar

1. Abre https://editor.swagger.io/
2. Carga el archivo `docs/openapi.yaml`
3. Explora contratos, respuestas y errores por endpoint

Tambien puedes abrir Swagger UI local en:

- `http://localhost:3000/api-docs`

## Cobertura de la especificacion

- Health check
- CRUD de productos (listado paginado con `page` y `limit`)
- CRUD de ventas (listado paginado con `page` y `limit`)
- Esquemas de request/response
- Errores `400`, `404` y `409`
