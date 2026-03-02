# API REST de Papeleria | Realizado con IA

API REST con Express + Prisma + MySQL para gestionar productos y ventas de una papeleria y el front(SIN IA) que consume esto esta en https://github.com/Cesar220301/papeleria-front.

## Requisitos

- Docker Desktop
- Node.js 22 (solo para ejecucion local opcional)

## Variables de entorno

- `.env`: configuracion activa (local y docker)
- `.env.example`: plantilla para crear `.env`
- `CORS_ORIGIN`: origenes permitidos separados por coma (ej: `http://localhost:5173,http://localhost:3000`) o `*`
- `CORS_CREDENTIALS`: `true` para enviar cookies/credenciales, `false` por defecto

Crear archivo local:

```bash
cp .env.example .env
```

## Levantar con Docker

```bash
docker compose up --build
```

La API queda en `http://localhost:3000`.

## Documentacion REST

- Especificacion OpenAPI: `docs/openapi.yaml`
- Puedes importar `docs/openapi.yaml` en Swagger Editor o Postman para explorar y probar endpoints.
- Swagger UI en ejecucion: `http://localhost:3000/api-docs`
- YAML servido por la API: `http://localhost:3000/api-docs/openapi.yaml`
- Los listados `GET /api/v1/productos` y `GET /api/v1/ventas` aceptan `page` y `limit`.
- Comandos locales de operacion: `docs/comandos-locales.md`

## Endpoints

- `GET /api/v1/health`
- `GET /api/v1/productos`
- `GET /api/v1/productos/:id`
- `POST /api/v1/productos`
- `PUT /api/v1/productos/:id`
- `PATCH /api/v1/productos/:id`
- `DELETE /api/v1/productos/:id`
- `GET /api/v1/ventas`
- `GET /api/v1/ventas/:id`
- `POST /api/v1/ventas`
- `PUT /api/v1/ventas/:id`
- `PATCH /api/v1/ventas/:id`
- `DELETE /api/v1/ventas/:id`

## Ejemplos rapidos

Crear producto:

```bash
curl -X POST http://localhost:3000/api/v1/productos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Cuaderno","precio":45.50,"stock":100}'
```

Crear venta:

```bash
curl -X POST http://localhost:3000/api/v1/ventas \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productoId":1,"cantidad":2},{"productoId":2,"cantidad":1}]}'
```

Listar productos paginados:

```bash
curl "http://localhost:3000/api/v1/productos?page=1&limit=10"
```

## Ejecucion local (opcional)

En PowerShell usa `npm.cmd` y `npx.cmd`:

```bash
npm.cmd install
npx.cmd prisma migrate dev --name init
npm.cmd start
```

## Tests

La carpeta de pruebas es `tests/` e incluye:

- `tests/health.test.js`
- `tests/productos.test.js`
- `tests/ventas.test.js`

Para ejecutar pruebas:

```bash
docker compose up -d mysql
npm.cmd test
```

Pruebas en modo CI (genera reporte JUnit):

```bash
npm.cmd run test:ci
```

Reporte generado:

- `reports/junit/junit.xml`

## CI Local con Jenkins

Archivos de CI:

- `Jenkinsfile`
- `docker-compose.ci.yml` (MySQL para pruebas de pipeline)
- `infra/jenkins/Dockerfile` (Jenkins con Docker CLI, compose plugin y Node.js)
- `infra/jenkins/docker-compose.jenkins.yml`

Levantar Jenkins local:

```bash
docker compose -f infra/jenkins/docker-compose.jenkins.yml up -d --build
```

Acceso web:

- `http://localhost:8080`

Password inicial:

```bash
docker exec local_jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Plugins minimos para el pipeline:

- `Pipeline`
- `Git`
- `JUnit`

Configuracion del job:

1. Crear `Pipeline` o `Multibranch Pipeline`.
2. Apuntar al repo que contiene este proyecto.
3. Usar `Jenkinsfile` del root.

Ejecucion automatica:

- El `Jenkinsfile` incluye `pollSCM('H/2 * * * *')`.
- Jenkins revisa cambios en `main` cada ~2 minutos y, si detecta commit nuevo, dispara build automaticamente.

Resultado esperado por build:

- Ejecuta `npm ci`
- Levanta `mysql` de `docker-compose.ci.yml`
- Corre `npm run test:ci`
- Publica `reports/junit/junit.xml` en Jenkins
- Si tests pasan, construye imagen local:
  - `papeleria-api:latest`
  - `papeleria-api:build-<BUILD_NUMBER>`
  - `papeleria-api:<git_sha_short>`
- Si tests pasan, despliega automaticamente en Docker local:
  - `docker compose up -d --build api`

## Reglas de negocio

- IVA del 16% calculado automaticamente.
- Una venta puede incluir multiples productos en `items`.
- La venta descuenta stock de cada item.
- Si no hay stock suficiente, retorna `409`.
- Al eliminar una venta se repone el stock de todos sus items.
- No se permite eliminar productos con ventas relacionadas (`409`).
