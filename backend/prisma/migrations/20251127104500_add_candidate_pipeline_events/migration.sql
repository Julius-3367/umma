-- CreateTable
CREATE TABLE `candidate_pipeline_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenantId` INTEGER NOT NULL,
    `candidateId` INTEGER NOT NULL,
    `fromStage` ENUM('APPLIED','UNDER_REVIEW','ENROLLED','WAITLISTED','CANCELLED','PLACED') NULL,
    `toStage` ENUM('APPLIED','UNDER_REVIEW','ENROLLED','WAITLISTED','CANCELLED','PLACED') NOT NULL,
    `comment` TEXT NULL,
    `isBlocked` BOOLEAN NOT NULL DEFAULT false,
    `blockerReason` VARCHAR(191) NULL,
    `createdBy` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `candidate_pipeline_events_tenantId_candidateId_idx`(`tenantId`, `candidateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `candidate_pipeline_events` ADD CONSTRAINT `candidate_pipeline_events_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `candidate_pipeline_events` ADD CONSTRAINT `candidate_pipeline_events_candidateId_fkey` FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `candidate_pipeline_events` ADD CONSTRAINT `candidate_pipeline_events_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
