const app = require('./app');
const prisma = require('./lib/prisma');

const PORT = Number(process.env.PORT || 3000);

const server = app.listen(PORT, () => {
  console.log(`API escuchando en puerto ${PORT}`);
});

async function shutdown(signal) {
  console.log(`Recibida senal ${signal}. Cerrando servidor...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
