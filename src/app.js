const express = require('express');
const cors = require('cors');
const fs = require('fs');
const morgan = require('morgan');
const path = require('path');
const yaml = require('js-yaml');
const swaggerUi = require('swagger-ui-express');
const productosRoutes = require('./routes/productos.routes');
const ventasRoutes = require('./routes/ventas.routes');
const { errorHandler, notFoundHandler } = require('./middlewares/error-handler');

const app = express();
const corsOrigins = process.env.CORS_ORIGIN;
const corsCredentials = process.env.CORS_CREDENTIALS === 'true';
const parsedOrigins = corsOrigins
  ? corsOrigins.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];
const allowsAnyOrigin = parsedOrigins.length === 0 || parsedOrigins.includes('*');

let corsOriginOption = allowsAnyOrigin ? '*' : parsedOrigins;
if (corsCredentials && allowsAnyOrigin) {
  corsOriginOption = true;
}

const corsOptions = {
  origin: corsOriginOption,
  credentials: corsCredentials
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

const openApiPath = path.resolve(__dirname, '../docs/openapi.yaml');
const openApiDocument = yaml.load(fs.readFileSync(openApiPath, 'utf8'));

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    data: {
      status: 'ok'
    }
  });
});

app.get('/api-docs/openapi.yaml', (req, res) => {
  res.type('application/yaml');
  res.sendFile(openApiPath);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { explorer: true }));

app.use('/api/v1/productos', productosRoutes);
app.use('/api/v1/ventas', ventasRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
