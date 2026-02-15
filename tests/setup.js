const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const { prisma } = require('./helpers/db');

beforeEach(async () => {
  await prisma.venta.deleteMany();
  await prisma.producto.deleteMany();
});

afterAll(async () => {
  await prisma.venta.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.$disconnect();
});
