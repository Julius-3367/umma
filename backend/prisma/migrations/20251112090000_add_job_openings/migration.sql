-- CreateTable
CREATE TABLE `job_openings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NOT NULL,
    `recruiterId` INTEGER NULL,
    `jobTitle` VARCHAR(191) NOT NULL,
    `employerName` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `jobType` VARCHAR(191) NULL,
    `priority` VARCHAR(191) NULL,
    `openings` INTEGER NULL DEFAULT 1,
    `salaryRange` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `interviewDate` DATETIME(3) NULL,
    `description` TEXT NULL,
    `requirements` TEXT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `job_openings_tenantId_status_idx`(`tenantId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
