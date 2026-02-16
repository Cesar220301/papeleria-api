-- CreateTable
CREATE TABLE `VentaDetalle` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ventaId` INTEGER NOT NULL,
    `productoId` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `precioUnitario` DECIMAL(10, 2) NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `iva` DECIMAL(10, 2) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VentaDetalle_ventaId_idx`(`ventaId`),
    INDEX `VentaDetalle_productoId_idx`(`productoId`),
    UNIQUE INDEX `VentaDetalle_ventaId_productoId_key`(`ventaId`, `productoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill existing one-product sales into detail rows
INSERT INTO `VentaDetalle` (
    `ventaId`,
    `productoId`,
    `cantidad`,
    `precioUnitario`,
    `subtotal`,
    `iva`,
    `total`,
    `createdAt`,
    `updatedAt`
)
SELECT
    `id` AS `ventaId`,
    `productoId`,
    `cantidadVendida` AS `cantidad`,
    CASE
        WHEN `cantidadVendida` = 0 THEN 0
        ELSE ROUND(`subtotal` / `cantidadVendida`, 2)
    END AS `precioUnitario`,
    `subtotal`,
    `iva`,
    `total`,
    `createdAt`,
    `updatedAt`
FROM `Venta`;

-- Drop old 1:N relation columns from Venta
ALTER TABLE `Venta` DROP FOREIGN KEY `Venta_productoId_fkey`;
ALTER TABLE `Venta` DROP INDEX `Venta_productoId_idx`;
ALTER TABLE `Venta` DROP COLUMN `productoId`;
ALTER TABLE `Venta` DROP COLUMN `cantidadVendida`;

-- AddForeignKey
ALTER TABLE `VentaDetalle` ADD CONSTRAINT `VentaDetalle_ventaId_fkey` FOREIGN KEY (`ventaId`) REFERENCES `Venta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `VentaDetalle` ADD CONSTRAINT `VentaDetalle_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `Producto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
