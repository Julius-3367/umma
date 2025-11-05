/*
  Warnings:

  - You are about to drop the column `certificateNo` on the `certificates` table. All the data in the column will be lost.
  - You are about to drop the column `completionDate` on the `certificates` table. All the data in the column will be lost.
  - You are about to drop the column `courseTitle` on the `certificates` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `certificates` table. All the data in the column will be lost.
  - You are about to drop the column `signatureData` on the `certificates` table. All the data in the column will be lost.
  - You are about to drop the column `traineeName` on the `certificates` table. All the data in the column will be lost.
  - You are about to drop the column `trainerName` on the `certificates` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `certificates` table. All the data in the column will be lost.
  - You are about to drop the column `verificationCode` on the `certificates` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[certificateNumber]` on the table `certificates` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,enrollmentId]` on the table `certificates` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `certificateNumber` to the `certificates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issueDate` to the `certificates` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `certificates_certificateNo_key` ON `certificates`;

-- DropIndex
DROP INDEX `certificates_tenantId_traineeName_idx` ON `certificates`;

-- DropIndex
DROP INDEX `certificates_verificationCode_key` ON `certificates`;

-- AlterTable
ALTER TABLE `certificates` DROP COLUMN `certificateNo`,
    DROP COLUMN `completionDate`,
    DROP COLUMN `courseTitle`,
    DROP COLUMN `createdBy`,
    DROP COLUMN `signatureData`,
    DROP COLUMN `traineeName`,
    DROP COLUMN `trainerName`,
    DROP COLUMN `updatedBy`,
    DROP COLUMN `verificationCode`,
    ADD COLUMN `certificateNumber` VARCHAR(191) NOT NULL,
    ADD COLUMN `digitalSignature` TEXT NULL,
    ADD COLUMN `expiryDate` DATETIME(3) NULL,
    ADD COLUMN `grade` VARCHAR(191) NULL,
    ADD COLUMN `issueDate` DATETIME(3) NOT NULL,
    ADD COLUMN `issuedBy` INTEGER NULL,
    ADD COLUMN `qrCode` TEXT NULL,
    ADD COLUMN `remarks` TEXT NULL,
    ADD COLUMN `status` ENUM('PENDING', 'ISSUED', 'REVOKED', 'EXPIRED', 'REISSUED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `templateId` INTEGER NULL,
    MODIFY `courseId` INTEGER NULL;

-- CreateTable
CREATE TABLE `certificate_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `design` JSON NULL,
    `content` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdBy` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `certificate_templates_tenantId_name_key`(`tenantId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `certificates_certificateNumber_key` ON `certificates`(`certificateNumber`);

-- CreateIndex
CREATE INDEX `certificates_tenantId_status_idx` ON `certificates`(`tenantId`, `status`);

-- CreateIndex
CREATE INDEX `certificates_certificateNumber_idx` ON `certificates`(`certificateNumber`);

-- CreateIndex
CREATE UNIQUE INDEX `certificates_tenantId_enrollmentId_key` ON `certificates`(`tenantId`, `enrollmentId`);
